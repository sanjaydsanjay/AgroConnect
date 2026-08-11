-- Migration: Phase 8 Admin Moderation
-- Created at: 2026-08-10

-- 1. Secure RPC for moderating crop listings
CREATE OR REPLACE FUNCTION public.moderate_crop_listing(
  p_listing_id UUID,
  p_status listing_status
)
RETURNS public.crop_listings AS $$
DECLARE
  v_admin_id UUID;
  v_listing public.crop_listings;
BEGIN
  -- 1. Authenticate user securely
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User is not authenticated';
  END IF;

  -- 2. Validate Admin Role securely
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Only administrators can moderate listings';
  END IF;

  -- 3. Validate requested status transition
  -- Admins should only approve or reject. Moving back to 'pending' is not supported in this phase.
  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Bad Request: Moderation status must be approved or rejected';
  END IF;

  -- 4. Verify listing exists and atomically lock it
  SELECT * INTO v_listing 
  FROM public.crop_listings 
  WHERE id = p_listing_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not Found: Listing does not exist';
  END IF;

  -- 5. Update only the moderation status
  -- (updated_at is automatically refreshed by the existing trigger from Phase 6)
  UPDATE public.crop_listings
  SET status = p_status
  WHERE id = p_listing_id
  RETURNING * INTO v_listing;

  RETURN v_listing;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
