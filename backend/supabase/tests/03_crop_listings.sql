-- RLS: crop_listings permissions by role + protected-field trigger
BEGIN;

-- ANONYMOUS: public marketplace — approved listings only
SELECT tests.set_identity('anon', NULL);
SELECT tests.expect_eq('anon: sees only approved listings',
  $$SELECT count(*)::text FROM public.crop_listings$$, '1');
SELECT tests.expect_error('anon: cannot insert a listing',
  $$INSERT INTO public.crop_listings (farmer_id, crop_name, quantity, price) VALUES (gen_random_uuid(), 'Rice', 10, 40)$$);
SELECT tests.reset_identity();

-- FARMER
SELECT tests.set_identity('authenticated', '11111111-1111-1111-1111-111111111111');
SELECT tests.expect_eq('farmer: sees all own listings (pending/approved/rejected)',
  $$SELECT count(*)::text FROM public.crop_listings$$, '3');

-- Insert own pending listing
SELECT tests.expect_ok('farmer: inserts own pending listing',
  $$INSERT INTO public.crop_listings (farmer_id, crop_name, quantity, price) VALUES (auth.uid(), 'Rice', 100, 40)$$);
-- Cannot insert with status approved (bypass moderation)
SELECT tests.expect_error('farmer: cannot insert listing as pre-approved',
  $$INSERT INTO public.crop_listings (farmer_id, crop_name, quantity, price, status) VALUES (auth.uid(), 'Rice', 100, 40, 'approved')$$);
-- Cannot insert on someone else's behalf
SELECT tests.expect_error('farmer: cannot insert listing for another farmer',
  $$INSERT INTO public.crop_listings (farmer_id, crop_name, quantity, price) VALUES ('22222222-2222-2222-2222-222222222222', 'Rice', 100, 40)$$);

-- Update allowed fields
SELECT tests.expect_ok('farmer: can update own listing quantity/price',
  $$UPDATE public.crop_listings SET quantity = 10, price = 99 WHERE id = '55555555-5555-5555-5555-555555555552'$$);
-- Protected fields (status/farmer_id/created_at) rejected by trigger
SELECT tests.expect_error('farmer: cannot approve own listing via UPDATE',
  $$UPDATE public.crop_listings SET status = 'approved' WHERE id = '55555555-5555-5555-5555-555555555552'$$,
  'Forbidden: Farmers cannot change the listing status directly.');
SELECT tests.expect_error('farmer: cannot transfer listing ownership',
  $$UPDATE public.crop_listings SET farmer_id = '22222222-2222-2222-2222-222222222222' WHERE id = '55555555-5555-5555-5555-555555555552'$$,
  'Forbidden: Cannot transfer ownership of a listing.');

-- Cannot touch another farmer's listing
SELECT tests.expect_eq('farmer: cannot see/update other farmers'' listings (0 rows affected)',
  $$UPDATE public.crop_listings SET quantity = 1 WHERE farmer_id <> auth.uid() RETURNING id$$, '');
SELECT tests.reset_identity();

-- BUYER: read approved only, no writes
SELECT tests.set_identity('authenticated', '22222222-2222-2222-2222-222222222222');
SELECT tests.expect_eq('buyer: sees approved listings only',
  $$SELECT count(*)::text FROM public.crop_listings$$, '1');
SELECT tests.expect_eq('buyer: sees rejected/pending as 0 rows',
  $$SELECT count(*)::text FROM public.crop_listings WHERE status <> 'approved'$$, '0');
SELECT tests.expect_error('buyer: cannot create a listing',
  $$INSERT INTO public.crop_listings (farmer_id, crop_name, quantity, price) VALUES ('11111111-1111-1111-1111-111111111111', 'Rice', 10, 40)$$);
SELECT tests.expect_eq('buyer: cannot update any listing',
  $$UPDATE public.crop_listings SET crop_name = 'Hacked' WHERE status = 'approved' RETURNING id$$, '');
SELECT tests.reset_identity();

-- ADMIN: full visibility
SELECT tests.set_identity('authenticated', '33333333-3333-3333-3333-333333333333');
SELECT tests.expect_eq('admin: sees all listings',
  $$SELECT count(*)::text FROM public.crop_listings$$, '4');
SELECT tests.reset_identity();

ROLLBACK;