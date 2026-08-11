# Implementation Plan — AI / Data Module (Member 3)
## AgriConnect Hackathon

Aligned to the overall team's `implementation-plan.md` and `phases.md`. This is your personal execution track.

---

## Day 0 (Kickoff, with whole team)
- **Architecture note:** the team is hosting the backend on Supabase (Auth + Postgres + RLS), not a custom FastAPI server. Your AI module therefore ships as its **own standalone Python service**, deployed separately (Railway preferred), and called directly by the frontend with a Supabase-issued JWT.
- Agree on the `RecommendationRequest` / `RecommendationResponse` schema with whoever owns the Supabase schema — lock field names, types, units (₹, kg, mm, °C), and the exact `crop_recommendations` column names you'll insert into.
- Get the `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` from whoever set up the Supabase project (Dashboard → Project Settings → API) — you'll need all three.
- Agree with Frontend (Member 1) that you'll hand them a mock JSON response *and* a placeholder base URL by end of Day 1 so they aren't blocked.
- Decide weather source (Open-Meteo recommended — free, no API key, good enough for a demo) and confirm fallback strategy.
- Create a Railway account/project early — first deploy on Day 1, even with a stub `/health` route, so you're not debugging deployment for the first time on Day 3.

## Day 1 — Foundation
**Goal: a working, deterministic scoring engine end-to-end on fake data.**
- [ ] Build `crops.json` with 10–15 crops (real reference ranges — this sells the demo).
- [ ] Build `market_prices.json` seeded with plausible prices/trends/demand per crop.
- [ ] Implement `scoring.py`: all 6 component scores + weighted final score.
- [ ] Implement `schemas.py` (Pydantic models) — share immediately with Member 2.
- [ ] Implement `service.py::generate_recommendations()` wired to mock/static weather (no live API yet).
- [ ] Scaffold `main.py` as a standalone FastAPI app with `/health` and a stub `/api/recommend` route, CORS enabled for `localhost:3000`.
- [ ] Deploy the stub to Railway (or Render/Fly) to confirm the pipeline works — get a real public URL today, not on Day 3.
- [ ] Write 5 hand-picked test inputs (matching the seeded demo farmers in `implementation-plan.md` §7) and verify outputs look agronomically sane.
- [ ] Hand Frontend a static example JSON response *plus* the live (stub) service URL.
- **Exit criteria:** calling `generate_recommendations(fake_input)` returns a valid, explainable response locally, AND a deployed `/health` check succeeds from the public URL.

## Day 2 — Core Intelligence
**Goal: real weather integration, reasoning generation, market service, connected to Backend.**
- [ ] Implement `weather.py::fetch_weather(lat, lon)` against Open-Meteo, with timeout + try/except fallback to cached values.
- [ ] Implement `reasoning.py` — templated explanation generator driven by component scores.
- [ ] Implement risk score formula (independent from suitability — weather + price volatility + water dependency).
- [ ] Implement profit-range estimator (yield × price × land_size, cost-adjusted).
- [ ] Implement `market.py::get_market_intel(crop, district)` for the `/api/market/prices` endpoint.
- [ ] Implement `auth.py::verify_supabase_token()` (PyJWT against `SUPABASE_JWT_SECRET`) and wire it as a FastAPI dependency on every route except `/health`.
- [ ] Implement `db.py`: `supabase-py` client using the service role key, plus an `insert_recommendation()` helper that writes to `crop_recommendations` with the verified `user_id`.
- [ ] Wire `/api/recommend` end-to-end: verify token → call `generate_recommendations()` → insert result → return response.
- [ ] Redeploy to Railway; confirm Frontend can call the *real* deployed endpoint with a real Supabase session token.
- [ ] Confirm Frontend's recommendation UI renders correctly against your *real* output, not just the mock.
- **Exit criteria:** a farmer profile submitted through the real UI produces a real, explainable recommendation end-to-end, and the row lands correctly in Supabase's `crop_recommendations` table.

## Day 3 — Complete the Loop
**Goal: analytics feed, resilience, tuning.**
- [ ] Implement `/api/analytics/summary` (most-recommended crop, avg suitability, volume) — either the Admin dashboard calls this directly, or reads it straight from Supabase if it's cheaper to aggregate with a Postgres view. Confirm with whoever builds the Admin UI which they'd rather do.
- [ ] Add the `USE_FALLBACK_DATA` env flag and verify the whole flow still works with network disabled (both weather API *and* Supabase briefly unreachable).
- [ ] Tune weights/scoring if any demo farmer produces a nonsensical top recommendation.
- [ ] Add price-trend mini time series (7/30-day) if time allows, for Frontend's chart.
- [ ] Write/finish unit tests (`pytest`) for scoring, reasoning, JWT verification, and fallback paths.
- [ ] Double check Railway env vars are set on the production deploy (not just local `.env`) — this is the #1 last-minute failure mode.
- **Exit criteria:** all 5 seeded demo farmers + all seeded listings/orders flow through recommendation → market intel → analytics without manual intervention, against the deployed URL.

## Final Day — Polish
- [ ] Re-run the full golden demo path (`mvp-scope.md` §Golden Demo) at least 3 times back-to-back for stability.
- [ ] Verify latency: cold start once, then confirm every subsequent call is sub-second (data cached in memory).
- [ ] Prepare 2–3 talking points on the algorithm for the pitch (why weighted scoring over black-box ML for a hackathon; what "explainable AI" means here).
- [ ] Freeze `crops.json` / `market_prices.json` — no last-minute edits during rehearsal.
- [ ] Support Member 4 in final regression and demo recording.

## 11. Working Agreement With Supabase Schema Owner
- Whoever owns the Supabase schema (likely Member 2) must give you exact column names/types for `crop_recommendations` before Day 2 — your `db.py::insert_recommendation()` writes directly into it, there's no route handler translating between you.
- You own the `SUPABASE_SERVICE_ROLE_KEY` on your deployment only — never commit it, never send it to the frontend.
- Daily 5-minute contract check: did the request/response shape or DB columns change? If so, update `schemas.py`/`db.py` and message the team immediately.

## 12. Working Agreement With Frontend (Member 1)
- Ship the mock response file (`evaluation/mock_response.json`) *and* your Railway service URL on Day 1 so they build in parallel and can start real integration testing early.
- Any field you add/remove/rename after Day 1 must be flagged same-day — Frontend's charts are field-name-sensitive (Recharts radar chart keys off your `components` object keys).
- Confirm with Frontend how they attach the Supabase access token to requests (`supabase.auth.getSession()` → `session.access_token` → `Authorization: Bearer ...` header) — this is a common integration snag.

## 13. Contingencies (mirrors team-level contingency plan)
| Failure | Your fallback |
|---|---|
| Weather API down/rate-limited | Cached seasonal-average weather per district, flagged `data_source: fallback` |
| Market data unavailable | Static seeded `market_prices.json`, same flag |
| Railway deploy breaks close to demo time | Redeploy to Render (free tier) as backup — keep both configured once you have time, don't wait until it's an emergency |
| JWT verification failing unexpectedly | Double/triple-check `SUPABASE_JWT_SECRET` matches the Supabase dashboard exactly (a stale copy is the most common cause) |
| Scoring produces a nonsensical result for a seeded farmer | Adjust weights or the specific crop's reference ranges in `crops.json` — don't touch the formula under time pressure, fix the data |
