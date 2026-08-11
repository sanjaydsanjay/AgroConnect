# TRD — AI / Data Module (Member 3 Ownership)
## AgriConnect — Recommendation Engine, Market Intelligence & Integration

---

## 1. Where This Fits in the Overall System

**Backend decision: the team is hosting the backend on Supabase (Auth + Postgres + PostgREST/RLS), not a custom-hosted FastAPI app.** Supabase does not run arbitrary Python compute, so the AI module cannot live "inside" the backend the way a traditional FastAPI monolith would. Instead, it ships as its **own small Python service**, deployed separately, called directly by the frontend.

```text
Frontend (Next.js, Vercel)
   |
   +--> Supabase JS client ---------------> Supabase (Auth, Postgres, Storage, RLS)
   |
   +--> HTTPS + "Authorization: Bearer <supabase_access_token>"
              |
              v
        AI Service (FastAPI — Member 3)
        deployed on Railway / Render / Fly
              |
              +--> verify JWT against SUPABASE_JWT_SECRET (no DB round-trip needed)
              +--> crops.json / market_prices.json (in-memory reference data)
              +--> Weather API (external, optional, with fallback)
              +--> write result to Supabase Postgres via supabase-py
                   (service_role key, server-side only)
              |
              v
        returns RecommendationResponse -> Frontend
```

**Key points:**
- Your service is the **only Python component** in the system — there's no separate custom backend to embed into.
- It **does not use Supabase Auth to log users in** — it only *verifies* tokens Supabase already issued, using the project's JWT secret (HS256, no network call required, so this stays fast).
- It **writes directly to Supabase Postgres** using `supabase-py` with the service role key — this is your only DB write path, so make sure the `crop_recommendations` insert matches the schema in `trd.md` exactly.
- Optionally, a thin Supabase Edge Function can sit in front of your service as a same-origin proxy — skip this unless you have spare time; it adds a hop without solving a real problem for a hackathon.

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Language | Python 3.11+ | shared with backend |
| Data handling | pandas | crop/market dataset manipulation |
| Scoring | plain Python + numpy | deterministic weighted formula (see PRD FR-AI-01) |
| Optional ML | scikit-learn / XGBoost | only if time allows, as a "v2" blend, not a dependency |
| Schema/contract | Pydantic | shared models importable by FastAPI routes |
| Storage | Supabase Postgres | written directly via `supabase-py`, service_role key |
| Weather source | Open-Meteo (free, no key) or OpenWeather | must have a static fallback JSON either way |
| Auth verification | PyJWT | verifies Supabase-issued JWT locally against `SUPABASE_JWT_SECRET`, no round trip |
| API framework | FastAPI + Uvicorn | serves the AI service as a standalone deployable app |
| Hosting | Railway (preferred), Render free tier, or Fly.io | see §7 for tradeoffs |
| Testing | pytest | scoring functions, edge cases, fallback behavior, JWT verification |

## 3. Module Structure (standalone deployable service — its own repo or top-level folder)

```text
ai-service/
├── main.py                   # FastAPI app: routes, CORS, startup dataset loading
├── auth.py                   # verify_supabase_token() — PyJWT against SUPABASE_JWT_SECRET
├── db.py                     # supabase-py client init (service role key), insert helpers
├── requirements.txt
├── .env.example               # SUPABASE_URL, SUPABASE_JWT_SECRET, SUPABASE_SERVICE_ROLE_KEY, WEATHER_API_KEY
├── datasets/
│   ├── crops.json            # reference crop conditions, yield, base price
│   └── market_prices.json    # seeded price/demand/trend per crop+district
├── recommendation/
│   ├── __init__.py
│   ├── schemas.py            # Pydantic: RecommendationRequest / RecommendationResponse
│   ├── weather.py            # fetch_weather(lat, lon) with fallback
│   ├── scoring.py            # score_crop(...) -> component + final scores
│   ├── reasoning.py          # build_reasoning(component_scores) -> List[str]
│   ├── market.py             # get_market_intel(crop, district)
│   └── service.py            # generate_recommendations(request) -> RecommendationResponse
└── evaluation/
    └── test_cases.md
```

### Routes (`main.py`)

