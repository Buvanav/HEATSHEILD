"""
backend/app/routes/sensors.py
Routes:
  GET /sensors -> Returns active IoT sensor readings list across Chennai grid
  POST /sensor -> Stores a new simulated/real IoT sensor reading
"""

from typing import List
from fastapi import APIRouter, HTTPException
from app.models import SensorReadingRequest, SensorReadingResponse, SensorReadingItem
from app.services import store
from app.routes.cells import load_grid_geojson

router = APIRouter()


@router.get("/sensors", response_model=List[SensorReadingItem])
async def get_all_sensors():
    """
    Returns list of active sensor readings across grid cells.
    """
    storage = store.get_store()
    readings = storage.get_latest_sensor_readings()
    grid_data = load_grid_geojson()

    # Create mapping of cell_id to centroid lat/lon
    cell_coords = {}
    for feature in grid_data.get("features", []):
        props = feature.get("properties", {})
        cid = props.get("cell_id")
        bounds = props.get("bounds", {})
        lat_mid = (bounds.get("min_lat", 13.02) + bounds.get("max_lat", 13.03)) / 2.0
        lon_mid = (bounds.get("min_lon", 80.22) + bounds.get("max_lon", 80.23)) / 2.0
        cell_coords[cid] = (lat_mid, lon_mid)

    items = []
    for r in readings:
        cid = r["cell_id"]
        lat, lon = cell_coords.get(cid, (13.03, 80.23))
        items.append(SensorReadingItem(
            cell_id=cid,
            lat=round(lat, 5),
            lon=round(lon, 5),
            temp=float(r.get("temp", 36.0)),
            humidity=float(r.get("humidity", 65.0)),
            updated_at=r.get("updated_at", "")
        ))

    return items


@router.post("/sensor", response_model=SensorReadingResponse)
async def submit_sensor_reading(reading: SensorReadingRequest):
    """
    Posts a single IoT sensor reading for a cell_id.
    """
    if not reading.cell_id or not reading.cell_id.startswith("r"):
        raise HTTPException(status_code=400, detail="Invalid cell_id format. Must be e.g. r4c6")

    storage = store.get_store()
    saved_item = storage.save_sensor_reading(
        cell_id=reading.cell_id,
        temp=reading.temp,
        humidity=reading.humidity
    )

    return SensorReadingResponse(
        status="success",
        cell_id=reading.cell_id,
        updated_at=saved_item.get("updated_at", "")
    )
