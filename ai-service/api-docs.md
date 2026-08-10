# 🌾 AgriConnect AI & Market Intelligence API Documentation

> **Version:** 1.0.0  
> **Service:** Python FastAPI AI Microservice (`ai-service`)  
> **Target Audience:** Frontend Developers (Member 1) & Backend/Database Engineers (Member 2)  
> **Interactive Swagger UI:** `http://localhost:8000/docs`  
> **ReDoc Spec:** `http://localhost:8000/redoc`

---

## 📌 1. Service Overview & Architecture

The **AgriConnect AI Microservice** provides deterministic crop recommendation scoring, live weather analysis (Open-Meteo), real-time Mandi market price intelligence (**data.gov.in** / Agmarknet), and marketplace price trend analytics tailored specifically for Indian agricultural standards (ICAR benchmarks & CACP MSP rates).

```
+---------------------+         Bearer JWT          +---------------------------------+
|  Next.js Frontend   | --------------------------> |   FastAPI AI Microservice       |
|     (Member 1)      | <-------------------------- |         (Port 8000)             |
+---------------------+     JSON Recommendations    +---------------------------------+
           |                                                        |
           | Supabase Auth                                          | Direct Service Role
           v                                                        v
+---------------------+                             +---------------------------------+
|    Supabase Auth    |                             |    Supabase Postgres DB         |
|  (Issues User JWT)  |                             |  (`crop_recommendations` Table) |
+---------------------+                             +---------------------------------+
```

---

## 🔑 2. Authentication & Authorization

All `/api/*` endpoints require a **Supabase-issued JWT access token**.

### Header Format
```http
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
Content-Type: application/json
```

### Authentication Logic
- **Production Mode (`USE_DEV_AUTH=false`)**: The API verifies the JWT's signature locally using PyJWT against `SUPABASE_JWT_SECRET` (HS256). No external network call is made to Supabase Auth during token verification, preserving sub-second latency.
- **Local Dev Mode (`USE_DEV_AUTH=true`)**: If no token is provided during local testing, a fallback developer UUID (`00000000-0000-0000-0000-000000000000`) is assigned automatically.

---

## 🏷️ 3. Enumerations & Allowed Input Values

### Seasons (`season`)
- `"kharif"` (Monsoon: June – October)
- `"rabi"` (Winter: November – April)
- `"zaid"` (Summer: March – June)

### Soil Types (`soil_type`)
- `"loamy"`, `"clay"`, `"sandy"`, `"red"`, `"black"`, `"alluvial"`, `"laterite"`

### Irrigation Types (`irrigation_type`)
- `"drip"`, `"sprinkler"`, `"canal"`, `"flood"`, `"rainfed"`

### Supported Crops (31 ICAR-Benchmarked Indian Crops)
> Rice (Paddy), Wheat, Tomato, Onion, Potato, Cotton, Sugarcane, Soybean, Maize, Groundnut, Chilli, Turmeric, Mustard, Chickpea, Banana, Bajra, Jowar, Ragi, Barley, Tur (Arhar), Moong, Urad, Masoor, Sunflower, Sesamum (Til), Safflower, Jute, Brinjal, Cabbage, Okra (Bhindi), Coriander (Dhania)

---

## 🛰️ 4. API Endpoints Reference

### 1. Service Health Check

`GET /health`  
**Auth Required:** None (Public)  
**Description:** Checks service status, version, and loaded reference dataset counts.

#### Response Example (`200 OK`)
```json
{
  "status": "healthy",
  "service": "agriconnect-ai",
  "version": "0.1.0",
  "crops_loaded": 31,
  "market_entries_loaded": 45
}
```

---

### 2. Generate AI Crop Recommendations

`POST /api/recommend`  
**Auth Required:** Yes (`Bearer <JWT>`)  
**Description:** Main recommendation engine endpoint. Fetches live weather for `(latitude, longitude)`, scores all 31 ICAR crops, computes profit ranges & risk indices, generates human-readable reasoning, and persists recommendations to Supabase DB.

