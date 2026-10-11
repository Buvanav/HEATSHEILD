"""
backend/tests/test_api.py
Integration tests for FastAPI endpoints using TestClient.
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cells_endpoint():
    response = client.get("/cells?hour=14&profile=vendor")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 100

    sample_props = data["features"][0]["properties"]
    assert "cell_id" in sample_props
    assert "score" in sample_props
    assert "band" in sample_props
    assert sample_props["band"] in ("green", "amber", "red")


def test_risk_endpoint():
    response = client.get("/risk?lat=13.0405&lon=80.2335&profile=laborer&hour=14")
    assert response.status_code == 200
    data = response.json()
    assert "cell_id" in data
    assert "score" in data
    assert "band" in data
    assert "unsafe_window" in data
    assert "advice_en" in data
    assert "advice_ta" in data


def test_route_endpoint():
    response = client.get("/route?from=13.0410,80.2330&to=13.0210,80.2210&profile=vendor&hour=14")
    assert response.status_code == 200
    data = response.json()
    assert "fastest" in data
    assert "coolest" in data
    assert "exposure_reduction_pct" in data


def test_municipal_endpoint():
    response = client.get("/municipal/top?n=5")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 5
    assert "cell_id" in data[0]
    assert "population_note" in data[0]
    assert "suggestion" in data[0]


def test_sensors_and_sensor_post():
    # Post reading
    post_resp = client.post("/sensor", json={"cell_id": "r4c6", "temp": 42.5, "humidity": 70.0})
    assert post_resp.status_code == 200
    assert post_resp.json()["status"] == "success"

    # Get sensors list
    get_resp = client.get("/sensors")
    assert get_resp.status_code == 200
    items = get_resp.json()
    assert any(i["cell_id"] == "r4c6" for i in items)


def test_advice_endpoint():
    response = client.post("/advice", json={"cell_id": "r4c6", "profile": "elderly", "lang": "ta"})
    assert response.status_code == 200
    data = response.json()
    assert data["cell_id"] == "r4c6"
    assert data["profile"] == "elderly"
    assert data["lang"] == "ta"
    assert len(data["advice"]) > 0
