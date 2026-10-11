"""
backend/app/services/scoring.py
Pure functional scoring logic for HeatShield Chennai.
Contains transparent heat-risk score formulas, band classifications, and unsafe window calculations.
"""

from typing import Dict, List, Tuple

PROFILE_FACTORS = {
    "office": 0.8,
    "vendor": 1.2,
    "laborer": 1.3,
    "child": 1.3,
    "elderly": 1.4,
}


def clamp(val: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(max_val, val))


def compute_heat_index_norm(apparent_temp_c: float) -> float:
    """
    Open-Meteo hourly apparent_temperature, scaled 26°C - 48°C to 0.0 - 1.0.
    """
    return clamp((apparent_temp_c - 26.0) / (48.0 - 26.0), 0.0, 1.0)


def compute_sensor_anomaly_norm(sensor_temp_c: float | None, forecast_temp_c: float) -> float:
    """
    Latest sensor temp minus forecast temp, scaled 0°C - 8°C to 0.0 - 1.0.
    Returns 0.0 if sensor_temp_c is None.
    """
    if sensor_temp_c is None:
        return 0.0
    diff = max(0.0, sensor_temp_c - forecast_temp_c)
    return clamp(diff / 8.0, 0.0, 1.0)


def compute_time_of_day_factor(hour: int) -> float:
    """
    max(0, 1 - abs(hour - 14) / 6), peaks at 14:00 (mid-afternoon).
    """
    return max(0.0, 1.0 - abs(hour - 14) / 6.0)


def get_profile_factor(profile: str) -> float:
    """
    Returns profile multiplier. Defaults to 1.2 (vendor) if profile unknown.
    """
    return PROFILE_FACTORS.get(profile.lower(), 1.2)


def calculate_base_score(
    apparent_temp_c: float,
    greenery: float,
    built_density: float,
    sensor_temp_c: float | None,
    forecast_temp_c: float,
    hour: int
) -> float:
    """
    Computes base heat risk score (0-100) before profile factor application.
    Formula:
      base = 100 * ( 0.40 * heat_index_norm
                   + 0.20 * (1 - greenery)
                   + 0.20 * built_density
                   + 0.10 * sensor_anomaly_norm
                   + 0.10 * time_of_day_factor )
    """
    hi_norm = compute_heat_index_norm(apparent_temp_c)
    sensor_norm = compute_sensor_anomaly_norm(sensor_temp_c, forecast_temp_c)
    tod_factor = compute_time_of_day_factor(hour)

    raw_base = 100.0 * (
        0.40 * hi_norm
        + 0.20 * (1.0 - greenery)
        + 0.20 * built_density
        + 0.10 * sensor_norm
        + 0.10 * tod_factor
    )
    return round(clamp(raw_base, 0.0, 100.0), 1)


def calculate_cell_score(base_score: float, profile: str) -> float:
    """
    score = clamp(base * profile_factor, 0, 100)
    """
    factor = get_profile_factor(profile)
    return round(clamp(base_score * factor, 0.0, 100.0), 1)


def get_risk_band(score: float) -> str:
    """
    Bands:
      0-33   -> green
      34-66  -> amber
      67-100 -> red
    """
    if score <= 33.0:
        return "green"
    elif score <= 66.0:
        return "amber"
    else:
        return "red"


def calculate_unsafe_window(scores_by_hour: List[float]) -> Dict[str, str]:
    """
    Calculates unsafe hours window (format {"start": "12:00", "end": "16:00"}).
    Finds contiguous hours where score > 60.0 or peak risk hours.
    """
    if not scores_by_hour or len(scores_by_hour) < 24:
        # Default mid-afternoon window if incomplete data
        return {"start": "12:00", "end": "16:00"}

    # Find hours with high risk (> 60)
    unsafe_hours = [h for h, s in enumerate(scores_by_hour) if s >= 60.0]

    if unsafe_hours:
        start_h = min(unsafe_hours)
        end_h = max(unsafe_hours) + 1
    else:
        # Fallback to peak score hour +/- 2 hours
        peak_h = max(range(len(scores_by_hour)), key=lambda h: scores_by_hour[h])
        start_h = max(0, peak_h - 2)
        end_h = min(24, peak_h + 2)

    return {
        "start": f"{start_h:02d}:00",
        "end": f"{end_h:02d}:00"
    }
