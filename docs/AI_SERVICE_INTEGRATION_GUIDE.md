# 🔌 AgriConnect AI Microservice — System Integration Guide

> **Target Audience:** Next.js Frontend Engineers (Member 1) & Supabase Backend/Database Engineers (Member 2)  
> **Service:** Python FastAPI AI Microservice (`ai-service`)  
> **Local Base URL:** `http://localhost:8000`  
> **Production Target:** `https://your-ai-service.up.railway.app`

---

## 🏗️ 1. System Architecture Overview

The `ai-service` operates as a standalone Python FastAPI microservice that provides real-time crop recommendation scoring, live weather analysis, Agmarknet Mandi market price intelligence, and regional multilingual NLP voice crop recognition.

```
+-----------------------------------------------------------------------------------+
|                                   CLIENT LAYER                                    |
|                                                                                   |
|                           Next.js 14 / React Frontend                             |
|                                    (Member 1)                                     |
+-----------------------------------------------------------------------------------+
       |                                                               |
       | 1. Authenticate & Obtain JWT                                  | 2. Direct HTTP API Call
       v                                                               v
+----------------------------+                     +--------------------------------+
|    SUPABASE AUTH & DB      |                     |      FASTAPI AI SERVICE        |
|         (Member 2)         |                     |           (Member 3)           |
|                            |                     |                                |
|  - auth.users              |                     |  - Live Open-Meteo Weather API |
|  - public.profiles         |                     |  - data.gov.in Mandi Price API |
|  - crop_recommendations    | <------------------ |  - Deterministic ICAR Engine   |
+----------------------------+   3. Service Role   |  - Regional NLP Voice Engine   |
                                    Insert Write   +--------------------------------+
```

---

## 🎨 2. Next.js Frontend Integration (Member 1 Guide)

### Step 2.1: Add Environment Variable
Add the AI service URL to your Next.js `.env.local` file:
```env
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
```

### Step 2.2: TypeScript Data Models (`types/ai-service.ts`)
Create a TypeScript type file in your Next.js project:

```typescript
export interface RecommendationRequest {
  latitude: number;
  longitude: number;
  season: "kharif" | "rabi" | "zaid";
  soil_type: "loamy" | "clay" | "sandy" | "red" | "black" | "alluvial" | "laterite";
  irrigation_type: "drip" | "sprinkler" | "canal" | "flood" | "rainfed";
  land_size: number; // in acres
}

export interface ProfitRange {
  min: number;
  max: number;
  currency: string;
  yield_per_acre_kg?: number;
  base_price_per_kg?: number;
  msp_per_quintal?: number;
}

export interface ComponentScores {
  weather_suitability: number;
  soil_compatibility: number;
  water_availability: number;
  market_demand: number;
  price_trend: number;
  seasonal_fit: number;
}

export interface CropRecommendation {
  crop: string;
  hindi_name?: string;
  score: number;
  risk: number;
  profit_range: ProfitRange;
  components: ComponentScores;
  reasoning: string[];
  confidence: "high" | "medium" | "low";
  sowing_window?: string;
  harvesting_window?: string;
  irrigation_advisory?: string;
  major_producing_states: string[];
}

export interface ProcessedContext {
  latitude: number;
  longitude: number;
  temperature_c: number;
  rainfall_mm: number;
  humidity_pct: number;
  weather_source: string;
  total_crops_evaluated: number;
}

export interface RecommendationResponse {
  generated_at: string;
  data_source: string;
  processed_context: ProcessedContext;
  recommendations: CropRecommendation[];
}

export interface VoiceSearchRequest {
  spoken_text: string;
  language?: string; // "auto", "hi", "kn", "mr", "ta", "te", "pa", "en-IN"
}

export interface VoiceCropMatch {
  crop: string;
  hindi_name?: string;
  matched_term: string;
  confidence_score: number;
  msp_per_quintal?: number;
  market_price_per_quintal?: number;
  trend?: string;
}

export interface VoiceSearchResponse {
  original_query: string;
  detected_language: string;
  intent: "price_query" | "recommendation_query" | "general_search";
  matched_crop?: VoiceCropMatch;
  all_candidate_matches: VoiceCropMatch[];
  response_summary: string;
}
```

### Step 2.3: Recommendation & Voice API Client (`lib/aiClient.ts`)
Create an API client module in Next.js:

