import pytest
from fastapi.testclient import TestClient
from main import app


DEMO_PROFILES = [
    {
        "name": "Ravi (Karnataka)",
        "payload": {
            "latitude": 12.97,
            "longitude": 77.59,
            "season": "kharif",
            "soil_type": "loamy",
            "irrigation_type": "drip",
            "land_size": 2.5
        },
        "expected_top_crops": ["Turmeric", "Tomato", "Maize", "Rice (Paddy)", "Cotton"]
    },
    {
        "name": "Priya (Punjab)",
        "payload": {
            "latitude": 30.73,
            "longitude": 76.78,
            "season": "rabi",
            "soil_type": "alluvial",
            "irrigation_type": "canal",
            "land_size": 5.0
        },
        "expected_top_crops": ["Maize", "Wheat", "Mustard", "Tomato", "Chilli"]
    },
    {
        "name": "Arjun (Maharashtra)",
        "payload": {
            "latitude": 19.07,
            "longitude": 72.87,
            "season": "kharif",
            "soil_type": "black",
            "irrigation_type": "rainfed",
            "land_size": 3.0
        },
        "expected_top_crops": ["Soybean", "Cotton", "Maize", "Tur (Arhar/Pigeon Pea)"]
    },
    {
        "name": "Lakshmi (Tamil Nadu)",
        "payload": {
            "latitude": 11.01,
            "longitude": 76.97,
            "season": "zaid",
            "soil_type": "red",
            "irrigation_type": "sprinkler",
            "land_size": 1.5
        },
        "expected_top_crops": ["Turmeric", "Tomato", "Maize", "Banana", "Onion"]
    },
    {
        "name": "Suresh (Madhya Pradesh)",
        "payload": {
            "latitude": 23.25,
            "longitude": 77.41,
            "season": "kharif",
            "soil_type": "clay",
            "irrigation_type": "flood",
            "land_size": 4.0
        },
        "expected_top_crops": ["Maize", "Soybean", "Cotton", "Sugarcane"]
    }
]


def test_all_five_demo_farmer_profiles(monkeypatch):
    monkeypatch.setenv("USE_FALLBACK_DATA", "true")
    with TestClient(app) as client:
        for profile in DEMO_PROFILES:
            name = profile["name"]
            payload = profile["payload"]
            expected = profile["expected_top_crops"]

            response = client.post("/api/recommend", json=payload)
            assert response.status_code == 200, f"Profile {name} failed with status {response.status_code}"

            data = response.json()
            recs = data["recommendations"]
            assert len(recs) > 0, f"Profile {name} returned no recommendations"

            top_crop_names = [r["crop"] for r in recs[:3]]
            match_found = any(c in expected for c in top_crop_names)
            assert match_found, f"Profile {name} top recommendations {top_crop_names} did not match expected {expected}"
