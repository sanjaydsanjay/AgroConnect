"""
Deterministic ICAR-weighted scoring engine for crop recommendations.

Scoring Formula:
    Final Score = 25% Weather + 20% Soil + 15% Water + 15% Demand + 15% Price + 10% Season

All functions are pure and side-effect-free — same inputs always produce same outputs.
"""

from typing import Dict, Any, List
import statistics


def _triangular_score(value: float, range_min: float, range_max: float) -> float:
    """Triangular scoring: 100 at the optimal midpoint of the range,
    decaying linearly to 0 at the edges. 0 outside the range.
    """
    if range_max <= range_min:
        return 50.0

    if value < range_min or value > range_max:
        return 0.0

    span = range_max - range_min
    opt_min = range_min + span * 0.25
    opt_max = range_max - span * 0.25

    if opt_min <= value <= opt_max:
        return 100.0

    midpoint = (range_min + range_max) / 2.0
    if value < midpoint:
        return max(0.0, 100.0 * (value - range_min) / (opt_min - range_min))
    else:
        return max(0.0, 100.0 * (range_max - value) / (range_max - opt_max))


def score_weather_suitability(temp: float, rainfall: float, humidity: float, crop: Dict[str, Any]) -> int:
    """Score weather conditions against crop's optimal ranges."""
    temp_range = crop.get("temp_range_c", [15, 35])
    rain_range = crop.get("rainfall_range_mm", [400, 1200])
    hum_range = crop.get("humidity_range_pct", [40, 80])

    t_score = _triangular_score(temp, temp_range[0], temp_range[1])
    r_score = _triangular_score(rainfall, rain_range[0], rain_range[1])
    h_score = _triangular_score(humidity, hum_range[0], hum_range[1])

    return int((t_score + r_score + h_score) / 3)


def score_soil_compatibility(soil_type: str, crop: Dict[str, Any]) -> int:
    """Lookup from crop's soil_types dict."""
    soil_types = crop.get("soil_types", {})
    return int(soil_types.get(soil_type.lower(), 30))


def score_water_availability(irrigation_type: str, crop: Dict[str, Any]) -> int:
    """Score based on irrigation type vs crop water requirement."""
    req = crop.get("water_requirement", "medium").lower()
    irrig = irrigation_type.lower()

    mapping = {
        "high":   {"rainfed": 30, "canal": 60, "drip": 70, "sprinkler": 75, "flood": 90},
        "medium": {"rainfed": 50, "canal": 75, "drip": 85, "sprinkler": 80, "flood": 80},
        "low":    {"rainfed": 70, "canal": 85, "drip": 95, "sprinkler": 90, "flood": 70},
    }

    req_map = mapping.get(req, mapping["medium"])
    return int(req_map.get(irrig, 50))


def score_market_demand(demand: str) -> int:
    """low=30, medium=65, high=100. Default 50."""
    d = demand.lower()
    if d == "low":
        return 30
    elif d == "medium":
        return 65
    elif d == "high":
        return 100
    return 50


def score_price_trend(trend: str) -> int:
    """down=40, flat=70, up=100. Default 60."""
    t = trend.lower()
    if t == "down":
        return 40
    elif t == "flat":
        return 70
    elif t == "up":
        return 100
    return 60


def score_seasonal_fit(season: str, crop: Dict[str, Any]) -> int:
    """100 if season is in crop's season list, 50 if adjacent season, 0 otherwise."""
    seasons = [s.lower() for s in crop.get("season", [])]
    season_lower = season.lower()

    if season_lower in seasons:
        return 100

    order = ["kharif", "rabi", "zaid"]
    if season_lower in order:
        idx = order.index(season_lower)
        prev_s = order[(idx - 1) % 3]
        next_s = order[(idx + 1) % 3]
        if prev_s in seasons or next_s in seasons:
            return 50
    return 0


def calculate_final_score(components: Dict[str, int]) -> int:
    """Weighted combination of all component scores."""
    score = (
        components.get("weather_suitability", 0) * 0.25
        + components.get("soil_compatibility", 0) * 0.20
        + components.get("water_availability", 0) * 0.15
        + components.get("market_demand", 0) * 0.15
        + components.get("price_trend", 0) * 0.15
        + components.get("seasonal_fit", 0) * 0.10
    )
    return int(score)


