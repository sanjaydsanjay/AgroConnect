-- Migration: Grant table permissions to PostgREST roles
-- Created at: 2026-08-11

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on users
GRANT SELECT ON public.users TO anon, authenticated;

-- Grant permissions on farmer_profiles
GRANT SELECT, INSERT, UPDATE ON public.farmer_profiles TO anon, authenticated;

-- Grant permissions on crop_recommendations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_recommendations TO anon, authenticated;

-- Grant permissions on market_prices
GRANT SELECT ON public.market_prices TO anon, authenticated;

-- Grant permissions on crop_listings
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_listings TO anon, authenticated;

-- Grant permissions on buyer_orders
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buyer_orders TO anon, authenticated;

-- Grant usage on sequences if there are any (though UUIDs are used mostly)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
