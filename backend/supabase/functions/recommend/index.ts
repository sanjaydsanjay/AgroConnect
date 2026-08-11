import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('FRONTEND_URL') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// AI service contract (see docs/trd.md + AI service OpenAPI):
//   POST {AI_API_URL}/api/recommend
//   Authorization: Bearer <caller's Supabase JWT>  (validated by the AI service)
//   request:  { latitude, longitude, season, soil_type, irrigation_type, land_size }
//   response: { generated_at, data_source, processed_context,
//               recommendations: [{ crop, score, risk, profit_range,
//                   component_scores, reasoning, confidence, sowing_window,
//                   harvesting_window, irrigation_advisory, producing_states }] }
const AI_API_URL = Deno.env.get('AI_API_URL') ?? ''

interface RecommendRequest {
  latitude: number
  longitude: number
  season: 'kharif' | 'rabi' | 'zaid'
  soil_type: string
  irrigation_type: string
  land_size: number
}

interface AiRecommendation {
  crop: string
  score?: number
  risk?: unknown
  profit_range?: unknown
  component_scores?: unknown
  reasoning?: string
  confidence?: number
  sowing_window?: unknown
  harvesting_window?: unknown
  irrigation_advisory?: unknown
  producing_states?: unknown
}

interface AiRecommendResponse {
  generated_at?: string
  data_source?: string
  processed_context?: unknown
  recommendations: AiRecommendation[]
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

// Validation per AI contract: season domain, geographic ranges, positive land size.
function validateInput(body: any): { ok: true; input: RecommendRequest } | { ok: false; message: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, message: 'Request body must be a JSON object' }
  }

  const latitude = toFiniteNumber(body.latitude)
  const longitude = toFiniteNumber(body.longitude)
  const land_size = toFiniteNumber(body.land_size)
  const season = body.season
  const soil_type = body.soil_type
  const irrigation_type = body.irrigation_type

  if (latitude === null || latitude < -90 || latitude > 90) {
    return { ok: false, message: 'latitude must be a number between -90 and 90' }
  }
  if (longitude === null || longitude < -180 || longitude > 180) {
    return { ok: false, message: 'longitude must be a number between -180 and 180' }
  }
  if (season !== 'kharif' && season !== 'rabi' && season !== 'zaid') {
    return { ok: false, message: 'season must be one of kharif, rabi, zaid' }
  }
  if (typeof soil_type !== 'string' || soil_type.trim() === '') {
    return { ok: false, message: 'soil_type must be a non-empty string' }
  }
  if (typeof irrigation_type !== 'string' || irrigation_type.trim() === '') {
    return { ok: false, message: 'irrigation_type must be a non-empty string' }
  }
  if (land_size === null || land_size <= 0) {
    return { ok: false, message: 'land_size must be a number greater than 0' }
  }

  return {
    ok: true,
    input: {
      latitude,
      longitude,
      season,
      soil_type: soil_type.trim(),
      irrigation_type: irrigation_type.trim(),
      land_size,
    },
  }
}

function validateAiResponse(parsed: unknown): AiRecommendResponse {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('AI service returned an invalid response')
  }
  const recs = (parsed as any).recommendations
  if (!Array.isArray(recs)) {
    throw new Error('AI response is missing a recommendations array')
  }
  for (const item of recs) {
    if (typeof item !== 'object' || item === null || typeof (item as any).crop !== 'string' || !(item as any).crop.trim()) {
      throw new Error('AI recommendation item is missing a valid crop name')
    }
    const score = (item as any).score
    if (score !== undefined && score !== null && (typeof score !== 'number' || !Number.isFinite(score))) {
      throw new Error('AI recommendation item has an invalid score')
    }
  }
  return parsed as AiRecommendResponse
}