```http
POST /api/recommend          # -> generate_recommendations()
GET  /api/market/prices      # -> get_market_intel()
GET  /api/analytics/summary  # -> aggregate stats for Admin dashboard
GET  /health                 # -> used to "warm up" the service before a demo
```
All routes except `/health` require the `Authorization: Bearer <supabase_access_token>` header.

## 4. Data Contracts (shared with Backend & Frontend)

### Request — `POST /api/farmer/recommendation`

```json
{
  "latitude": 12.97,
  "longitude": 77.59,
  "season": "kharif",
  "soil_type": "loamy",
  "irrigation_type": "drip",
  "land_size": 2.5
}
```

### Response

```json
{
  "generated_at": "2026-08-10T10:00:00Z",
  "data_source": "live",
  "recommendations": [
    {
      "crop": "Tomato",
      "score": 86,
      "risk": 24,
      "profit_range": { "min": 45000, "max": 65000, "currency": "INR" },
      "components": {
        "weather_suitability": 90,
        "soil_compatibility": 85,
        "water_availability": 80,
        "market_demand": 88,
        "price_trend": 75,
        "seasonal_fit": 95
      },
      "reasoning": [
        "Temperature is within the optimal range for this crop.",
        "Expected rainfall is adequate for the current season.",
        "Local demand is currently high."
      ],
      "confidence": "high"
    }
  ]
}
```

This exact shape is what you hand to Member 2 (who wires the route and persists to `crop_recommendations`) and Member 1 (who renders cards/charts from it). **Lock this contract by end of Phase 1** so both of them can build against a mock of it while you build the real logic.

### Market Intelligence — `GET /api/market/prices?crop=Tomato&district=X`

```json
{
  "crop": "Tomato",
  "district": "X",
  "price": 1800,
  "unit": "per quintal",
  "trend": "up",
  "demand": "high",
  "suggested_selling_window": "Next 2 weeks",
  "data_source": "live"
}
```

## 5. Recommendation Algorithm (Deterministic Weighted Scoring)

```text
Final Score =
  25% Weather Suitability
+ 20% Soil Compatibility
+ 15% Water Availability
+ 15% Market Demand
+ 15% Price Trend
+ 10% Seasonal Fit
```

Each component is normalized 0–100 before weighting.

**Weather Suitability** — compare live/forecast temperature, rainfall, humidity against each crop's reference range in `crops.json`; score = closeness-to-optimal (triangular scoring: 100 at optimal midpoint, decaying to 0 at the edges of the tolerable range, 0 outside it).

**Soil Compatibility** — lookup table: crop × soil_type → 0/50/100 (poor/ok/ideal).

**Water Availability** — irrigation_type vs. crop's water requirement tier (low/med/high) → scored table.

**Market Demand / Price Trend** — pulled from `market_prices.json` (or live source later); demand mapped low/med/high → 30/65/100; trend mapped down/flat/up → 40/70/100.

**Seasonal Fit** — is the crop's ideal sowing season == input season? 100/50/0.

**Risk Score** — weighted combination of weather volatility (variance in seasonal rainfall/temp), price volatility (recent trend swings), and water dependency (high-water crops = higher risk under irrigation constraints). Keep this as a second, independent formula — don't just invert the suitability score, or judges will notice it's not doing real work.

**Profit Estimate** — `land_size × reference_yield_per_acre × price_range` minus a flat assumed cost percentage (e.g., 30%), expressed as a min–max range to reflect price uncertainty.

**Reasoning Generation** — templated sentences keyed off which components scored high/low, e.g.:
```python
if components["weather_suitability"] >= 80:
    reasons.append("Temperature and rainfall are well suited to this crop.")
elif components["weather_suitability"] < 50:
    reasons.append("Weather conditions are only marginally suitable — plan for irrigation backup.")
```
Keep this rule-based, not an LLM call — it must be instant and never fail/hallucinate mid-demo.

## 6. Reference Dataset (`crops.json`) — Shape

