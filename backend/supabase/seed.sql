-- AgriConnect Phase 12 Seed Data
-- WARNING: This file is intended for local development and demo environments only.
-- Do NOT execute this file against a production database.

DO $$ 
DECLARE
  farmer_id UUID := '11111111-1111-1111-1111-111111111111';
  buyer_id UUID := '22222222-2222-2222-2222-222222222222';
  admin_id UUID := '33333333-3333-3333-3333-333333333333';
BEGIN

  -- 1. Create Auth Users safely using pgcrypto for password hashing
  -- These users are hardcoded strictly for testing purposes.
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES
  ('00000000-0000-0000-0000-000000000000', farmer_id, 'authenticated', 'authenticated', 'farmer@demo.com', crypt('demo123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"farmer"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', buyer_id, 'authenticated', 'authenticated', 'buyer@demo.com', crypt('demo123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"buyer"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated', 'admin@demo.com', crypt('demo123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"admin"}', now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Ensure identities exist for Supabase Auth consistency
  -- NOTE: newer auth.identities schemas require provider_id (NOT NULL) and the
  -- conflict target is (provider, provider_id), not (id).
  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES
  (farmer_id, farmer_id, farmer_id, format('{"sub":"%s","email":"%s"}', farmer_id::text, 'farmer@demo.com')::jsonb, 'email', now(), now(), now()),
  (buyer_id, buyer_id, buyer_id, format('{"sub":"%s","email":"%s"}', buyer_id::text, 'buyer@demo.com')::jsonb, 'email', now(), now(), now()),
  (admin_id, admin_id, admin_id, format('{"sub":"%s","email":"%s"}', admin_id::text, 'admin@demo.com')::jsonb, 'email', now(), now(), now())
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- The auth trigger creates rows in public.users automatically.
  -- We explicitly update them here to guarantee roles and verification are correct, simulating a trusted admin backend setup.
  UPDATE public.users SET role = 'farmer', verified = true WHERE id = farmer_id;
  UPDATE public.users SET role = 'buyer', verified = true WHERE id = buyer_id;
  UPDATE public.users SET role = 'admin', verified = true WHERE id = admin_id;

  -- 2. Farmer Profile
  -- NOTE: The column is user_id (see 20260810000000_init.sql).
  -- crop_recommendations.farmer_id references farmer_profiles(user_id),
  -- so this row MUST exist before recommendations/listings are inserted below.
  INSERT INTO public.farmer_profiles (
    user_id, full_name, phone, address, district, state, pincode, farm_size, farm_size_unit, soil_type, water_source
  ) VALUES (
    farmer_id, 'Demo Farmer', '+919999999999', '123 Demo Farm Lane', 'Pune', 'Maharashtra', '411001', 5.5, 'acres', 'Black Soil', 'Canal'
  )
  ON CONFLICT (user_id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;

  -- 3. Market Prices (Historical Data for Analytics)
  INSERT INTO public.market_prices (crop_name, market_name, location, price, unit, currency, price_date, source) VALUES
  ('Tomato', 'Pune APMC', 'Pune', 25.00, 'kg', 'INR', '2026-08-08'::timestamptz, 'Demo Data API'),
  ('Tomato', 'Pune APMC', 'Pune', 28.00, 'kg', 'INR', '2026-08-09'::timestamptz, 'Demo Data API'),
  ('Tomato', 'Pune APMC', 'Pune', 30.00, 'kg', 'INR', '2026-08-10'::timestamptz, 'Demo Data API'),
  ('Wheat', 'Pune APMC', 'Pune', 22.00, 'kg', 'INR', '2026-08-08'::timestamptz, 'Demo Data API'),
  ('Wheat', 'Pune APMC', 'Pune', 24.00, 'kg', 'INR', '2026-08-10'::timestamptz, 'Demo Data API')
  ON CONFLICT (crop_name, market_name, price_date, source) DO NOTHING;

  -- 4. Crop Recommendations (Demo record in V2/AI-service contract shape)
  INSERT INTO public.crop_recommendations (
    id, farmer_id, latitude, longitude, season, soil_type, irrigation_type,
    land_size, status, generated_at, data_source, processed_context, recommendations
  ) VALUES (
    '44444444-4444-4444-4444-444444444444', farmer_id, 18.5204, 73.8567, 'kharif',
    'Black Soil', 'Canal', 5.5, 'failed', now(), 'demo-data',
    '{"demo": true}'::jsonb,
    '[{"crop": "Demo", "score": 0, "reasoning": "Demo: AI service not integrated yet"}]'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;

  -- 5. Crop Listings
  -- Note: The tomato listing represents an initial quantity of 500kg.
  -- 150kg total is ordered in step 6 below, leaving 350kg currently available. 
  -- We set it strictly to 350 to enforce inventory consistency mathematically.
  INSERT INTO public.crop_listings (id, farmer_id, crop_name, description, quantity, quantity_unit, price, price_unit, status) VALUES
  ('55555555-5555-5555-5555-555555555551', farmer_id, 'Tomato', 'Fresh Demo Tomatoes', 350, 'kg', 25.00, 'kg', 'approved'),
  ('55555555-5555-5555-5555-555555555552', farmer_id, 'Wheat', 'Premium Demo Wheat', 1000, 'kg', 22.00, 'kg', 'pending'),
  ('55555555-5555-5555-5555-555555555553', farmer_id, 'Onion', 'Demo Onions', 200, 'kg', 15.00, 'kg', 'rejected')
  ON CONFLICT (id) DO NOTHING;

  -- 6. Buyer Orders (Against the approved Tomato listing)
  INSERT INTO public.buyer_orders (id, buyer_id, listing_id, quantity, unit_price, total_price, status) VALUES
  ('66666666-6666-6666-6666-666666666661', buyer_id, '55555555-5555-5555-5555-555555555551', 100, 25.00, 2500.00, 'pending'),
  ('66666666-6666-6666-6666-666666666662', buyer_id, '55555555-5555-5555-5555-555555555551', 50, 25.00, 1250.00, 'completed')
  ON CONFLICT (id) DO NOTHING;

END $$;
