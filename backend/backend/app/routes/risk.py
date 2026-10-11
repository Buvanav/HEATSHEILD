"""
backend/app/routes/risk.py
Route GET /risk?lat&lon&profile&hour
Returns cell_id, score, band, unsafe_window, and Tamil/English safety advice for a specific coordinate.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Query, HTTPException
from app.models import RiskResponse, UnsafeWindow
from app.services import store, scoring, advice
from app.routes.cells import get_current_hour

router = APIRouter()

# Grid coordinate mapping parameters
LAT_MIN = 13.0000
LAT_STEP = 0.0045
LON_MIN = 80.2000
LON_STEP = 0.0046
ROWS = 10
COLS = 10


def get_cell_id_from_latlon(lat: float, lon: float) -> str:
    r = int((lat - LAT_MIN) / LAT_STEP)
    c = int((lon - LON_MIN) / LON_STEP)
    r = max(0, min(ROWS - 1, r))
    c = max(0, min(COLS - 1, c))
    return f"r{r}c{c}"


@router.get("/risk", response_model=RiskResponse)
async def get_location_risk(
    lat: float = Query(..., description="Latitude e.g. 13.0405"),
    lon: float = Query(..., description="Longitude e.g. 80.2335"),
    profile: str = Query(default="vendor", description="Profile: office, vendor, laborer, elderly, child"),
    hour: int = Query(default=None, ge=0, le=23, description="Target hour 0-23")
):
    """
    Evaluates heat risk at a specific lat/lon coordinate for a profile and hour.
    """
    if hour is None:
        hour = get_current_hour()

    cell_id = get_cell_id_from_latlon(lat, lon)
    storage = store.get_store()

    # Retrieve stored score record or default
    score_record = storage.get_cell_score(cell_id, hour)
    if score_record:
        base_score = float(score_record.get("base_score", 48.0))
    else:
        base_score = 48.0

    score = scoring.calculate_cell_score(base_score, profile)
    band = scoring.get_risk_band(score)

    # 24-hour profile-adjusted scores for unsafe window
    scores_24h_base = storage.get_cell_scores_24h(cell_id)
    profile_factor = scoring.get_profile_factor(profile)
    scores_24h_profile = [scoring.clamp(b * profile_factor, 0.0, 100.0) for b in scores_24h_base]

    unsafe_window_dict = scoring.calculate_unsafe_window(scores_24h_profile)

    # Dual language safety advice
    advice_en, advice_ta = await advice.get_dual_language_advice(score, band, profile)

    return RiskResponse(
        cell_id=cell_id,
        score=score,
        band=band,
        unsafe_window=UnsafeWindow(**unsafe_window_dict),
        advice_en=advice_en,
        advice_ta=advice_ta
    )