```json
{
  "name": "Tomato",
  "season": ["kharif", "rabi"],
  "temp_range_c": [20, 30],
  "rainfall_range_mm": [600, 1200],
  "soil_types": { "loamy": 100, "clay": 50, "sandy": 40 },
  "water_requirement": "medium",
  "yield_per_acre_kg": 18000,
  "base_price_per_kg": 15
}
```
Populate 10–20 crops common to your target region (India-focused given the doc's ₹ currency). This is the single most demo-critical file — get it realistic, it's what judges will fact-check first.

## 7. Integration Points — Concretely

### With Frontend (Member 1)
- Frontend calls your service **directly** over HTTPS: `POST https://<your-service>.up.railway.app/api/recommend`, with header `Authorization: Bearer <supabase_access_token>` (the token the Supabase JS client already holds client-side after login).
- Give Frontend your service's base URL plus a **mock JSON file** matching the response contract on Day 1 so they can build the recommendation UI (score cards, radar/bar chart of components, reasoning list) without waiting on your real logic or your deployment being live yet.
- Recharts on their side maps directly onto your `components` object (radar chart) and `score`/`risk` (gauge or bar).
- CORS: add the frontend's Vercel domain (and `http://localhost:3000` for local dev) to FastAPI's `CORSMiddleware` allow-list.

### With Supabase (Auth + Postgres — no custom backend in between)
- **Auth (read-only, no login logic):** verify the incoming JWT locally using `PyJWT` and the project's `SUPABASE_JWT_SECRET` (Dashboard → Project Settings → API). This requires no network call, so it doesn't add latency. Extract `sub` (the user id) from the decoded payload to know which farmer made the request.
- **Reads:** if you need `farmer_profiles` data your endpoint didn't receive in the request body, query it via `supabase-py` using the anon key + forwarded user JWT (so RLS applies) — but prefer having Frontend just send the needed profile fields directly in the request body to avoid an extra round trip.
- **Writes:** insert the generated recommendation into `crop_recommendations` using `supabase-py` initialized with the **service role key** (server-side only — never expose this key to the frontend). This key bypasses RLS, so double-check you're inserting with the correct `user_id` from the verified JWT, not a client-supplied one.
- Agree on the exact `crop_recommendations` column names with whoever owns the Supabase schema (see `trd.md` §4) before Day 2 so your insert doesn't fail on a mismatch.

### With Deployment
- Deploy the AI service as its own small app on **Railway** (fastest to set up for a hackathon: connect GitHub repo → auto-detects Python/FastAPI → set env vars → get a public URL in minutes). Render free tier or Fly.io are fine fallbacks if Railway credits run out — just account for Render's cold-start delay before a live demo.
- Environment variables needed: `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, optionally `WEATHER_API_KEY`, and `USE_FALLBACK_DATA` (flip to `true` instantly if live weather/market calls misbehave mid-presentation).
- Ship `crops.json` / `market_prices.json` inside the repo (not a database table) so the demo works even if Supabase is briefly unreachable — read them into memory once at process startup, not per-request.
- **Warm the service before your demo slot** if using Render's free tier — hit the health-check endpoint a few minutes before presenting so the first real request isn't slowed by a cold start.

## 8. Error Handling & Fallback Strategy

```text
try:
    weather = fetch_weather(lat, lon)         # live API, 2s timeout
except (Timeout, ConnectionError, ...):
    weather = load_cached_weather(lat, lon)   # nearest seeded profile
    data_source = "fallback"
```
Same pattern for market data. Always return a valid response — never propagate a raw exception to Backend/Frontend. Log the fallback event so Member 4 can call it out as a resilience feature in the pitch.

## 9. Testing

- **Unit**: scoring functions per component, edge cases (missing soil type, extreme weather values, zero land size).
- **Golden cases**: run all 5 seeded demo farmers through `generate_recommendations` and hand-verify the output makes agronomic sense (Day 2/3).
- **Fallback test**: disable network access and confirm the service still returns a valid, clearly-flagged response.
- **Latency test**: confirm < 3s for a cold call and < 1s warm (data loaded once at startup, not per-request).

## 10. Non-Functional Requirements

- Stateless, side-effect-free scoring functions (pure functions → easy to unit test).
- Dataset loaded once into memory at process start, not re-read per request.
- No secrets in `crops.json`/`market_prices.json`; any real API key goes in `.env`, never committed.
