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

    for crop in crops_data:
        # Query live data.gov.in Agmarknet API first, fallback to baseline
        district_param = getattr(request, "district", None)
        market_intel = await fetch_live_ogd_mandi_prices(crop["name"], district=district_param)
        if not market_intel:
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

    # Sort by score descending, take top 5
    scored_crops.sort(key=lambda x: x["score"], reverse=True)
    top_5 = scored_crops[:5]

    # Asynchronously persist to Supabase DB if user_id is provided
    # (Removed: Persistence ownership belongs to the Supabase backend Edge Function)
    if user_id:
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
