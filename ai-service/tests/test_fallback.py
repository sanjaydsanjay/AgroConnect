import pytest
from fastapi.testclient import TestClient
from main import app
from recommendation.weather import get_regional_baseline_weather, fetch_weather
from recommendation.market import get_market_intel


def test_weather_fallback_regions():
    # North India
    north = get_regional_baseline_weather(28.61, 77.20)
    assert north["source"] == "baseline_fallback"
    assert north["temp_c"] == 28.5

    # South India
    south = get_regional_baseline_weather(12.97, 77.59)
    assert south["source"] == "baseline_fallback"
    assert south["temp_c"] == 27.8

    # West India
    west = get_regional_baseline_weather(19.07, 72.87)
    assert west["source"] == "baseline_fallback"

    # East India
    east = get_regional_baseline_weather(22.57, 88.36)
    assert east["source"] == "baseline_fallback"


@pytest.mark.anyio
async def test_fetch_weather_use_fallback_env(monkeypatch):
    monkeypatch.setenv("USE_FALLBACK_DATA", "true")
    weather = await fetch_weather(12.97, 77.59)
    assert weather["source"] == "baseline_fallback"
    assert weather["temp_c"] == 27.8


def test_market_intel_fallback_when_crop_missing():
    market_data = [
        {"crop_name": "Tomato", "district": "Kolar", "state": "Karnataka", "price_per_quintal": 1800, "trend": "up", "demand": "high"}
    ]
    result = get_market_intel("NonExistentCrop", "UnknownDistrict", market_data)
    assert result["crop_name"] == "NonExistentCrop"
    assert result["data_source"] == "agmarknet_baseline"
    assert result["price_per_quintal"] > 0


def test_recommend_endpoint_with_fallback_env(monkeypatch):
    monkeypatch.setenv("USE_FALLBACK_DATA", "true")
    with TestClient(app) as client:
        payload = {
            "latitude": 12.97,
            "longitude": 77.59,
            "season": "kharif",
            "soil_type": "loamy",
            "irrigation_type": "drip",
            "land_size": 2.5
        }
        response = client.post("/api/recommend", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "generated_at" in data
        assert len(data["recommendations"]) > 0
