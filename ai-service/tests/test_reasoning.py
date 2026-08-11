import pytest
from recommendation.reasoning import build_reasoning


def test_build_reasoning_high_scores():
    components = {
        "weather_suitability": 90,
        "soil_compatibility": 85,
        "water_availability": 80,
        "market_demand": 95,
        "price_trend": 88,
        "seasonal_fit": 100
    }
    crop_info = {
        "name": "Tomato",
        "hindi_name": "टमाटर",
        "msp_per_quintal": None,
        "sowing_months": "June - July",
        "harvesting_months": "October - November",
        "water_requirement": "medium"
    }
    weather = {"temp_c": 26.5, "rainfall_mm": 800.0}

    reasons = build_reasoning(components, "Tomato", "kharif", weather, crop_info)
    assert len(reasons) >= 3
    assert any("26.5°C" in r for r in reasons)
    assert any("loamy" in r.lower() or "soil" in r.lower() for r in reasons)


def test_build_reasoning_low_scores():
    components = {
        "weather_suitability": 40,
        "soil_compatibility": 35,
        "water_availability": 30,
        "market_demand": 45,
        "price_trend": 40,
        "seasonal_fit": 0
    }
    crop_info = {
        "name": "Wheat",
        "hindi_name": "गेहूं",
        "msp_per_quintal": 2585,
        "sowing_months": "November - December",
        "harvesting_months": "April - May",
        "water_requirement": "medium"
    }
    weather = {"temp_c": 38.0, "rainfall_mm": 200.0}

    reasons = build_reasoning(components, "Wheat", "kharif", weather, crop_info)
    assert len(reasons) >= 3
    assert any("challenging" in r.lower() or "irrigation" in r.lower() or "not ideal" in r.lower() for r in reasons)
