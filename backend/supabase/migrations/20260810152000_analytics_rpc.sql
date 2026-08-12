-- Migration: Phase 11 Analytics RPC
-- Created at: 2026-08-10

-- 1. Create a secure RPC for aggregating metrics across the platform
-- This heavily minimizes data transfer by aggregating natively inside PostgreSQL
CREATE OR REPLACE FUNCTION public.get_platform_analytics(
    p_crop_name TEXT DEFAULT NULL,
    p_market_name TEXT DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_listing_status TEXT DEFAULT NULL,
    p_order_status TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_admin_metrics JSON;
    v_market_metrics JSON;
    v_listing_metrics JSON;
    v_order_metrics JSON;
BEGIN
    -- ADMIN ANALYTICS
    SELECT json_build_object(
        'users', (SELECT count(*) FROM public.users),
        'farmers', (SELECT count(*) FROM public.users WHERE role = 'farmer'),
        'buyers', (SELECT count(*) FROM public.users WHERE role = 'buyer'),
        'admins', (SELECT count(*) FROM public.users WHERE role = 'admin'),
        'verified_users', (SELECT count(*) FROM public.users WHERE verified = true),
        
        'listings', (SELECT count(*) FROM public.crop_listings),
        'pending_listings', (SELECT count(*) FROM public.crop_listings WHERE status = 'pending'),
        'approved_listings', (SELECT count(*) FROM public.crop_listings WHERE status = 'approved'),
        'rejected_listings', (SELECT count(*) FROM public.crop_listings WHERE status = 'rejected'),
        
        'orders', (SELECT count(*) FROM public.buyer_orders),
        'pending_orders', (SELECT count(*) FROM public.buyer_orders WHERE status = 'pending'),
        'confirmed_orders', (SELECT count(*) FROM public.buyer_orders WHERE status = 'confirmed'),
        'completed_orders', (SELECT count(*) FROM public.buyer_orders WHERE status = 'completed'),
        'cancelled_orders', (SELECT count(*) FROM public.buyer_orders WHERE status = 'cancelled'),
        
        'market_prices', (SELECT count(*) FROM public.market_prices),
        
        'total_listed_quantity', (SELECT COALESCE(SUM(quantity), 0) FROM public.crop_listings),
        'total_ordered_quantity', (SELECT COALESCE(SUM(quantity), 0) FROM public.buyer_orders),
        'total_order_value', (SELECT COALESCE(SUM(total_price), 0) FROM public.buyer_orders)
    ) INTO v_admin_metrics;

    -- MARKET ANALYTICS
    SELECT json_build_object(
        'average_price', COALESCE(AVG(price), 0),
        'min_price', COALESCE(MIN(price), 0),
        'max_price', COALESCE(MAX(price), 0),
        'latest_price', (
             SELECT price FROM public.market_prices mp2 
             WHERE (p_crop_name IS NULL OR mp2.crop_name = p_crop_name)
               AND (p_market_name IS NULL OR mp2.market_name = p_market_name)
             ORDER BY price_date DESC LIMIT 1
        ),
        'price_history', COALESCE((
            SELECT json_agg(json_build_object('date', price_date, 'price', price, 'market', market_name))
            FROM (
                SELECT price_date, price, market_name
                FROM public.market_prices
                WHERE (p_crop_name IS NULL OR crop_name = p_crop_name)
                  AND (p_market_name IS NULL OR market_name = p_market_name)
                  AND (p_start_date IS NULL OR price_date >= p_start_date)
                  AND (p_end_date IS NULL OR price_date <= p_end_date)
                ORDER BY price_date ASC
            ) t
        ), '[]'::json)
    ) INTO v_market_metrics
    FROM public.market_prices
    WHERE (p_crop_name IS NULL OR crop_name = p_crop_name)
      AND (p_market_name IS NULL OR market_name = p_market_name)
      AND (p_start_date IS NULL OR price_date >= p_start_date)
      AND (p_end_date IS NULL OR price_date <= p_end_date);

    -- LISTING ANALYTICS
    SELECT json_build_object(
        'listings_by_crop', COALESCE((
            SELECT json_agg(json_build_object('crop_name', crop_name, 'count', c))
            FROM (
                SELECT crop_name, COUNT(*) as c
                FROM public.crop_listings
                WHERE (p_listing_status IS NULL OR status::text = p_listing_status)
                GROUP BY crop_name
            ) t
        ), '[]'::json),
        'quantity_by_crop', COALESCE((
            SELECT json_agg(json_build_object('crop_name', crop_name, 'total_quantity', q))
            FROM (
                SELECT crop_name, SUM(quantity) as q
                FROM public.crop_listings
                WHERE (p_listing_status IS NULL OR status::text = p_listing_status)
                GROUP BY crop_name
            ) t
        ), '[]'::json),
        'average_listing_price', (
            SELECT COALESCE(AVG(price), 0) FROM public.crop_listings
            WHERE (p_crop_name IS NULL OR crop_name = p_crop_name)
              AND (p_listing_status IS NULL OR status::text = p_listing_status)
        )
    ) INTO v_listing_metrics;

    -- ORDER ANALYTICS
    SELECT json_build_object(
        'orders_by_crop', COALESCE((
            SELECT json_agg(json_build_object('crop_name', cl.crop_name, 'count', c))
            FROM (
                SELECT l.crop_name, COUNT(o.*) as c
                FROM public.buyer_orders o
                JOIN public.crop_listings l ON o.listing_id = l.id
                WHERE (p_order_status IS NULL OR o.status::text = p_order_status)
                GROUP BY l.crop_name
            ) cl
        ), '[]'::json),
        'completed_order_value', (
            SELECT COALESCE(SUM(total_price), 0)
            FROM public.buyer_orders
            WHERE status = 'completed'
        )
    ) INTO v_order_metrics;

    RETURN json_build_object(
        'admin', v_admin_metrics,
        'market', v_market_metrics,
        'listings', v_listing_metrics,
        'orders', v_order_metrics
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Restrict Execution
-- Deny public and authenticated users from calling this RPC directly.
-- It should only be accessed via the Edge Function using the service_role key to prevent massive metric leaks to farmers/buyers.
REVOKE EXECUTE ON FUNCTION public.get_platform_analytics FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_analytics TO service_role;

-- 3. Add supporting indexes for aggregation
CREATE INDEX IF NOT EXISTS idx_crop_listings_crop_name ON public.crop_listings(crop_name);
