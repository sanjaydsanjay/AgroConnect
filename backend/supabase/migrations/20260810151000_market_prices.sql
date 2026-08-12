-- Migration: Phase 9 Market Prices Preparation
-- Created at: 2026-08-10

-- 1. Attach the reusable timestamp trigger to market_prices table
DROP TRIGGER IF EXISTS set_updated_at_market_prices ON public.market_prices;
CREATE TRIGGER set_updated_at_market_prices
  BEFORE UPDATE ON public.market_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 2. Prevent accidental duplicate ingestions of the exact same data point
-- Using COALESCE handles nullable fields (market_name, source) safely in the unique index
CREATE UNIQUE INDEX IF NOT EXISTS unq_market_prices_ingestion 
ON public.market_prices (
  crop_name, 
  COALESCE(market_name, ''), 
  price_date, 
  COALESCE(source, '')
);

-- 3. Composite index to heavily optimize querying historical price trends for specific crops in specific markets
CREATE INDEX IF NOT EXISTS idx_market_prices_trend_lookup 
ON public.market_prices (crop_name, market_name, price_date DESC);
