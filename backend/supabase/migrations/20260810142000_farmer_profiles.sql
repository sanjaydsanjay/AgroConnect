-- Migration: Phase 4 Farmer Profiles Logic
-- Phase 4: Strengthen RLS and add updated_at trigger
-- Created at: 2026-08-10

-- 1. Helper function to check if the current user is a farmer
CREATE OR REPLACE FUNCTION public.is_farmer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'farmer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop existing less secure policies for farmer profiles
DROP POLICY IF EXISTS "Farmers can insert own profile" ON public.farmer_profiles;
DROP POLICY IF EXISTS "Farmers can update own profile" ON public.farmer_profiles;
DROP POLICY IF EXISTS "Farmers can view own profile" ON public.farmer_profiles;

-- 3. Re-create policies with strict role checks
CREATE POLICY "Farmers can view own profile" ON public.farmer_profiles 
FOR SELECT USING (auth.uid() = user_id AND public.is_farmer());

CREATE POLICY "Farmers can insert own profile" ON public.farmer_profiles 
FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_farmer());

CREATE POLICY "Farmers can update own profile" ON public.farmer_profiles 
FOR UPDATE USING (auth.uid() = user_id AND public.is_farmer());

-- 4. Reusable trigger function for updated_at
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach the trigger to farmer_profiles
DROP TRIGGER IF EXISTS set_updated_at_farmer_profiles ON public.farmer_profiles;
CREATE TRIGGER set_updated_at_farmer_profiles
  BEFORE UPDATE ON public.farmer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();
