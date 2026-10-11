"""
backend/app/main.py
FastAPI Web Application & AWS Lambda Handler (Mangum adapter) for HeatShield Chennai.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app import config
from app.models import HealthResponse
from app.routes import cells, risk, route, municipal, sensors, advice
from app.services import store, weather, scoring

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("heatshield.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup event. Initializes store with initial scores if in mock mode.
    """
    logger.info("Initializing HeatShield Chennai Backend Application...")
    if config.USE_MOCK_STORE:
        try:
            # Pre-seed initial 24-hour scores in mock store
            storage = store.get_store()
            grid = cells.load_grid_geojson()
            forecast = await weather.fetch_weather_forecast()

            scores_to_seed = []
            for feature in grid.get("features", []):
                props = feature.get("properties", {})
                cid = props.get("cell_id")
                greenery = float(props.get("greenery", 0.2))
                built = float(props.get("built_density", 0.7))

                for w in forecast:
                    h = w["hour"]
                    app_temp = w["apparent_temp"]
                    fc_temp = w["temp"]

                    base_score = scoring.calculate_base_score(
                        apparent_temp_c=app_temp,
                        greenery=greenery,
                        built_density=built,
                        sensor_temp_c=None,
                        forecast_temp_c=fc_temp,
                        hour=h
                    )

                    scores_to_seed.append({
                        "cell_id": cid,
                        "hour": h,
                        "base_score": base_score,
                        "heat_index": app_temp,
                        "greenery": greenery,
                        "built_density": built
                    })

            storage.save_cell_scores(scores_to_seed)
            logger.info(f"Pre-seeded {len(scores_to_seed)} cell score records into mock store.")

        except Exception as e:
            logger.warning(f"Startup pre-seed note: {e}")
    else:
        logger.info("Using real AWS DynamoDB store (startup ready).")
        try:
            # Pre-warm road graph and DynamoDB cell score cache in background
            from app.services import routing
            routing.load_graph()
            storage = store.get_store()
            storage.get_all_cell_scores(cells.get_current_hour())
            logger.info("DynamoDB scores cache and road graph pre-warmed successfully.")
        except Exception as e:
            logger.warning(f"Startup pre-warm note: {e}")

    yield
    logger.info("Shutting down HeatShield Chennai Application.")


app = FastAPI(
    title="HeatShield Chennai API",
    description="Hyperlocal heat-risk score, cooling route recommender, and safety advice API for Chennai",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular route routers (support both root and /api prefixes)
for prefix in ("", "/api"):
    app.include_router(cells.router, prefix=prefix)
    app.include_router(risk.router, prefix=prefix)
    app.include_router(route.router, prefix=prefix)
    app.include_router(municipal.router, prefix=prefix)
    app.include_router(sensors.router, prefix=prefix)
    app.include_router(advice.router, prefix=prefix)


@app.post("/alerts/trigger")
@app.get("/alerts/trigger")
@app.post("/api/alerts/trigger")
@app.get("/api/alerts/trigger")
async def trigger_manual_alert():
    """
    Manually triggers a test/emergency SNS heat alert with current IST time and temperature.
    """
    from app.services import alerts
    test_cells = [
        {"cell_id": "r5c5", "name": "T. Nagar Ranganathan St Hub", "score": 85.0},
        {"cell_id": "r12c14", "name": "Chennai Central Railway Zone", "score": 82.5},
        {"cell_id": "r7c2", "name": "Vadapalani Commercial Junction", "score": 80.5}
    ]
    sent = alerts.publish_heat_alert(test_cells, current_temp=41.2, heat_index=45.6)
    return {
        "status": "success" if sent else "failed",
        "alert_sent": sent,
        "time": alerts.get_current_ist_time(),
        "temp_c": 41.2,
        "heat_index_c": 45.6,
        "recipient": "buvi541@gmail.com"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Public Health check endpoint.
    """
    return HealthResponse(status="ok")


@app.get("/")
async def root():
    return {
        "message": "HeatShield Chennai API is active",
        "docs": "/docs",
        "health": "/health"
    }


# AWS Lambda Mangum Handler Adapter
handler = Mangum(app)
