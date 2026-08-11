-- Migration: Phase 15 Crop Recommendations V2 (AI Service Contract Mapping)
-- Created at: 2026-08-11
--
-- Maps public.crop_recommendations to the live AI service contract:
--   POST /api/recommend
--   request:  { latitude, longitude, season, soil_type, irrigation_type, land_size }
--   response: { generated_at, data_source, processed_context,
--               recommendations: [ { crop, score, risk, profit_range,
--                   component_scores, reasoning, confidence, sowing_window,
--                   harvesting_window, irrigation_advisory, producing_states } ] }
--
-- The legacy six-category contract (weather/soil/water/demand/price/seasonal
-- inputs + six score columns) no longer matches the deployed AI service and is
-- removed. Full per-crop detail is preserved in the `recommendations` JSONB
-- payload (never fabricated server-side).

-- 1. Add the new contract columns
ALTER TABLE public.crop_recommendations
  ADD COLUMN latitude NUMERIC,
  ADD COLUMN longitude NUMERIC,
  ADD COLUMN season TEXT CHECK (season IN ('kharif', 'rabi', 'zaid')),
  ADD COLUMN soil_type TEXT,
  ADD COLUMN irrigation_type TEXT,
  ADD COLUMN land_size NUMERIC CHECK (land_size > 0),
  ADD COLUMN generated_at TIMESTAMPTZ,
  ADD COLUMN data_source TEXT,
  ADD COLUMN processed_context JSONB,
  ADD COLUMN recommendations JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Drop the legacy six-category columns (no longer in the AI contract)
ALTER TABLE public.crop_recommendations
  DROP COLUMN weather_input,
  DROP COLUMN soil_input,
  DROP COLUMN water_input,
  DROP COLUMN demand_input,
  DROP COLUMN price_trend_input,
  DROP COLUMN seasonal_input,
  DROP COLUMN weather_score,
  DROP COLUMN soil_score,
  DROP COLUMN water_score,
  DROP COLUMN demand_score,
  DROP COLUMN price_trend_score,
  DROP COLUMN seasonal_score,
  DROP COLUMN final_score,
  DROP COLUMN recommended_crop,
  DROP COLUMN recommendation_data;

-- 3. Index for viewing a farmer's past recommendations by recency
CREATE INDEX IF NOT EXISTS idx_crop_recommendations_created_at
  ON public.crop_recommendations (farmer_id, created_at DESC);

COMMENT ON COLUMN public.crop_recommendations.recommendations IS
  'AI recommendation list: { crop, score, risk, profit_range, component_scores, reasoning, confidence, sowing_window, harvesting_window, irrigation_advisory, producing_states }';