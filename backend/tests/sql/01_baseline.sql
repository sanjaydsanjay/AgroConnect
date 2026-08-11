-- RLS / baseline sanity: schema, constraints, seed state
-- Prerequisites: `supabase db reset` (migrations + seed.sql applied).
BEGIN;

-- 1. Tables exist
SELECT tests.expect_ok('baseline: users table exists',
  $$SELECT 1 FROM public.users LIMIT 1$$);
SELECT tests.expect_ok('baseline: farmer_profiles table exists',
  $$SELECT 1 FROM public.farmer_profiles LIMIT 1$$);
SELECT tests.expect_ok('baseline: crop_recommendations table exists',
  $$SELECT 1 FROM public.crop_recommendations LIMIT 1$$);
SELECT tests.expect_ok('baseline: market_prices table exists',
  $$SELECT 1 FROM public.market_prices LIMIT 1$$);
SELECT tests.expect_ok('baseline: crop_listings table exists',
  $$SELECT 1 FROM public.crop_listings LIMIT 1$$);
SELECT tests.expect_ok('baseline: buyer_orders table exists',
  $$SELECT 1 FROM public.buyer_orders LIMIT 1$$);

-- 2. RLS is enabled everywhere
SELECT tests.expect_rls_enabled('baseline: RLS on users', 'users');
SELECT tests.expect_rls_enabled('baseline: RLS on farmer_profiles', 'farmer_profiles');
SELECT tests.expect_rls_enabled('baseline: RLS on crop_recommendations', 'crop_recommendations');
SELECT tests.expect_rls_enabled('baseline: RLS on market_prices', 'market_prices');
SELECT tests.expect_rls_enabled('baseline: RLS on crop_listings', 'crop_listings');
SELECT tests.expect_rls_enabled('baseline: RLS on buyer_orders', 'buyer_orders');

-- 3. Seed data present (auth.users trigger created public.users rows)
SELECT tests.expect_eq('baseline: 3 seeded users',
  $$SELECT count(*)::text FROM public.users$$, '3');
SELECT tests.expect_eq('baseline: 1 farmer profile',
  $$SELECT count(*)::text FROM public.farmer_profiles WHERE user_id = '11111111-1111-1111-1111-111111111111'$$, '1');
SELECT tests.expect_eq('baseline: 5 market prices',
  $$SELECT count(*)::text FROM public.market_prices$$, '5');
SELECT tests.expect_eq('baseline: 3 crop listings',
  $$SELECT count(*)::text FROM public.crop_listings$$, '3');
SELECT tests.expect_eq('baseline: 2 buyer orders',
  $$SELECT count(*)::text FROM public.buyer_orders$$, '2');
SELECT tests.expect_eq('baseline: 1 crop recommendation',
  $$SELECT count(*)::text FROM public.crop_recommendations$$, '1');

-- 4. Foreign key wiring (Issue A: recommendation -> farmer_profiles.user_id)
SELECT tests.expect_ok('baseline: FK crop_recommendations.farmer_id -> farmer_profiles.user_id',
  $$INSERT INTO public.crop_recommendations (farmer_id) SELECT user_id FROM public.farmer_profiles LIMIT 1$$);

-- 5. Unique ingestion index is on plain columns (Issue B: matches edge fn upsert target)
SELECT tests.expect_eq('baseline: unq_market_prices_ingestion uses plain columns',
  $$
  SELECT count(*)::text
  FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'unq_market_prices_ingestion'
    AND indexdef NOT LIKE '%COALESCE%'
  $$, '1');

ROLLBACK;