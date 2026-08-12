-- RLS: market_prices (read-only for authenticated, write-protected)
--      crop_recommendations (own/admin read, RPC-only writes)
BEGIN;

-- ANONYMOUS
SELECT tests.set_identity('anon', NULL);
SELECT tests.expect_eq('anon: cannot read market_prices',
  $$SELECT count(*)::text FROM public.market_prices$$, '0');
SELECT tests.expect_eq('anon: cannot read crop_recommendations',
  $$SELECT count(*)::text FROM public.crop_recommendations$$, '0');
SELECT tests.reset_identity();

-- AUTHENTICATED (buyer used as representative authenticated user)
SELECT tests.set_identity('authenticated', '22222222-2222-2222-2222-222222222222');
SELECT tests.expect_eq('authenticated: reads all market_prices',
  $$SELECT count(*)::text FROM public.market_prices$$, '5');
SELECT tests.expect_error('authenticated: cannot INSERT market_prices',
  $$INSERT INTO public.market_prices (crop_name, price) VALUES ('Rice', 30)$$);
SELECT tests.expect_error('authenticated: cannot UPDATE market_prices',
  $$UPDATE public.market_prices SET price = 1$$);
SELECT tests.expect_error('authenticated: cannot DELETE market_prices',
  $$DELETE FROM public.market_prices$$);
SELECT tests.expect_eq('authenticated(non-owner): cannot read recommendations (0 rows, no leak)',
  $$SELECT count(*)::text FROM public.crop_recommendations$$, '0');
SELECT tests.expect_error('authenticated: cannot INSERT crop_recommendations directly',
  $$INSERT INTO public.crop_recommendations (farmer_id) VALUES ('11111111-1111-1111-1111-111111111111')$$);
SELECT tests.expect_error('authenticated: cannot UPDATE crop_recommendations',
  $$UPDATE public.crop_recommendations SET status = 'completed'$$);
SELECT tests.expect_error('authenticated: cannot DELETE crop_recommendations',
  $$DELETE FROM public.crop_recommendations$$);
SELECT tests.reset_identity();

-- FARMER
SELECT tests.set_identity('authenticated', '11111111-1111-1111-1111-111111111111');
SELECT tests.expect_eq('farmer: reads own recommendations only',
  $$SELECT count(*)::text FROM public.crop_recommendations$$, '1');
SELECT tests.expect_error('farmer: cannot directly write recommendations (RPC/Edge only)',
  $$INSERT INTO public.crop_recommendations (farmer_id) VALUES (auth.uid())$$);
SELECT tests.reset_identity();

-- ADMIN
SELECT tests.set_identity('authenticated', '33333333-3333-3333-3333-333333333333');
SELECT tests.expect_eq('admin: reads all recommendations',
  $$SELECT count(*)::text FROM public.crop_recommendations$$, '1');
SELECT tests.reset_identity();

ROLLBACK;