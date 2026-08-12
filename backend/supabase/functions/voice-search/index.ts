import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('FRONTEND_URL') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AI_API_URL = Deno.env.get('AI_API_URL') ?? 'http://localhost:8000'

function json(status: number, body: unknown): Response {
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
    const body = await req.json().catch(() => ({}))
    const spokenText = body.spoken_text || body.spokenText || body.query || ''

    if (!spokenText || typeof spokenText !== 'string' || !spokenText.trim()) {
      return json(400, {
        success: false,
        error: { code: 'BAD_REQUEST', message: 'spoken_text must be a non-empty string' }
      })
    }

    const language = body.language || 'auto'

    const response = await fetch(`${AI_API_URL}/api/voice-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ spoken_text: spokenText.trim(), language }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      return json(response.status, {
        success: false,
        error: { code: 'SERVICE_ERROR', message: `Voice service responded with ${response.status}` }
      })
    }

    const data = await response.json()
    return json(200, { success: true, data })
  } catch (error) {
    console.error('Voice search edge function error:', error)
    return json(500, {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Voice search processing failed' }
    })
  }
})
