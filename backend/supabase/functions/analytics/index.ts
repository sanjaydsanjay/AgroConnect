import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('FRONTEND_URL') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authenticate Request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Validate Admin Authorization securely via database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userRecord || userRecord.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'FORBIDDEN', message: 'Only administrators can access analytics' } }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Parse Filters from URL
    const url = new URL(req.url)
    const crop_name = url.searchParams.get('crop') || null
    const market_name = url.searchParams.get('market') || null
    const start_date = url.searchParams.get('start_date') || null
    const end_date = url.searchParams.get('end_date') || null
    const listing_status = url.searchParams.get('listing_status') || null
    const order_status = url.searchParams.get('order_status') || null

    // 4. Fetch Advanced Analytics safely using the aggregated database RPC
    // By invoking this via service_role, we bypass the execution restriction on the RPC
    const { data: analyticsData, error: rpcError } = await supabaseAdmin.rpc('get_platform_analytics', {
      p_crop_name: crop_name,
      p_market_name: market_name,
      p_start_date: start_date,
      p_end_date: end_date,
      p_listing_status: listing_status,
      p_order_status: order_status
    })

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      throw new Error('Database analytics aggregation failed')
    }

    console.log(`analytics request completed for admin ${user.id}`)

    // 5. Return strictly structured JSON
    return new Response(
      JSON.stringify({ success: true, data: analyticsData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected analytics error', error)
    return new Response(
      JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