#### Request Body
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "season": "kharif",
  "soil_type": "loamy",
  "irrigation_type": "drip",
  "land_size": 2.5
}
```

#### Response Example (`200 OK`)
```json
{
  "generated_at": "2026-08-10T16:30:00.000Z",
  "data_source": "live",
  "processed_context": {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "temperature_c": 27.4,
    "rainfall_mm": 850.0,
    "humidity_pct": 68.0,
    "weather_source": "live",
    "total_crops_evaluated": 31
  },
  "recommendations": [
    {
      "crop": "Tomato",
      "hindi_name": "टमाटर",
      "score": 92,
      "risk": 28,
      "profit_range": {
        "min": 216000,
        "max": 324000,
        "currency": "INR",
        "yield_per_acre_kg": 12000.0,
        "base_price_per_kg": 15.0,
        "msp_per_quintal": null
      },
      "components": {
        "weather_suitability": 95,
        "soil_compatibility": 100,
        "water_availability": 85,
        "market_demand": 100,
        "price_trend": 100,
        "seasonal_fit": 100
      },
      "reasoning": [
        "Temperature (27.4°C) and rainfall (850.0mm) are well suited to Tomato.",
        "Your loamy soil type is excellent for growing Tomato.",
        "Your drip irrigation setup is well-matched for this crop.",
        "Local market demand is currently strong."
      ],
      "confidence": "high",
      "sowing_window": "June - July",
      "harvesting_window": "October - November",
      "irrigation_advisory": "Maintain regular 3-day drip cycles during flowering.",
      "major_producing_states": ["Karnataka", "Andhra Pradesh", "Madhya Pradesh"]
    }
  ]
}
```

---

### 3. Single Commodity Mandi Price Lookup

`GET /api/market/prices`  
**Auth Required:** Yes (`Bearer <JWT>`)  
**Query Parameters:**
- `crop` (string, required) - e.g., `"Tomato"`
- `district` (string, optional) - e.g., `"Kolar"`
- `state` (string, optional) - e.g., `"Karnataka"`

#### Response Example (`200 OK`)
```json
{
  "crop": "Tomato",
  "district": "Kolar",
  "state": "Karnataka",
  "mandi": "Kolar APMC Mandi",
  "price": 1800.0,
  "msp_per_quintal": null,
  "unit": "per quintal",
  "trend": "up",
  "demand": "high",
  "suggested_selling_window": "Next 2 weeks",
  "price_history_7d": [1600.0, 1650.0, 1700.0, 1720.0, 1750.0, 1780.0, 1800.0],
  "price_history_30d": [1400.0, 1500.0, 1550.0, 1600.0, 1650.0, 1700.0, 1800.0],
  "data_source": "live_ogd"
}
```

---

### 4. Bulk Mandi Price Lookup (Marketplace Cards Batch)

`POST /api/market/bulk-prices`  
**Auth Required:** Yes (`Bearer <JWT>`)  
**Description:** Batch query endpoint for fetching live Mandi prices for multiple crop listings on the Marketplace feed in a single round-trip.

#### Request Body
```json
{
  "queries": [
    { "crop": "Tomato", "district": "Kolar", "state": "Karnataka" },
    { "crop": "Maize", "district": "Davangere", "state": "Karnataka" },
    { "crop": "Onion", "district": "Nashik", "state": "Maharashtra" }
  ]
}
```

#### Response Example (`200 OK`)
```json
{
  "results": [
    {
      "crop": "Tomato",
      "district": "Kolar",
      "state": "Karnataka",
      "mandi": "Kolar APMC Mandi",
      "price": 1800.0,
      "msp_per_quintal": null,
      "unit": "per quintal",
      "trend": "up",
      "demand": "high",
      "suggested_selling_window": "Next 2 weeks",
      "price_history_7d": [1600, 1650, 1700, 1720, 1750, 1780, 1800],
      "price_history_30d": [1400, 1500, 1550, 1600, 1650, 1700, 1800],
      "data_source": "live_ogd"
    }
  ],
  "total_items": 3,
  "data_source": "live"
}
```

---

### 5. Market Trends & History Analytics

`GET /api/market/trends`  
**Auth Required:** Yes (`Bearer <JWT>`)  
**Query Parameters:** `crop` (string, optional)

#### Response Example (`200 OK`)
```json
[
  {
    "crop": "Tomato",
    "district": "Kolar",
    "state": "Karnataka",
    "mandi": "Kolar APMC Mandi",
    "current_price": 1800.0,
    "msp_per_quintal": null,
    "trend": "up",
    "price_change_7d_pct": 12.5,
    "price_history_7d": [1600, 1650, 1700, 1720, 1750, 1780, 1800],
    "suggested_selling_window": "Next 2 weeks"
  }
]
```

---

### 6. Market Demand & Advisories

`GET /api/market/demand`  
**Auth Required:** Yes (`Bearer <JWT>`)  
**Query Parameters:** `crop` (string, optional)

#### Response Example (`200 OK`)
```json
[
  {
    "crop": "Tomato",
    "district": "Kolar",
    "mandi": "Kolar APMC Mandi",
    "demand": "high",
    "current_price": 1800.0,
    "msp_per_quintal": null,
    "demand_reason": "High urban consumer demand across Bangalore metropolitan markets."
  }
]
```

---

### 7. Analytics Summary Feed

`GET /api/analytics/summary`  
**Auth Required:** Yes (`Bearer <JWT>`)  
**Description:** Real-time analytics dashboard data summarizing total recommendations generated, top crops, and dataset statistics.

#### Response Example (`200 OK`)
```json
{
  "total_recommendations": 142,
  "most_recommended_crop": "Tomato",
  "avg_suitability_score": 84.5,
  "recommendation_distribution": {
    "Tomato": 45,
    "Rice (Paddy)": 38,
    "Maize (Corn)": 30,
    "Soybean": 29
  },
  "real_data_metrics": {
    "crops_dataset_size": 31,
    "apmc_mandis_covered": 45,
    "data_sources": ["Open-Meteo Weather API", "data.gov.in Agmarknet OGD API", "CACP MSP 2024-26"]
  },
  "generated_at": "2026-08-10T16:30:00.000Z"
}
```

---

## 🗄️ 5. Supabase Database Integration Contract

When `POST /api/recommend` is called by an authenticated user, the service automatically persists the top recommended crops into the Supabase Postgres `crop_recommendations` table using `SUPABASE_SERVICE_ROLE_KEY`.

### `crop_recommendations` Table Schema
```sql
CREATE TABLE public.crop_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    suitability_score INT NOT NULL,
    risk_score INT NOT NULL,
    estimated_profit_min INT NOT NULL,
    estimated_profit_max INT NOT NULL,
    weather_score INT NOT NULL,
    soil_score INT NOT NULL,
    water_score INT NOT NULL,
    demand_score INT NOT NULL,
    reasoning_summary JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 💻 6. Frontend Integration Code Snippets (TypeScript)

