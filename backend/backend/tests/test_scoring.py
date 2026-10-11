"""
backend/tests/test_scoring.py
Unit tests for pure functional scoring logic in HeatShield Chennai.
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services import scoring


def test_compute_heat_index_norm():
    # 26°C should scale to 0.0
    assert scoring.compute_heat_index_norm(26.0) == 0.0
    # 48°C should scale to 1.0
    assert scoring.compute_heat_index_norm(48.0) == 1.0
    # Midpoint 37°C should scale to 0.5
    assert scoring.compute_heat_index_norm(37.0) == 0.5
    # Out-of-bound clamps
    assert scoring.compute_heat_index_norm(20.0) == 0.0
    # Out-of-bound upper
    assert scoring.compute_heat_index_norm(55.0) == 1.0


def test_sensor_anomaly_norm():
    # No sensor reading -> 0.0
    assert scoring.compute_sensor_anomaly_norm(None, 35.0) == 0.0
    # Equal temp -> 0.0
    assert scoring.compute_sensor_anomaly_norm(35.0, 35.0) == 0.0
    # Sensor 4°C hotter -> 0.5
    assert scoring.compute_sensor_anomaly_norm(39.0, 35.0) == 0.5
    # Sensor >=8°C hotter -> 1.0
    assert scoring.compute_sensor_anomaly_norm(43.0, 35.0) == 1.0


def test_time_of_day_factor():
    # Peak at 14:00 (2pm) -> 1.0
    assert scoring.compute_time_of_day_factor(14) == 1.0
    # 6 hours away at 08:00 or 20:00 -> 0.0
    assert scoring.compute_time_of_day_factor(8) == 0.0
    assert scoring.compute_time_of_day_factor(20) == 0.0


def test_profile_multipliers():
    assert scoring.get_profile_factor("office") == 0.8
    assert scoring.get_profile_factor("vendor") == 1.2
    assert scoring.get_profile_factor("laborer") == 1.3
    assert scoring.get_profile_factor("child") == 1.3
    assert scoring.get_profile_factor("elderly") == 1.4


test_risk_bands_data = [
    (0.0, "green"),
    (33.0, "green"),
    (33.1, "amber"),
    (66.0, "amber"),
    (66.1, "red"),
    (100.0, "red"),
]


@pytest.mark.parametrize("score,expected_band", test_risk_bands_data)
def test_risk_bands(score, expected_band):
    assert scoring.get_risk_band(score) == expected_band


def test_calculate_base_score_formula():
    # Test formula output for known inputs
    base = scoring.calculate_base_score(
        apparent_temp_c=37.0,  # hi_norm = 0.5 (40% weight -> 20.0)
        greenery=0.20,         # 1 - greenery = 0.80 (20% weight -> 16.0)
        built_density=0.80,    # built_density = 0.80 (20% weight -> 16.0)
        sensor_temp_c=39.0,    # anomaly = 4.0 -> norm = 0.5 (10% weight -> 5.0)
        forecast_temp_c=35.0,
        hour=14                # tod_factor = 1.0 (10% weight -> 10.0)
    )
    # Expected sum = 20.0 + 16.0 + 16.0 + 5.0 + 10.0 = 67.0
    assert base == 67.0


def test_unsafe_window_calculation():
    scores = [20.0] * 24
    # Set hours 12, 13, 14, 15 to high risk > 60
    for h in [12, 13, 14, 15]:
        scores[h] = 75.0

    window = scoring.calculate_unsafe_window(scores)
    assert window["start"] == "12:00"
    assert window["end"] == "16:00"
