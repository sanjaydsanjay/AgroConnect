import time
import pytest
from fastapi.testclient import TestClient
from main import app


def test_recommendation_warm_latency(monkeypatch):
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

        # Warm up call (loads dataset & populates cache)
        client.post("/api/recommend", json=payload)

        # Benchmark warm execution latency over 5 iterations
        latencies_ms = []
        for _ in range(5):
            start = time.perf_counter()
            response = client.post("/api/recommend", json=payload)
            end = time.perf_counter()

            assert response.status_code == 200
            latency_ms = (end - start) * 1000.0
            latencies_ms.append(latency_ms)

        avg_latency_ms = sum(latencies_ms) / len(latencies_ms)
        min_latency_ms = min(latencies_ms)

        print(f"\n⚡ Warm recommendation latency: Avg={avg_latency_ms:.2f}ms, Min={min_latency_ms:.2f}ms")

        # Target requirement: warm latency < 1,000 ms (1.0 second)
        assert avg_latency_ms < 1000.0, f"Average warm latency {avg_latency_ms:.2f}ms exceeded target threshold of 1000ms"