def calculate_risk_score(
    weather_score: int,
    price_history: List[float],
    water_requirement: str,
) -> int:
    """Independent risk formula."""
    weather_risk = max(0, min(100, 100 - weather_score))

    if price_history and len(price_history) >= 2:
        mean_price = statistics.mean(price_history)
        if mean_price > 0:
            stdev = statistics.stdev(price_history)
            cv = (stdev / mean_price) * 100
            price_risk = max(0, min(100, int(cv * 10)))
        else:
            price_risk = 50
    else:
        price_risk = 30

    water_dep = water_requirement.lower()
    if water_dep == "high":
        water_risk = 70
    elif water_dep == "medium":
        water_risk = 40
    elif water_dep == "low":
        water_risk = 15
    else:
        water_risk = 40

    score = (weather_risk * 0.40) + (price_risk * 0.30) + (water_risk * 0.30)
    return int(max(0, min(100, score)))


def calculate_profit_range(land_size: float, crop: Dict[str, Any], price_per_quintal: float) -> Dict[str, Any]:
    """Estimate profit range using ICAR yield benchmarks."""
    yield_per_acre_kg = crop.get("yield_per_acre_kg", 1000)
    cost_pct = crop.get("cost_pct", 30)

    price_per_kg = price_per_quintal / 100.0
    base_revenue = land_size * yield_per_acre_kg * price_per_kg
    profit_factor = 1.0 - (cost_pct / 100.0)

    min_profit = int(base_revenue * 0.8 * profit_factor)
    max_profit = int(base_revenue * 1.2 * profit_factor)

    return {
        "min": min_profit,
        "max": max_profit,
        "currency": "INR",
        "yield_per_acre_kg": yield_per_acre_kg,
        "base_price_per_kg": crop.get("base_price_per_kg"),
        "msp_per_quintal": crop.get("msp_per_quintal"),
    }


def score_crop(
    crop: Dict[str, Any],
    weather: Dict[str, Any],
    soil_type: str,
    irrigation_type: str,
    season: str,
    land_size: float,
    market_data: Dict[str, Any],
) -> Dict[str, Any]:
    """Main entry: score a single crop against all real-world inputs."""
    temp = weather.get("temp_c", 28.0)
    rainfall = weather.get("rainfall_mm", 800.0)
    humidity = weather.get("humidity_pct", 65.0)

    w_score = score_weather_suitability(temp, rainfall, humidity, crop)
    s_score = score_soil_compatibility(soil_type, crop)
    wa_score = score_water_availability(irrigation_type, crop)
    d_score = score_market_demand(market_data.get("demand", "medium"))
    p_score = score_price_trend(market_data.get("trend", "flat"))
    se_score = score_seasonal_fit(season, crop)

    components = {
        "weather_suitability": w_score,
        "soil_compatibility": s_score,
        "water_availability": wa_score,
        "market_demand": d_score,
        "price_trend": p_score,
        "seasonal_fit": se_score,
    }

    final = calculate_final_score(components)

    price_history = market_data.get("price_history_7d", [])
    risk = calculate_risk_score(w_score, price_history, crop.get("water_requirement", "medium"))

    price_per_quintal = market_data.get("price_per_quintal", crop.get("base_price_per_kg", 20) * 100)
    profit = calculate_profit_range(land_size, crop, price_per_quintal)

    if final >= 75:
        confidence = "high"
    elif final >= 50:
        confidence = "medium"
    else:
        confidence = "low"

    sowing_months = crop.get("sowing_months", {})
    harvesting_months = crop.get("harvesting_months", {})

    sowing_win = sowing_months.get(season.lower(), "Recommended Season")
    harvesting_win = harvesting_months.get(season.lower(), "Harvest Phase")

    return {
        "crop": crop.get("name", "Unknown"),
        "hindi_name": crop.get("hindi_name"),
        "score": final,
        "risk": risk,
        "profit_range": profit,
        "components": components,
        "confidence": confidence,
        "sowing_window": sowing_win,
        "harvesting_window": harvesting_win,
        "irrigation_advisory": crop.get("irrigation_notes"),
        "major_producing_states": crop.get("major_producing_states", []),
    }
