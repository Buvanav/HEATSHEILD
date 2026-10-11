"""
backend/app/routes/route.py
Route GET /route?from=lat,lon&to=lat,lon&profile&hour
Calculates fastest walking route vs coolest route with exposure metrics.
"""

from typing import Dict
from fastapi import APIRouter, Query, HTTPException
from app.models import RouteResponse, RouteDetail
from app.services import store, scoring, routing
from app.routes.cells import get_current_hour

router = APIRouter()


def parse_lat_lon(coord_str: str, param_name: str) -> tuple[float, float]:
    try:
        parts = coord_str.split(",")
        if len(parts) != 2:
            raise ValueError()
        lat = float(parts[0].strip())
        lon = float(parts[1].strip())
        return lat, lon
    except Exception:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format for '{param_name}'. Expected 'lat,lon' e.g. '13.0410,80.2330'"
        )


@router.get("/route", response_model=RouteResponse)
async def get_walking_route(
    from_coord: str = Query(..., alias="from", description="Origin lat,lon e.g. 13.0410,80.2330"),
    to_coord: str = Query(..., alias="to", description="Destination lat,lon e.g. 13.0210,80.2210"),
    profile: str = Query(default="vendor", description="Profile: office, vendor, laborer, elderly, child"),
    hour: int = Query(default=None, ge=0, le=23, description="Target hour 0-23")
):
    """
    Computes fastest route vs coolest route for pedestrians based on heat exposure scores.
    """
    if hour is None:
        hour = get_current_hour()

    from_lat, from_lon = parse_lat_lon(from_coord, "from")
    to_lat, to_lon = parse_lat_lon(to_coord, "to")

    storage = store.get_store()
    scores_map = storage.get_all_cell_scores(hour)

    # Compute cell scores for the specific profile across all cells
    profile_scores: Dict[str, float] = {
        cid: scoring.calculate_cell_score(float(item.get("base_score", 48.0)), profile)
        for cid, item in scores_map.items()
    }

    routes_data = routing.find_routes(from_lat, from_lon, to_lat, to_lon, profile_scores)

    return RouteResponse(
        fastest=RouteDetail(**routes_data["fastest"]),
        coolest=RouteDetail(**routes_data["coolest"]),
        exposure_reduction_pct=routes_data["exposure_reduction_pct"]
    )
