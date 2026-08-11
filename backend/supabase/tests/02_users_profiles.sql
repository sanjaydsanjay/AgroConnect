-- RLS: users + farmer_profiles permissions by role
BEGIN;

-- ANONYMOUS
SELECT tests.set_identity('anon', NULL);
SELECT tests.expect_eq('anon: cannot see users',
  $$SELECT count(*)::text FROM public.users$$, '0');
SELECT tests.expect_eq('anon: cannot see farmer_profiles',
  $$SELECT count(*)::text FROM public.farmer_profiles$$, '0');
SELECT tests.expect_error('anon: cannot insert into users',
  $$INSERT INTO public.users (id) VALUES (gen_random_uuid())$$);
SELECT tests.reset_identity();

-- FARMER
SELECT tests.set_identity('authenticated', '11111111-1111-1111-1111-111111111111');
SELECT tests.expect_eq('farmer: sees only own user row',
  $$SELECT count(*)::text FROM public.users$$, '1');
SELECT tests.expect_eq('farmer: sees own profile row',
  $$SELECT count(*)::text FROM public.farmer_profiles$$, '1');
SELECT tests.expect_error('farmer: cannot update own role',
  $$UPDATE public.users SET role = 'admin' WHERE id = auth.uid()$$);
SELECT tests.expect_error('farmer: cannot insert own user row',
  $$INSERT INTO public.users (id) VALUES (auth.uid())$$);
SELECT tests.expect_ok('farmer: can update own profile',
  $$UPDATE public.farmer_profiles SET full_name = 'Updated Name' WHERE user_id = auth.uid()$$);
SELECT tests.expect_eq('farmer: profile update persisted server-side only',
  $$SELECT full_name FROM public.farmer_profiles WHERE user_id = auth.uid()$$, 'Updated Name');
SELECT tests.expect_ok('farmer: can insert own profile row (idempotent-ish sanity)',
  $$INSERT INTO public.farmer_profiles (user_id) VALUES (auth.uid()) ON CONFLICT (user_id) DO NOTHING$$);
SELECT tests.reset_identity();

-- BUYER
SELECT tests.set_identity('authenticated', '22222222-2222-2222-2222-222222222222');
SELECT tests.expect_eq('buyer: sees only own user row',
  $$SELECT count(*)::text FROM public.users$$, '1');
SELECT tests.expect_eq('buyer: cannot see any farmer profile (0 rows, no leak)',
  $$SELECT count(*)::text FROM public.farmer_profiles$$, '0');
SELECT tests.expect_error('buyer: cannot insert into farmer_profiles',
  $$INSERT INTO public.farmer_profiles (user_id) VALUES (auth.uid())$$);
SELECT tests.reset_identity();

-- ADMIN
SELECT tests.set_identity('authenticated', '33333333-3333-3333-3333-333333333333');
SELECT tests.expect_eq('admin: sees all users',
  $$SELECT count(*)::text FROM public.users$$, '3');
SELECT tests.expect_eq('admin: sees all farmer profiles',
  $$SELECT count(*)::text FROM public.farmer_profiles$$, '1');
SELECT tests.reset_identity();

ROLLBACK;