// Calls the AI service with the caller's JWT (the AI service validates the token
// itself and returns real intelligence — this function never fabricates scores).
async function callAiService(input: RecommendRequest, accessToken: string): Promise<AiRecommendResponse> {
  const AI_API_KEY = Deno.env.get('AI_API_KEY') ?? ''
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  }
  if (AI_API_KEY) {
    headers['x-api-key'] = AI_API_KEY
  }

  const response = await fetch(`${AI_API_URL}/api/recommend`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(20_000),
  })

  if (!response.ok) {
    throw new Error(`AI service responded with status ${response.status}`)
  }

  const parsed: unknown = await response.json().catch(() => null)
  return validateAiResponse(parsed)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authenticate with the caller's JWT (never trust a role claim in the body)
    const accessToken = req.headers.get('Authorization') ?? ''
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: accessToken } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return json(401, { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } })
    }

    // 2. Verify the farmer role from the database, never from the frontend
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userRecord || userRecord.role !== 'farmer') {
      return json(403, { success: false, error: { code: 'FORBIDDEN', message: 'Only farmers can request recommendations' } })
    }

    // 3. Validate and normalize the input per the AI contract
    const body = await req.json().catch(() => ({}))
    const validated = validateInput(body)
    if (!validated.ok) {
      return json(400, { success: false, error: { code: 'BAD_REQUEST', message: validated.message } })
    }
    const input = validated.input

    // 4. The recommendation FK points at farmer_profiles(user_id);
    //    a profile must exist before we can log a recommendation for this farmer.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('farmer_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return json(409, {
        success: false,
        error: { code: 'PROFILE_REQUIRED', message: 'A farmer profile is required before requesting recommendations' },
      })
    }

    // 5. Persist the request (status = processing)
    const { data: recData, error: recError } = await supabaseAdmin
      .from('crop_recommendations')
      .insert({
        farmer_id: user.id,
        latitude: input.latitude,
        longitude: input.longitude,
        season: input.season,
        soil_type: input.soil_type,
        irrigation_type: input.irrigation_type,
        land_size: input.land_size,
        status: 'processing',
      })
      .select()
      .single()

    if (recError) {
      console.error('DB Insert Error', recError)
      return json(500, { success: false, error: { code: 'INTERNAL_ERROR', message: 'Database insert failed' } })
    }

    const markFailed = async (message: string) => {
      await supabaseAdmin
        .from('crop_recommendations')
        .update({ status: 'failed', processed_context: { error: message } })
        .eq('id', recData.id)
    }

    // 6. AI service availability: never fabricate a result.
    //    Without AI_API_URL this endpoint deliberately degrades.
    if (!AI_API_URL) {
      await markFailed('AI scoring service is not configured')
      return json(503, {
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'AI scoring service is currently unavailable' },
        data: { recommendation_id: recData.id, status: 'failed' },
      })
    }

    let aiResult: AiRecommendResponse
    try {
      aiResult = await callAiService(input, accessToken)
    } catch (error) {
      console.error('AI service call failed', error)
      await markFailed('AI scoring service call failed')
      return json(503, {
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'AI scoring service is currently unavailable' },
        data: { recommendation_id: recData.id, status: 'failed' },
      })
    }

    // 7. Persist the trusted AI result
    const { error: updateError } = await supabaseAdmin
      .from('crop_recommendations')
      .update({
        status: 'completed',
        generated_at: typeof aiResult.generated_at === 'string' ? aiResult.generated_at : null,
        data_source: typeof aiResult.data_source === 'string' ? aiResult.data_source : null,
        processed_context: aiResult.processed_context ?? null,
        recommendations: aiResult.recommendations,
      })
      .eq('id', recData.id)

    if (updateError) {
      console.error('DB Update Error', updateError)
      return json(500, { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to persist recommendation result' } })
    }

    console.log(`recommendation completed for farmer ${user.id}`)

    // 8. Return a normalized response to the frontend
    return json(200, {
      success: true,
      data: {
        recommendation_id: recData.id,
        status: 'completed',
        generated_at: aiResult.generated_at ?? null,
        data_source: aiResult.data_source ?? null,
        processed_context: aiResult.processed_context ?? null,
        recommendations: aiResult.recommendations,
      },
    })
  } catch (error) {
    console.error('Unexpected error', error)
    return json(500, { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } })
  }
})