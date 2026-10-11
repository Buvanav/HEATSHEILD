"""
backend/app/config.py
Configuration settings loaded from environment variables or .env file.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file if present
if os.getenv("LAMBDA_TASK_ROOT"):
    BASE_DIR = Path(os.environ["LAMBDA_TASK_ROOT"])
else:
    BASE_DIR = Path(__file__).resolve().parent.parent.parent

env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-2")
USE_MOCK_STORE = os.getenv("USE_MOCK_STORE", "true").lower() in ("true", "1", "t", "yes")
SENSOR_TABLE = os.getenv("SENSOR_TABLE", "sensor_readings")
SCORES_TABLE = os.getenv("SCORES_TABLE", "cell_scores")
DATA_BUCKET = os.getenv("DATA_BUCKET", "heatshield-data-bucket-chennai")
SNS_TOPIC_ARN = os.getenv("SNS_TOPIC_ARN", "")
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")
ALERT_THRESHOLD = float(os.getenv("ALERT_THRESHOLD", "80.0"))

DATA_DIR = BASE_DIR / "data"
GRID_FILE = DATA_DIR / "grid.geojson"
POI_FILE = DATA_DIR / "poi.json"
GRAPH_FILE = DATA_DIR / "road_graph.pkl"
