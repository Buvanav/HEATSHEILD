"""
backend/app/routes/cells.py
Route GET /cells?hour=H&profile=P
Returns GeoJSON FeatureCollection of 100 grid cells with dynamic risk scores & bands.
"""

import json
import os
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Query, HTTPException
from app import config
from app.services import store, scoring

logger = logging.getLogger("heatshield.routes.cells")
router = APIRouter()

_GRID_GEOJSON_CACHE = None


def load_grid_geojson():
    global _GRID_GEOJSON_CACHE
    if _GRID_GEOJSON_CACHE is not None:
        return _GRID_GEOJSON_CACHE

    if os.path.exists(config.GRID_FILE):
        with open(config.GRID_FILE, "r", encoding="utf-8") as f:
            _GRID_GEOJSON_CACHE = json.load(f)
            return _GRID_GEOJSON_CACHE
    else:
        raise HTTPException(status_code=500, detail="grid.geojson data file missing. Run scripts/prep.py first.")


def get_current_hour() -> int:
    # IST is UTC + 5:30
    utc_now = datetime.now(timezone.utc)
    ist_hour = (utc_now.hour + 5) % 24
    return ist_hour


@router.get("/cells")
async def get_cells(
    hour: int = Query(default=None, ge=0, le=23, description="Target hour 0-23"),
    profile: str = Query(default="vendor", description="Profile: office, vendor, laborer, elderly, child")
):
    """
    Returns GeoJSON FeatureCollection of 100 cells with dynamically computed scores for specified hour and profile.
    """
    if hour is None:
        hour = get_current_hour()

    grid_data = load_grid_geojson()
    storage = store.get_store()

    # Retrieve base scores for target hour
    scores_map = storage.get_all_cell_scores(hour)

    features = []
    for feature in grid_data.get("features", []):
        props = feature.get("properties", {})
        cell_id = props.get("cell_id")

        # Get stored record or generate default base score
        score_record = scores_map.get(cell_id, {})
        base_score = float(score_record.get("base_score", 48.0))
        heat_index = float(score_record.get("heat_index", 36.5))
        greenery = float(props.get("greenery", 0.20))
        built_density = float(props.get("built_density", 0.70))

        # Apply profile multiplier at request time
        score = scoring.calculate_cell_score(base_score, profile)
        band = scoring.get_risk_band(score)

        new_feature = {
            "type": feature.get("type", "Feature"),
            "geometry": feature.get("geometry"),
            "properties": {
                "cell_id": cell_id,
                "row": props.get("row"),
                "col": props.get("col"),
                "score": score,
                "band": band,
                "heat_index": heat_index,
                "greenery": greenery,
                "built_density": built_density,
                "name": props.get("name", f"Cell {cell_id}")
            }
        }
        features.append(new_feature)

    return {
        "type": "FeatureCollection",
        "features": features
    }
