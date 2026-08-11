import pytest
from fastapi.testclient import TestClient
from main import app
from recommendation.nlp_voice import parse_voice_query


TEST_CROPS = [
    {"name": "Tomato", "hindi_name": "टमाटर", "msp_per_quintal": None, "base_price_per_kg": 15},
    {"name": "Wheat", "hindi_name": "गेहूं", "msp_per_quintal": 2585, "base_price_per_kg": 25},
    {"name": "Sugarcane", "hindi_name": "गन्ना", "msp_per_quintal": 365, "base_price_per_kg": 3.6},
    {"name": "Maize (Corn)", "hindi_name": "मक्का", "msp_per_quintal": 2410, "base_price_per_kg": 24},
    {"name": "Onion", "hindi_name": "प्याज", "msp_per_quintal": None, "base_price_per_kg": 18},
]

TEST_MARKETS = [
    {"crop_name": "Tomato", "price_per_quintal": 1800, "trend": "up"},
    {"crop_name": "Wheat", "price_per_quintal": 2600, "trend": "flat"},
    {"crop_name": "Sugarcane", "price_per_quintal": 365, "trend": "up"},
    {"crop_name": "Maize (Corn)", "price_per_quintal": 2450, "trend": "up"},
    {"crop_name": "Onion", "price_per_quintal": 1900, "trend": "down"},
]


def test_hindi_voice_query_tomato_price():
    res = parse_voice_query("मुझे टमाटर की कीमत बताओ", TEST_CROPS, TEST_MARKETS)
    assert res["detected_language"] == "hi"
    assert res["intent"] == "price_query"
    assert res["matched_crop"] is not None
    assert res["matched_crop"]["crop"] == "Tomato"
    assert res["matched_crop"]["hindi_name"] == "टमाटर"
    assert "₹1,800" in res["response_summary"]


def test_kannada_voice_query_sugarcane():
    res = parse_voice_query("ಕಬ್ಬಿನ ಬೆಳೆ ಧಾರಣೆ ಎಷ್ಟು", TEST_CROPS, TEST_MARKETS)
    assert res["detected_language"] == "kn"
    assert res["intent"] == "price_query"
    assert res["matched_crop"] is not None
    assert res["matched_crop"]["crop"] == "Sugarcane"


def test_hinglish_voice_query_maize():
    res = parse_voice_query("makka ka rate kitna hai bhai", TEST_CROPS, TEST_MARKETS)
    assert res["intent"] == "price_query"
    assert res["matched_crop"] is not None
    assert res["matched_crop"]["crop"] == "Maize (Corn)"


def test_recommendation_intent_voice():
    res = parse_voice_query("gehun ki kheti ki salah chahiye best crop", TEST_CROPS, TEST_MARKETS)
    assert res["intent"] == "recommendation_query"
    assert res["matched_crop"] is not None
    assert res["matched_crop"]["crop"] == "Wheat"


def test_voice_search_endpoint_integration():
    with TestClient(app) as client:
        payload = {
            "spoken_text": "प्याज का मंडी रेट कितना है",
            "language": "auto"
        }
        response = client.post("/api/voice/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["original_query"] == "प्याज का मंडी रेट कितना है"
        assert data["detected_language"] == "hi"
        assert data["intent"] == "price_query"
        assert data["matched_crop"] is not None
        assert data["matched_crop"]["crop"] == "Onion"
