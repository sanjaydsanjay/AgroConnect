import pytest
from recommendation.scoring import (
    score_weather_suitability,
    score_soil_compatibility,
    score_water_availability,
    score_market_demand,
    score_price_trend,
    score_seasonal_fit,
    calculate_final_score,
    calculate_risk_score,
    calculate_profit_range,
    score_crop,
)


@pytest.fixture
def sample_crop():
    return {
        "name": "Tomato",
        "season": ["kharif", "rabi"],
        "temp_range_c": [18, 30],
        "rainfall_range_mm": [500, 1200],
        "humidity_range_pct": [50, 80],
        "soil_types": {"loamy": 100, "clay": 45, "sandy": 40},
        "water_requirement": "medium",
        "yield_per_acre_kg": 12000,
        "base_price_per_kg": 18,
        "cost_pct": 35,
    }


def test_score_weather_suitability_optimal(sample_crop):
    score = score_weather_suitability(temp=24, rainfall=850, humidity=65, crop=sample_crop)
    assert score == 100


def test_score_weather_suitability_outside(sample_crop):
    score = score_weather_suitability(temp=45, rainfall=100, humidity=10, crop=sample_crop)
    assert score == 0


def test_score_soil_compatibility(sample_crop):
    assert score_soil_compatibility("loamy", sample_crop) == 100
    assert score_soil_compatibility("clay", sample_crop) == 45
    assert score_soil_compatibility("unknown_soil", sample_crop) == 30


def test_score_water_availability(sample_crop):
    assert score_water_availability("drip", sample_crop) == 85
    assert score_water_availability("rainfed", sample_crop) == 50


def test_score_market_demand():
    assert score_market_demand("high") == 100
    assert score_market_demand("medium") == 65
    assert score_market_demand("low") == 30


def test_score_price_trend():
    assert score_price_trend("up") == 100
    assert score_price_trend("flat") == 70
    assert score_price_trend("down") == 40


def test_score_seasonal_fit(sample_crop):
    assert score_seasonal_fit("kharif", sample_crop) == 100
    assert score_seasonal_fit("rabi", sample_crop) == 100
    assert score_seasonal_fit("zaid", sample_crop) == 50


def test_calculate_final_score():
    components = {
        "weather_suitability": 100,
        "soil_compatibility": 100,
        "water_availability": 100,
        "market_demand": 100,
        "price_trend": 100,
        "seasonal_fit": 100,
    }
    assert calculate_final_score(components) == 100


def test_calculate_risk_score():
    risk = calculate_risk_score(
        weather_score=80,
        price_history=[1800, 1850, 1900, 1950, 2000],
        water_requirement="low",
    )
    assert 0 <= risk <= 100


def test_calculate_profit_range(sample_crop):
    profit = calculate_profit_range(land_size=2.0, crop=sample_crop, price_per_quintal=1800.0)
    assert "min" in profit
    assert "max" in profit
    assert profit["currency"] == "INR"
    assert profit["min"] < profit["max"]


def test_score_crop_deterministic(sample_crop):
    weather = {"temp_c": 24.0, "rainfall_mm": 850.0, "humidity_pct": 65.0}
    market_data = {"demand": "high", "trend": "up", "price_per_quintal": 1800.0, "price_history_7d": [1700, 1800]}

    res1 = score_crop(sample_crop, weather, "loamy", "drip", "kharif", 2.5, market_data)
    res2 = score_crop(sample_crop, weather, "loamy", "drip", "kharif", 2.5, market_data)

    assert res1 == res2
    assert res1["confidence"] in ["high", "medium", "low"]
