import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('FRONTEND_URL') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NormalizedMarketPrice {
  crop_name: string
  market_name: string
  location: string | null
  price: number
  unit: string
  currency: string
  price_date: string
  source: string
}

// External provider contract (see backend/README.md):
//   GET ${MARKET_PRICE_API_URL}  Authorization: Bearer ${MARKET_PRICE_API_KEY}
//   response: JSON array of
//     { crop_name: string, market_name?: string, location?: string,
//       price: number, unit?: string, currency?: string,
//       price_date: ISO-8601 string, source?: string }
// Rows that fail normalization (missing crop_name, invalid price/date) are
// dropped. Data is never fabricated server-side.
interface RawMarketPriceProvider {
  fetchPrices(): Promise<unknown>
}

class HttpMarketPriceProvider implements RawMarketPriceProvider {
  async fetchPrices(): Promise<unknown> {
    const url = Deno.env.get('MARKET_PRICE_API_URL') ?? ''
    if (!url) {
      throw new Error('MARKET_PRICE_PROVIDER_NOT_CONFIGURED')
    }

    const apiKey = Deno.env.get('MARKET_PRICE_API_KEY') ?? ''
    const response = await fetch(url, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) {
      throw new Error(`Market price provider responded with status ${response.status}`)
    }

    const payload: unknown = await response.json().catch(() => null)
    if (!Array.isArray(payload)) {
      throw new Error('Market price provider returned an invalid payload')
    }
    return payload
  }
}

function normalizePrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed
    }
  }
  return null
}

function normalize(record: any): NormalizedMarketPrice | null {
  const price = normalizePrice(record?.price)
  if (price === null) return null

  const cropName = typeof record?.crop_name === 'string' ? record.crop_name.trim() : ''
  if (!cropName) return null

  const priceDate = new Date(record?.price_date)
  if (Number.isNaN(priceDate.getTime())) return null

  return {
    crop_name: cropName,
    market_name: typeof record?.market_name === 'string' ? record.market_name.trim() : '',
    location: typeof record?.location === 'string' && record.location.trim() ? record.location.trim() : null,
    price,
    unit: typeof record?.unit === 'string' && record.unit.trim() ? record.unit.trim() : 'kg',
    currency: typeof record?.currency === 'string' && record.currency.trim() ? record.currency.trim() : 'INR',
    price_date: priceDate.toISOString(),
    source: typeof record?.source === 'string' && record.source.trim() ? record.source.trim() : 'external-provider',
  }
}

// Defensive probe for the OPTIONS preflight.
function respondJson(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authorization: secure scheduled invocation via CRON_SECRET.
    //    This endpoint intentionally does NOT accept user JWTs.
    const authHeader = req.headers.get('Authorization')
    const expectedSecret = Deno.env.get('CRON_SECRET')

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return respondJson(401, {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required or invalid' },
      })
    }

    // 2. Fetch raw prices from the configured external provider (never fake data)
    const provider: RawMarketPriceProvider = new HttpMarketPriceProvider()

    let rawPrices: unknown
    try {
      rawPrices = await provider.fetchPrices()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      if (message === 'MARKET_PRICE_PROVIDER_NOT_CONFIGURED') {
        return respondJson(503, {
          success: false,
          error: { code: 'PROVIDER_NOT_CONFIGURED', message: 'MARKET_PRICE_PROVIDER_NOT_CONFIGURED' },
        })
      }
      console.error('Provider fetch failed', error)
      return respondJson(502, {
        success: false,
        error: { code: 'PROVIDER_ERROR', message: 'Market price provider call failed' },
      })
    }

    // 3. Validation & normalization
    const validPrices = (rawPrices as any[])
      .map(normalize)
      .filter((row): row is NormalizedMarketPrice => row !== null)

    if (validPrices.length === 0) {
      return respondJson(200, {
        success: true,
        data: { inserted: 0, message: 'No valid prices fetched' },
      })
    }

    // 4. Persist via service role (read-only for normal users at the DB level).
    //    onConflict matches unq_market_prices_ingestion
    //    (crop_name, market_name, price_date, source) — see migration
    //    20260811000000_market_price_ingestion_normalization.sql.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: insertError } = await supabaseAdmin
      .from('market_prices')
      .upsert(validPrices, {
        onConflict: 'crop_name, market_name, price_date, source',
        ignoreDuplicates: true,
      })

    if (insertError) {
      console.error('DB Insert Error:', insertError.message)
      return respondJson(500, {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to persist market prices' },
      })
    }

    console.log(`market price refresh persisted ${validPrices.length} rows`)

    return respondJson(200, {
      success: true,
      data: { inserted: validPrices.length, message: 'Prices persisted (duplicates ignored)' },
    })
  } catch (error) {
    console.error('Unexpected error', error)
    return respondJson(500, {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' },
    })
  }
})