```typescript
import { supabase } from "@/lib/supabaseClient";
import { RecommendationRequest, RecommendationResponse, VoiceSearchResponse } from "@/types/ai-service";

const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";

/**
 * Fetch top AI crop recommendations for a farmer.
 */
export async function getCropRecommendations(
  payload: RecommendationRequest
): Promise<RecommendationResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${AI_BASE_URL}/api/recommend`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `AI Service Error (${response.status})`);
  }

  return await response.json();
}

/**
 * Search crop details and spot prices using spoken regional voice query transcript.
 */
export async function searchCropByVoice(
  spokenText: string,
  language: string = "auto"
): Promise<VoiceSearchResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${AI_BASE_URL}/api/voice/search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ spoken_text: spokenText, language }),
  });

  if (!response.ok) {
    throw new Error("Voice search API request failed");
  }

  return await response.json();
}

/**
 * Fetch live Mandi spot prices for Marketplace crop cards in bulk.
 */
export async function getBulkMarketPrices(
  items: Array<{ crop: string; district?: string; state?: string }>
) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${AI_BASE_URL}/api/market/bulk-prices`, {
    method: "POST",
    headers,
    body: JSON.stringify({ queries: items }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch marketplace bulk prices");
  }

  return await response.json();
}
```

### Step 2.4: React Microphone Voice Search Component (`components/VoiceCropSearchButton.tsx`)
```tsx
import { useState } from "react";
import { searchCropByVoice } from "@/lib/aiClient";
import { VoiceSearchResponse } from "@/types/ai-service";

export default function VoiceCropSearchButton() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<VoiceSearchResponse | null>(null);

  function startVoiceRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Web Speech API is not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN"; // Supports hi-IN, kn-IN, mr-IN, ta-IN, te-IN, en-IN
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = async (event: any) => {
      const spokenText = event.results[0][0].transcript;
      setTranscript(spokenText);

      // Call AI Service NLP Voice Search
      try {
        const res = await searchCropByVoice(spokenText, "auto");
        setResult(res);
      } catch (err) {
        console.error("Voice NLP search error:", err);
      }
    };

    recognition.start();
  }

  return (
    <div className="p-4 border rounded-lg bg-emerald-50">
      <button
        onClick={startVoiceRecognition}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700"
      >
        🎙️ {listening ? "Listening... Speak Now" : "Speak Crop Name (Voice Search)"}
      </button>

      {transcript && <p className="mt-2 text-sm text-gray-700">Spoken: "{transcript}"</p>}

      {result && result.matched_crop && (
        <div className="mt-3 p-3 bg-white border rounded shadow-sm">
          <h4 className="font-bold text-emerald-800">
            {result.matched_crop.crop} ({result.matched_crop.hindi_name})
          </h4>
          <p className="text-sm text-gray-600">Intent: {result.intent.toUpperCase()}</p>
          <p className="font-semibold text-emerald-700">{result.response_summary}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🗄️ 3. Supabase Backend & Database Integration (Member 2 Guide)

### Step 3.1: Postgres Database Schema Migration
Member 2 must run this SQL migration in the **Supabase SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS public.crop_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    suitability_score INT NOT NULL CHECK (suitability_score BETWEEN 0 AND 100),
    risk_score INT NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    estimated_profit_min INT NOT NULL,
    estimated_profit_max INT NOT NULL,
    weather_score INT NOT NULL DEFAULT 0,
    soil_score INT NOT NULL DEFAULT 0,
    water_score INT NOT NULL DEFAULT 0,
    demand_score INT NOT NULL DEFAULT 0,
    reasoning_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crop_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own crop recommendations"
ON public.crop_recommendations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert crop recommendations"
ON public.crop_recommendations FOR INSERT TO service_role
WITH CHECK (true);
```

---

## 🧪 4. Voice Search Verification Commands

```bash
# 1. Test Hindi Voice Query
curl -X POST http://localhost:8000/api/voice/search \
  -H "Content-Type: application/json" \
  -d '{"spoken_text": "मुझे टमाटर की कीमत बताओ"}'

# 2. Test Kannada Voice Query
curl -X POST http://localhost:8000/api/voice/search \
  -H "Content-Type: application/json" \
  -d '{"spoken_text": "ಕಬ್ಬಿನ ಬೆಳೆ ಧಾರಣೆ ಎಷ್ಟು"}'

# 3. Test Hinglish Voice Query
curl -X POST http://localhost:8000/api/voice/search \
  -H "Content-Type: application/json" \
  -d '{"spoken_text": "makka ka rate kitna hai"}'
```
