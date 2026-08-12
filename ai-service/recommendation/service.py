"""
Recommendation service orchestrator.

Wires together scoring, reasoning, weather, and Agmarknet Mandi market modules (OGD India API),
attaches real-world processed context metadata, and optionally persists
the results into Supabase Postgres via db.py.
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from recommendation.scoring import score_crop
from recommendation.reasoning import build_reasoning
from recommendation.market import get_market_intel, fetch_live_ogd_mandi_prices
from db import insert_recommendations


async def generate_recommendations(
    request,
    crops_data: list,
    market_data: list,
    weather: dict,
    user_id: Optional[str] = None
) -> dict:
    """Main entry point for generating crop recommendations with real-world processed context."""
    scored_crops = []
    data_source = weather.get("source", "live")

    import asyncio

    # 1. Fast in-memory scoring of all crops using baseline dataset
    district_param = getattr(request, "district", None)
    for crop in crops_data:
        market_intel = get_market_intel(crop["name"], district_param, market_data)

        # Score the crop against ICAR benchmarks & live weather
        result = score_crop(
            crop=crop,
            weather=weather,
            soil_type=request.soil_type,
            irrigation_type=request.irrigation_type,
            season=request.season,
            land_size=request.land_size,
            market_data=market_intel,
        )

        # Generate data-backed reasoning text with MSP & weather figures
        reasoning = build_reasoning(
            components=result["components"],
            crop_name=result["crop"],
            season=request.season,
            weather=weather,
            crop_info=crop,
        )
        result["reasoning"] = reasoning
        scored_crops.append(result)

    # 2. Sort by score descending and pick top 5 candidates
    scored_crops.sort(key=lambda x: x["score"], reverse=True)
    top_5 = scored_crops[:5]

    # 3. Concurrently enrich top 5 candidates with live OGD Agmarknet Mandi prices
    try:
        live_mandi_tasks = [
            fetch_live_ogd_mandi_prices(c["crop"], district=district_param)
            for c in top_5
        ]
        live_mandi_results = await asyncio.gather(*live_mandi_tasks, return_exceptions=True)

        for idx, live_intel in enumerate(live_mandi_results):
            if isinstance(live_intel, dict) and live_intel.get("price_per_quintal"):
                top_5[idx]["profit_range"]["base_price_per_kg"] = round(live_intel["price_per_quintal"] / 100.0, 1)
                top_5[idx]["market_intel"] = live_intel
    except Exception:
        pass

    # Asynchronously persist to Supabase DB if user_id is provided
    if user_id:
        try:
            await insert_recommendations(user_id, top_5)
        except Exception:
            pass

    processed_context = {
        "latitude": request.latitude,
        "longitude": request.longitude,
        "temperature_c": round(weather.get("temp_c", 28.0), 1),
        "rainfall_mm": round(weather.get("rainfall_mm", 800.0), 1),
        "humidity_pct": round(weather.get("humidity_pct", 65.0), 1),
        "weather_source": data_source,
        "total_crops_evaluated": len(crops_data),
    }

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_source": data_source,
        "processed_context": processed_context,
        "recommendations": top_5,
    }
