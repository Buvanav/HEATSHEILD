"""
backend/tests/test_routing.py
Unit tests for NetworkX cool route calculation & exposure metrics.
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services import routing


def test_find_routes():
    # Make sure prep data exists
    routing.load_graph()

    # Define origin (T. Nagar area) and destination (Guindy/Saidapet area)
    from_lat, from_lon = 13.0410, 80.2330
    to_lat, to_lon = 13.0110, 80.2160

    # High cell scores in commercial sector r4c6
    mock_cell_scores = {"r4c6": 90.0, "r5c4": 85.0, "r1c2": 25.0, "r0c1": 20.0}

    res = routing.find_routes(from_lat, from_lon, to_lat, to_lon, mock_cell_scores)

    assert "fastest" in res
    assert "coolest" in res
    assert "exposure_reduction_pct" in res

    fastest = res["fastest"]
    coolest = res["coolest"]

    assert fastest["minutes"] > 0
    assert coolest["minutes"] > 0
    assert "geometry" in fastest
    assert "geometry" in coolest
    assert fastest["geometry"]["type"] == "LineString"
    assert coolest["geometry"]["type"] == "LineString"
    assert len(fastest["geometry"]["coordinates"]) >= 2
    assert len(coolest["geometry"]["coordinates"]) >= 2

    # Coolest route should achieve a lower exposure score or equal
    assert coolest["exposure"] <= fastest["exposure"]
    assert res["exposure_reduction_pct"] >= 0.0
