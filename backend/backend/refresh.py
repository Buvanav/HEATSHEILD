"""
backend/refresh.py
EventBridge hourly refresh Lambda handler for HeatShield Chennai.
Fetches Open-Meteo weather, updates base scores for all 100 cells, saves to store,
and publishes SNS alerts if any cell score passes ALERT_THRESHOLD.
"""

import sys
import os
import asyncio
import logging
from typing import Dict, Any

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services import weather, store, scoring, alerts
from app.routes import cells


logger = logging.getLogger("heatshield.refresh")


async def run_refresh() -> Dict[str, Any]:
    logger.info("Starting hourly heat risk score refresh...")

    # 1. Fetch 24-hour weather forecast
    forecast = await weather.fetch_weather_forecast()

    # 2. Load cell grid and latest sensor readings
    grid_data = cells.load_grid_geojson()
    storage = store.get_store()
    sensor_readings = storage.get_latest_sensor_readings()

    # Map latest sensor temp per cell
    sensor_temp_map: Dict[str, float] = {
        r["cell_id"]: float(r["temp"]) for r in sensor_readings if "cell_id" in r and "temp" in r
    }

    scores_to_save = []
    high_risk_cells = []

    # 3. Re-calculate base scores for all 100 cells across 24 hours
    for feature in grid_data.get("features", []):
        props = feature.get("properties", {})
        cid = props.get("cell_id")
        name = props.get("name", f"Cell {cid}")
        greenery = float(props.get("greenery", 0.2))
        built = float(props.get("built_density", 0.7))
        sensor_temp = sensor_temp_map.get(cid)

        for w in forecast:
            h = w["hour"]
            app_temp = w["apparent_temp"]
            fc_temp = w["temp"]

            base_score = scoring.calculate_base_score(
                apparent_temp_c=app_temp,
                greenery=greenery,
                built_density=built,
                sensor_temp_c=sensor_temp,
                forecast_temp_c=fc_temp,
                hour=h
            )

            scores_to_save.append({
                "cell_id": cid,
                "hour": h,
                "base_score": base_score,
                "heat_index": app_temp,
                "greenery": greenery,
                "built_density": built
            })

            # Check if cell exceeds alert threshold for current/mid-afternoon hours
            if base_score >= 80.0 and h in (13, 14, 15):
                high_risk_cells.append({
                    "cell_id": cid,
                    "name": name,
                    "score": base_score,
                    "hour": h
                })

    # 4. Save to store
    storage.save_cell_scores(scores_to_save)
    logger.info(f"Successfully refreshed {len(scores_to_save)} cell score records.")

    # 5. Trigger SNS heat alert if threshold breached
    alert_sent = False
    if high_risk_cells:
        alert_sent = alerts.publish_heat_alert(high_risk_cells)

    return {
        "status": "success",
        "records_updated": len(scores_to_save),
        "high_risk_count": len(high_risk_cells),
        "alert_sent": alert_sent
    }


def handler(event, context):
    """
    AWS Lambda entrypoint for EventBridge schedule.
    """
    return asyncio.run(run_refresh())


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    res = asyncio.run(run_refresh())
    print("Refresh output:", res)