### 1. Calling `POST /api/recommend` in Next.js/React
```typescript
import { supabase } from "@/lib/supabaseClient";

export interface RecommendationRequest {
  latitude: number;
  longitude: number;
  season: "kharif" | "rabi" | "zaid";
  soil_type: string;
  irrigation_type: string;
  land_size: number;
}

export async function fetchCropRecommendations(requestData: RecommendationRequest) {
  // Extract user JWT access token from Supabase Auth session
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch("http://localhost:8000/api/recommend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(requestData),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch recommendations");
  }

  return await res.json();
}
```

### 2. Fetching Bulk Prices for Marketplace Cards
```typescript
export async function fetchMarketplaceBulkPrices(items: Array<{ crop: string; district?: string; state?: string }>) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch("http://localhost:8000/api/market/bulk-prices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ queries: items }),
  });

  return await res.json();
}
```

---

## ⚠️ 7. HTTP Error Codes & Handling

| Status Code | Reason | Cause / Fix |
|---|---|---|
| `200 OK` | Success | Request executed successfully. |
| `400 Bad Request` | Validation Error | Input field value outside allowed bounds (e.g. invalid `season` string or `latitude` out of range). |
| `401 Unauthorized` | Auth Failure | Missing, invalid, or expired Supabase JWT token in `Authorization` header. |
| `500 Internal Server Error` | Server Error | Missing `SUPABASE_JWT_SECRET` in production `.env` or server exception. |
