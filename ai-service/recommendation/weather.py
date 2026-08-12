"""
Live Weather Intelligence Module for AgriConnect.

Queries the Open-Meteo API (free, open-access, no key required) for real-time
meteorological data based on the farmer's geographic coordinates (latitude, longitude).
"""

import logging
import os
import httpx

logger = logging.getLogger("agriconnect.weather")

# Indian agro-climatic regional historical averages (used only if external network is unavailable)
REGIONAL_CLIMATE_BASELINE = {
    "north_india": {"temp_c": 28.5, "rainfall_mm": 650.0, "humidity_pct": 58.0},
    "south_india": {"temp_c": 27.8, "rainfall_mm": 920.0, "humidity_pct": 74.0},
    "west_india": {"temp_c": 29.2, "rainfall_mm": 780.0, "humidity_pct": 63.0},
    "east_india": {"temp_c": 28.0, "rainfall_mm": 1150.0, "humidity_pct": 79.0},
    "central_india": {"temp_c": 30.1, "rainfall_mm": 820.0, "humidity_pct": 61.0},
    "default": {"temp_c": 28.5, "rainfall_mm": 800.0, "humidity_pct": 65.0},
}


def get_regional_baseline_weather(lat: float, lon: float) -> dict:
    """Return historical agro-climatic baseline data for the coordinate region."""
    if lat > 22.0:
        region = "north_india"
    elif lat < 16.0:
        region = "south_india"
    elif lon < 76.0:
        region = "west_india"
    elif lon > 84.0:
        region = "east_india"
    else:
        region = "central_india"

    weather = REGIONAL_CLIMATE_BASELINE.get(region, REGIONAL_CLIMATE_BASELINE["default"]).copy()
    weather["source"] = "baseline_fallback"
    return weather


async def fetch_weather(lat: float, lon: float) -> dict:
    """Fetch real-time weather observation and forecast from Open-Meteo API.

    Queries:
      - Current temperature_2m (°C)
      - Current relative_humidity_2m (%)
      - Daily precipitation sum (mm)

    Returns:
        dict: {
            "temp_c": float,
            "rainfall_mm": float,
            "humidity_pct": float,
            "source": "live" | "baseline_fallback"
        }
    """
    if os.getenv("USE_FALLBACK_DATA", "false").lower() == "true":
        return get_regional_baseline_weather(lat, lon)

    # Open-Meteo live API endpoint
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,precipitation"
        f"&daily=precipitation_sum,temperature_2m_max,temperature_2m_min"
        f"&forecast_days=7&timezone=auto"
    )

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(2.0, connect=1.0)) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

            current = data.get("current", {})
            daily = data.get("daily", {})

            temp_c = current.get("temperature_2m")
            if temp_c is None:
                max_t = daily.get("temperature_2m_max", [30.0])[0]
                min_t = daily.get("temperature_2m_min", [20.0])[0]
                temp_c = (max_t + min_t) / 2.0

            humidity_pct = current.get("relative_humidity_2m", 65.0)

            # Sum 7-day forecasted precipitation (mm) for seasonal rainfall estimate
            precip_sums = daily.get("precipitation_sum", [])
            if precip_sums:
                # Estimate monthly seasonal rainfall from 7-day sample window
                rainfall_mm = sum(precip_sums) * 4.0
            else:
                current_precip = current.get("precipitation", 0.0)
                rainfall_mm = current_precip * 30.0

            logger.info(f"✅ Fetched live weather for ({lat}, {lon}): {temp_c}°C, {humidity_pct}%, {rainfall_mm}mm")
            return {
                "temp_c": float(temp_c),
                "rainfall_mm": float(max(100.0, rainfall_mm)),  # minimum floor for active season calculations
                "humidity_pct": float(humidity_pct),
                "source": "live",
            }

    except Exception as e:
        logger.warning(f"⚠️ Live Open-Meteo weather fetch failed ({e}). Using agro-climatic baseline.")
        return get_regional_baseline_weather(lat, lon)
