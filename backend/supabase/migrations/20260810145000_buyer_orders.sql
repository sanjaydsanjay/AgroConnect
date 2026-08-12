-- Migration: Phase 7 Buyer Orders Logic
-- Created at: 2026-08-10

-- 1. Helper function for buyer role check
CREATE OR REPLACE FUNCTION public.is_buyer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'buyer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop existing loose policies
DROP POLICY IF EXISTS "Buyers can create orders for approved listings" ON public.buyer_orders;
-- Keep "Buyers can view own orders" from Phase 3

-- 3. Policy for Farmers to see orders on their own listings
CREATE POLICY "Farmers can view orders for their listings" ON public.buyer_orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.crop_listings
    WHERE id = buyer_orders.listing_id AND farmer_id = auth.uid()
  )
);

-- We explicitly do NOT create an INSERT or UPDATE policy for buyers on buyer_orders. 
-- All order creation must go through the secure RPC below to guarantee atomicity.

-- 4. Attach reusable timestamp trigger to buyer_orders
DROP TRIGGER IF EXISTS set_updated_at_buyer_orders ON public.buyer_orders;
CREATE TRIGGER set_updated_at_buyer_orders
  BEFORE UPDATE ON public.buyer_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 5. Secure Atomic RPC for Order Creation
CREATE OR REPLACE FUNCTION public.create_buyer_order(
  p_listing_id UUID,
  p_quantity NUMERIC
)
RETURNS public.buyer_orders AS $$
DECLARE
  v_buyer_id UUID;
  v_listing public.crop_listings;
  v_order public.buyer_orders;
BEGIN
  -- Authenticate and get buyer ID
  v_buyer_id := auth.uid();
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User is not authenticated';
  END IF;

  -- Validate buyer role securely
  IF NOT public.is_buyer() THEN
    RAISE EXCEPTION 'Forbidden: Only users with the buyer role can place orders';
  END IF;

  -- Validate input quantity
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Bad Request: Order quantity must be greater than 0';
  END IF;

  -- ATOMIC LOCK: Lock the specific listing row to prevent concurrent purchase race conditions
  SELECT * INTO v_listing 
  FROM public.crop_listings 
  WHERE id = p_listing_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not Found: Listing does not exist';
  END IF;

  -- Validate listing status
  IF v_listing.status != 'approved' THEN
    RAISE EXCEPTION 'Forbidden: Cannot purchase a listing that is not approved';
  END IF;

  -- Validate available inventory
  IF v_listing.quantity < p_quantity THEN
    RAISE EXCEPTION 'Conflict: Requested quantity (%) exceeds available inventory (%)', p_quantity, v_listing.quantity;
  END IF;

  -- Insert the order with completely trusted server-calculated values
  INSERT INTO public.buyer_orders (
    buyer_id,
    listing_id,
    quantity,
    unit_price,
    total_price,
    status
  ) VALUES (
    v_buyer_id,
    p_listing_id,
    p_quantity,
    v_listing.price,
    p_quantity * v_listing.price,
    'pending'
  ) RETURNING * INTO v_order;

  -- Atomically reduce the listing's available quantity
  UPDATE public.crop_listings
  SET quantity = quantity - p_quantity
  WHERE id = p_listing_id;

  RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
