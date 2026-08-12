-- Migration: Phase 14 Market Price Ingestion Normalization
-- Created at: 2026-08-11
--
-- Background (Issue B):
-- unq_market_prices_ingestion was originally created on EXPRESSIONS
-- (crop_name, COALESCE(market_name, ''), price_date, COALESCE(source, '')).
-- PostgREST (supabase-js .upsert({ onConflict })) quotes each comma-separated
-- token as an identifier, so an expression-based conflict target cannot be
-- expressed through the client AND the actual unique index could never be
-- matched by the client's upsert -> "no unique or exclusion constraint
-- matching the ON CONFLICT specification" errors.
--
-- Fix: normalize NULLs to '' (NOT NULL + DEFAULT ''), deduplicate any rows
-- that differ only by NULL vs '', then recreate the unique index on plain
-- columns. The Edge Function can then safely use:
--   .upsert(rows, { onConflict: 'crop_name, market_name, price_date, source', ignoreDuplicates: true })
--
-- Idempotent: safe to run multiple times.

-- 1. Normalize existing NULLs to the same value the unique index will use
UPDATE public.market_prices
SET market_name = ''
WHERE market_name IS NULL;

UPDATE public.market_prices
SET source = ''
WHERE source IS NULL;

-- 2. Enforce the invariant going forward at the schema level
ALTER TABLE public.market_prices ALTER COLUMN market_name SET DEFAULT '';
ALTER TABLE public.market_prices ALTER COLUMN market_name SET NOT NULL;

ALTER TABLE public.market_prices ALTER COLUMN source SET DEFAULT '';
ALTER TABLE public.market_prices ALTER COLUMN source SET NOT NULL;

-- 3. Deduplicate rows that are equivalent under the new uniqueness rule
-- (keeps exactly one row per crop/market/date/source group: the newest row).
-- Deterministic and safe: no-op when no duplicates exist.
DELETE FROM public.market_prices a
USING public.market_prices b
WHERE a.crop_name = b.crop_name
  AND COALESCE(a.market_name, '') = COALESCE(b.market_name, '')
  AND a.price_date = b.price_date
  AND COALESCE(a.source, '') = COALESCE(b.source, '')
  AND (a.created_at, a.id) < (b.created_at, b.id);

-- 4. Recreate the unique index on plain columns
DROP INDEX IF EXISTS unq_market_prices_ingestion;
CREATE UNIQUE INDEX IF NOT EXISTS unq_market_prices_ingestion
ON public.market_prices (crop_name, market_name, price_date, source);

-- 5. Keep the trend lookup index (unchanged)
CREATE INDEX IF NOT EXISTS idx_market_prices_trend_lookup
ON public.market_prices (crop_name, market_name, price_date DESC);