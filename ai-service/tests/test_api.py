import pytest
from fastapi.testclient import TestClient
from main import app


def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["crops_loaded"] >= 15
        assert data["market_entries_loaded"] >= 45


def test_recommend_endpoint_dev_auth():
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
        assert "data_source" in data
        assert "processed_context" in data

        ctx = data["processed_context"]
        assert ctx["latitude"] == 12.97
        assert ctx["longitude"] == 77.59
        assert "temperature_c" in ctx
        assert "rainfall_mm" in ctx
        assert "humidity_pct" in ctx

        assert len(data["recommendations"]) <= 5
        assert len(data["recommendations"]) > 0

        top = data["recommendations"][0]
        assert "crop" in top
        assert "score" in top
        assert "risk" in top
        assert "profit_range" in top
        assert "components" in top
        assert "reasoning" in top
        assert "sowing_window" in top
        assert "harvesting_window" in top


def test_market_prices_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/market/prices?crop=Tomato&district=Kolar")
        assert response.status_code == 200
        data = response.json()
        assert data["crop"] == "Tomato"
        assert "price" in data
        assert "trend" in data
        assert "mandi" in data
        assert "suggested_selling_window" in data


def test_bulk_market_prices_endpoint():
    with TestClient(app) as client:
        payload = {
            "queries": [
                {"crop": "Tomato", "district": "Kolar"},
                {"crop": "Maize", "district": "Davangere"},
                {"crop": "Onion", "district": "Nashik"}
            ]
        }
        response = client.post("/api/market/bulk-prices", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["total_items"] == 3
        assert len(data["results"]) == 3
        assert data["results"][0]["crop"] == "Tomato"


def test_market_trends_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/market/trends?crop=Tomato")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "price_change_7d_pct" in data[0]


def test_market_demand_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/market/demand?crop=Tomato")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "demand_reason" in data[0]


def test_analytics_summary_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/analytics/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_recommendations" in data
        assert "most_recommended_crop" in data
        assert "real_data_metrics" in data
