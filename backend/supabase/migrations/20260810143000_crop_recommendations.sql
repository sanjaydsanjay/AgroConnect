-- Migration: Phase 5 Crop Recommendations
-- Attach reusable timestamp trigger to crop_recommendations table
-- Created at: 2026-08-10

DROP TRIGGER IF EXISTS set_updated_at_crop_recommendations ON public.crop_recommendations;
CREATE TRIGGER set_updated_at_crop_recommendations
  BEFORE UPDATE ON public.crop_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();
