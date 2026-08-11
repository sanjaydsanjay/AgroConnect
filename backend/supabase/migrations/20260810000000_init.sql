-- Migration: Initial Schema for AgriConnect
-- Created at: 2026-08-10

-- 1. Enums
CREATE TYPE user_role AS ENUM ('farmer', 'buyer', 'admin');
CREATE TYPE listing_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE recommendation_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- 2. Tables

-- users
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'farmer',
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.users IS 'Extended user profile referencing Supabase auth.users';

-- farmer_profiles
CREATE TABLE public.farmer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  district TEXT,
  state TEXT,
  pincode TEXT,
  farm_size NUMERIC CHECK (farm_size >= 0),
  farm_size_unit TEXT DEFAULT 'acres',
  soil_type TEXT,
  water_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.farmer_profiles IS 'Detailed profile information specific to farmers';

-- crop_recommendations
CREATE TABLE public.crop_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmer_profiles(user_id) ON DELETE CASCADE,
  weather_input JSONB,
  soil_input JSONB,
  water_input JSONB,
  demand_input JSONB,
  price_trend_input JSONB,
  seasonal_input JSONB,
  weather_score NUMERIC,
  soil_score NUMERIC,
  water_score NUMERIC,
  demand_score NUMERIC,
  price_trend_score NUMERIC,
  seasonal_score NUMERIC,
  final_score NUMERIC,
  recommended_crop TEXT,
  recommendation_data JSONB,
  status recommendation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.crop_recommendations IS 'Stores the inputs, output, and scores of the crop recommendation logic';

-- market_prices
CREATE TABLE public.market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name TEXT NOT NULL,
  market_name TEXT,
  location TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  unit TEXT NOT NULL DEFAULT 'kg',
  currency TEXT NOT NULL DEFAULT 'INR',
  price_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.market_prices IS 'Market prices for various crops over time';

-- crop_listings
CREATE TABLE public.crop_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC NOT NULL CHECK (quantity >= 0),
  quantity_unit TEXT NOT NULL DEFAULT 'kg',
  price NUMERIC NOT NULL CHECK (price >= 0),
  price_unit TEXT NOT NULL DEFAULT 'kg',
  location TEXT,
  harvest_date DATE,
  status listing_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.crop_listings IS 'Crops listed by farmers for sale, requiring admin approval';

-- buyer_orders
CREATE TABLE public.buyer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.crop_listings(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL CHECK (quantity >= 0),
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC NOT NULL CHECK (total_price >= 0),
  status order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.buyer_orders IS 'Orders placed by buyers on farmer crop listings';

-- 3. Indexes for performance
CREATE INDEX idx_farmer_profiles_user_id ON public.farmer_profiles(user_id);
CREATE INDEX idx_crop_recommendations_farmer_id ON public.crop_recommendations(farmer_id);
CREATE INDEX idx_crop_listings_farmer_id ON public.crop_listings(farmer_id);
CREATE INDEX idx_crop_listings_status ON public.crop_listings(status);
CREATE INDEX idx_buyer_orders_buyer_id ON public.buyer_orders(buyer_id);
CREATE INDEX idx_buyer_orders_listing_id ON public.buyer_orders(listing_id);
CREATE INDEX idx_buyer_orders_status ON public.buyer_orders(status);
CREATE INDEX idx_market_prices_crop_name ON public.market_prices(crop_name);
CREATE INDEX idx_market_prices_market_name ON public.market_prices(market_name);
CREATE INDEX idx_market_prices_price_date ON public.market_prices(price_date);
