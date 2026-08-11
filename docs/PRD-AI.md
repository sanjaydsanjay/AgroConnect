# PRD — AI / Data Module (Member 3 Ownership)
## AgriConnect — Crop Recommendation & Market Intelligence

> This is a **sub-PRD** scoped to the AI/Data Lead's ownership inside the larger AgriConnect PRD. It exists so you can plan, build and demo your slice independently while staying integration-compatible with Backend (Member 2) and Frontend (Member 1).

---

## 1. Module Purpose

Turn a farmer's location, farm profile and current weather/market conditions into a **ranked, explainable set of crop recommendations**, plus supporting **market intelligence** (price trend, demand, selling window) and **risk/profit estimates**. This is the core "AI innovation" the whole demo is judged on.

## 2. Problem (from your surface)

Farmers don't know:
- what to plant given their soil, water and climate,
- what it's likely to earn them,
- how risky that choice is,
- when/where prices are best to sell.

Existing tools rarely explain *why* a recommendation was made — which erodes trust, especially for a hackathon judge evaluating "explainable AI."

## 3. Users of This Module

| Consumer | What they need from you |
|---|---|
| Farmer (end user, via Frontend) | Top 3 ranked crops with score, profit range, risk, plain-English reasoning |
| Frontend (Member 1) | A stable, documented API contract returning predictable JSON shapes |
| Backend (Member 2) | A callable service/function they can wire into `/api/farmer/recommendation` and persist to `crop_recommendations` |
| Admin/Analytics | Aggregate stats: avg suitability, most-recommended crops, model confidence |

## 4. Scope

### In Scope (Must Have)
- Deterministic **weighted scoring engine** (rules-based, not black-box ML) — reliable under demo conditions.
- Weather-suitability scoring (temperature, rainfall, humidity vs. crop reference ranges).
- Soil + irrigation compatibility scoring.
- Market demand + price-trend scoring (from seeded/mock dataset).
- Risk score and profit-range estimate per crop.
- Human-readable reasoning generation (templated, not free-form LLM — keeps it deterministic and fast).
- A small **reference crop dataset** (10–20 crops) with growing conditions, seasonality, typical yield/price.
- Fallback to cached/mock data if a live weather/market API is unavailable.

### Should Have
- Crop-to-crop comparison output (top 3 side by side).
- Simple time-series price trend (7/30-day mock or real).
- Confidence indicator per recommendation.

### Could Have
- Lightweight ML model (e.g., regression/XGBoost) trained on a synthetic dataset to *replace or blend with* the weighted score, framed as "v2 model" for pitch impact.
- Disease/image-based advisory (explicitly out of MVP; mention only as roadmap).

### Out of Scope
- Real satellite imagery pipelines.
- Live production-grade market data contracts.
- Any user-facing model retraining or feedback loop (log it for later, don't build it now).

## 5. Functional Requirements (AI Module)

**FR-AI-01 — Recommendation Generation**
Given `{latitude, longitude, season, soil_type, irrigation_type, land_size}`, return the top 3–5 crops ranked by suitability score (0–100).

**FR-AI-02 — Scoring Breakdown**
Each recommendation must expose the sub-scores that produced the final number (weather, soil, water, demand, price trend, seasonal fit) — this is what makes it "explainable."

**FR-AI-03 — Risk Score**
0–100 risk score per crop, derived from weather volatility, price volatility, and water dependency.

**FR-AI-04 — Profit Estimate**
A profit *range* (not a single number) per crop, derived from reference yield × price range × land size, minus a rough cost assumption.

**FR-AI-05 — Reasoning Text**
2–4 short, templated, human-readable bullet points per crop explaining the score (e.g., "Rainfall is within optimal range for this crop").

**FR-AI-06 — Market Intelligence**
Given a crop (+ optional district), return current/reference price, trend direction (up/down/flat), demand indicator (low/med/high), and a suggested selling window.

**FR-AI-07 — Graceful Degradation**
If the weather API or market dataset is unreachable, fall back to cached/mock values and flag `"data_source": "fallback"` in the response — never fail the request.

**FR-AI-08 — Analytics Feed**
Expose aggregate stats (most-recommended crop, average suitability score, recommendation volume) for the Admin analytics dashboard.

## 6. Non-Functional Requirements

- Recommendation must return in **< 3 seconds** (target from PRD: whole flow < 5s including network).
- Deterministic: same inputs → same outputs (needed for a stable demo; no randomness unless seeded).
- Must run as a **pure function / stateless service** so Backend can call it synchronously or as a background job.
- No hard dependency on any single external API — always have a local fallback dataset.

## 7. Success Metrics

- Recommendation generated in under 3 seconds for all 5 seeded farmer profiles.
- Reasoning text is judged as "makes sense" by at least 3 non-technical reviewers (pitch rehearsal check).
- Zero crashes when weather/market API is deliberately disabled (fallback test).
- Recommendation + market intelligence together answer: *what to grow, what it's worth, and when to sell.*

## 8. Deliverables Checklist (Member 3)

- [ ] `ai/datasets/crops.json` — reference crop dataset
- [ ] `ai/datasets/market_prices.json` — seeded market data (mock or real)
- [ ] `ai/recommendation/scoring.py` — weighted scoring engine
- [ ] `ai/recommendation/reasoning.py` — templated explanation generator
- [ ] `ai/recommendation/service.py` — single callable entrypoint (`generate_recommendations(...)`)
- [ ] `ai/recommendation/schemas.py` — Pydantic request/response models (shared contract with Backend)
- [ ] `ai/evaluation/test_cases.md` — sample inputs/outputs for demo farmers
- [ ] API contract doc (see TRD-AI.md) handed to Member 2 by end of Phase 2
