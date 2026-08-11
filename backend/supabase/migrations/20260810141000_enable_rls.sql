-- Migration: Phase 3 Enable Row Level Security (RLS)
-- Created at: 2026-08-10

-- 1. Security Hardening for existing Auth Trigger
-- Add SET search_path = public to prevent search path injection attacks
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Helper function to safely check if current user is admin without causing RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_orders ENABLE ROW LEVEL SECURITY;

-- 4. Policies for public.users
-- SELECT: Users can read their own record. Admins can read all.
CREATE POLICY "Users can view own record" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (public.is_admin());
-- INSERT: Denied (handled by trigger).
-- UPDATE: Denied for normal users since no safe fields exist (role, verified, id must not be freely editable).
-- DELETE: Denied.

-- 5. Policies for public.farmer_profiles
-- SELECT: Farmers can view own, Admins can view all.
CREATE POLICY "Farmers can view own profile" ON public.farmer_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all farmer profiles" ON public.farmer_profiles FOR SELECT USING (public.is_admin());
-- INSERT: Farmers can insert their own profile.
CREATE POLICY "Farmers can insert own profile" ON public.farmer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
-- UPDATE: Farmers can update their own profile.
CREATE POLICY "Farmers can update own profile" ON public.farmer_profiles FOR UPDATE USING (auth.uid() = user_id);
-- DELETE: Denied.

-- 6. Policies for public.crop_recommendations
-- SELECT: Farmers can view own recommendations, Admins can view all.
CREATE POLICY "Farmers can view own recommendations" ON public.crop_recommendations FOR SELECT USING (auth.uid() = farmer_id);
CREATE POLICY "Admins can view all recommendations" ON public.crop_recommendations FOR SELECT USING (public.is_admin());
-- INSERT/UPDATE/DELETE: Denied for normal users (must be handled by AI backend or Edge Functions).

-- 7. Policies for public.market_prices
-- SELECT: All authenticated users can view market prices.
CREATE POLICY "Authenticated users can view market prices" ON public.market_prices FOR SELECT USING (auth.role() = 'authenticated');
-- INSERT/UPDATE/DELETE: Denied (managed by Edge Functions later).

-- 8. Policies for public.crop_listings
-- SELECT: Farmers see own, Buyers/Public see approved, Admins see all.
CREATE POLICY "Farmers can view own listings" ON public.crop_listings FOR SELECT USING (auth.uid() = farmer_id);
CREATE POLICY "Anyone can view approved listings" ON public.crop_listings FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins can view all listings" ON public.crop_listings FOR SELECT USING (public.is_admin());
-- INSERT: Farmers can create pending listings for themselves.
CREATE POLICY "Farmers can insert own pending listings" ON public.crop_listings FOR INSERT WITH CHECK (auth.uid() = farmer_id AND status = 'pending');
-- UPDATE: Farmers can update own listings, but cannot approve them.
CREATE POLICY "Farmers can update own listings" ON public.crop_listings FOR UPDATE USING (auth.uid() = farmer_id) WITH CHECK (status != 'approved');
-- DELETE: Farmers can delete own listings.
CREATE POLICY "Farmers can delete own listings" ON public.crop_listings FOR DELETE USING (auth.uid() = farmer_id);

-- 9. Policies for public.buyer_orders
-- SELECT: Buyers can view own orders, Admins see all.
CREATE POLICY "Buyers can view own orders" ON public.buyer_orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Admins can view all orders" ON public.buyer_orders FOR SELECT USING (public.is_admin());
-- INSERT: Buyers can insert orders only for themselves and only if the listing is approved.
CREATE POLICY "Buyers can create orders for approved listings" ON public.buyer_orders FOR INSERT WITH CHECK (
  auth.uid() = buyer_id AND 
  EXISTS (
    SELECT 1 FROM public.crop_listings 
    WHERE id = listing_id AND status = 'approved'
  )
);
-- UPDATE/DELETE: Denied.
