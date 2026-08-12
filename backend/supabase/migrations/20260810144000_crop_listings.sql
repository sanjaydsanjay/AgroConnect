
-- Migration: Phase 6 Crop Listings Logic
-- Created at: 2026-08-10

-- 1. Drop existing loose RLS policies from Phase 3
DROP POLICY IF EXISTS "Farmers can insert own pending listings" ON public.crop_listings;
DROP POLICY IF EXISTS "Farmers can update own listings" ON public.crop_listings;
DROP POLICY IF EXISTS "Farmers can delete own listings" ON public.crop_listings;

-- 2. Recreate policies ensuring ONLY users with role = 'farmer' can manage listings
CREATE POLICY "Farmers can insert own pending listings" ON public.crop_listings 
FOR INSERT WITH CHECK (
  auth.uid() = farmer_id AND 
  status = 'pending' AND 
  public.is_farmer()
);

-- We allow farmers to update their own listings, but column protection is handled by a trigger below.
CREATE POLICY "Farmers can update own listings" ON public.crop_listings 
FOR UPDATE USING (
  auth.uid() = farmer_id AND 
  public.is_farmer()
);

CREATE POLICY "Farmers can delete own listings" ON public.crop_listings 
FOR DELETE USING (
  auth.uid() = farmer_id AND 
  public.is_farmer()
);

-- 3. Trigger to prevent farmers from editing restricted columns (status, farmer_id, created_at)
CREATE OR REPLACE FUNCTION public.protect_listing_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user executing the update is NOT an admin
  IF NOT public.is_admin() THEN
    -- Prevent changing status to bypass moderation
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Forbidden: Farmers cannot change the listing status directly.';
    END IF;
    
    -- Prevent changing ownership
    IF NEW.farmer_id IS DISTINCT FROM OLD.farmer_id THEN
      RAISE EXCEPTION 'Forbidden: Cannot transfer ownership of a listing.';
    END IF;

    -- Prevent changing created_at
    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Forbidden: Cannot modify created_at timestamp.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_protect_listing_fields ON public.crop_listings;
CREATE TRIGGER enforce_protect_listing_fields
  BEFORE UPDATE ON public.crop_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_listing_fields();

-- 4. Attach reusable timestamp trigger to crop_listings
DROP TRIGGER IF EXISTS set_updated_at_crop_listings ON public.crop_listings;
CREATE TRIGGER set_updated_at_crop_listings
  BEFORE UPDATE ON public.crop_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();
