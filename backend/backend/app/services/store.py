"""
backend/app/services/store.py
Dual-mode data persistence store for HeatShield Chennai.
Supports:
  - In-memory mock store (for local dev & testing without AWS)
  - Real AWS DynamoDB tables (boto3) when USE_MOCK_STORE=false
"""

import os
import json
import time
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from app import config

logger = logging.getLogger("heatshield.store")

# In-Memory Storage for Mock Mode
_MOCK_SENSOR_READINGS: Dict[str, Dict[str, Any]] = {}
_MOCK_CELL_SCORES: Dict[str, Dict[int, Dict[str, Any]]] = {}  # cell_id -> hour -> score_dict
_DYNAMO_SCORES_CACHE: Dict[int, Any] = {}


def get_iso_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


class MockStore:
    """Fast, zero-dependency mock store for local execution & testing."""

    @staticmethod
    def save_sensor_reading(cell_id: str, temp: float, humidity: float) -> Dict[str, Any]:
        ts = get_iso_timestamp()
        item = {
            "cell_id": cell_id,
            "temp": temp,
            "humidity": humidity,
            "ts": ts,
            "updated_at": ts,
            "ttl": int(time.time()) + 86400  # 24 hour TTL
        }
        _MOCK_SENSOR_READINGS[cell_id] = item
        logger.info(f"[MockStore] Saved sensor reading for {cell_id}: {temp}°C, {humidity}%")
        return item

    @staticmethod
    def get_latest_sensor_readings() -> List[Dict[str, Any]]:
        return list(_MOCK_SENSOR_READINGS.values())

    @staticmethod
    def get_sensor_reading(cell_id: str) -> Optional[Dict[str, Any]]:
        return _MOCK_SENSOR_READINGS.get(cell_id)

    @staticmethod
    def save_cell_scores(scores: List[Dict[str, Any]]) -> None:
        ts = get_iso_timestamp()
        for item in scores:
            cid = item["cell_id"]
            hour = int(item["hour"])
            if cid not in _MOCK_CELL_SCORES:
                _MOCK_CELL_SCORES[cid] = {}
            record = dict(item)
            record["updated_at"] = ts
            _MOCK_CELL_SCORES[cid][hour] = record
        logger.info(f"[MockStore] Batch saved {len(scores)} cell score records.")

    @staticmethod
    def get_cell_score(cell_id: str, hour: int) -> Optional[Dict[str, Any]]:
        cell_dict = _MOCK_CELL_SCORES.get(cell_id, {})
        return cell_dict.get(hour)

    @staticmethod
    def get_all_cell_scores(hour: int) -> Dict[str, Dict[str, Any]]:
        result = {}
        for cid, hours_map in _MOCK_CELL_SCORES.items():
            if hour in hours_map:
                result[cid] = hours_map[hour]
        return result

    @staticmethod
    def get_cell_scores_24h(cell_id: str) -> List[float]:
        cell_map = _MOCK_CELL_SCORES.get(cell_id, {})
        return [cell_map.get(h, {}).get("base_score", 45.0) for h in range(24)]


class DynamoStore:
    """Production AWS DynamoDB Store implementation using boto3."""

    def __init__(self):
        import boto3
        self.dynamodb = boto3.resource("dynamodb", region_name=config.AWS_REGION)
        self.sensor_table = self.dynamodb.Table(config.SENSOR_TABLE)
        self.scores_table = self.dynamodb.Table(config.SCORES_TABLE)

    def save_sensor_reading(self, cell_id: str, temp: float, humidity: float) -> Dict[str, Any]:
        ts = get_iso_timestamp()
        item = {
            "cell_id": cell_id,
            "ts": ts,
            "temp": str(temp),
            "humidity": str(humidity),
            "updated_at": ts,
            "ttl": int(time.time()) + 86400
        }
        self.sensor_table.put_item(Item=item)
        return item

    def get_latest_sensor_readings(self) -> List[Dict[str, Any]]:
        # Scan or query latest sensor readings
        resp = self.sensor_table.scan()
        items = resp.get("Items", [])
        # Group by cell_id to get latest
        latest: Dict[str, Dict[str, Any]] = {}
        for it in items:
            cid = it["cell_id"]
            if cid not in latest or it.get("ts", "") > latest[cid].get("ts", ""):
                latest[cid] = {
                    "cell_id": cid,
                    "temp": float(it.get("temp", 35.0)),
                    "humidity": float(it.get("humidity", 60.0)),
                    "updated_at": it.get("updated_at", get_iso_timestamp())
                }
        return list(latest.values())

    def get_sensor_reading(self, cell_id: str) -> Optional[Dict[str, Any]]:
        readings = self.get_latest_sensor_readings()
        for r in readings:
            if r["cell_id"] == cell_id:
                return r
        return None

    def save_cell_scores(self, scores: List[Dict[str, Any]]) -> None:
        ts = get_iso_timestamp()
        with self.scores_table.batch_writer() as batch:
            for item in scores:
                batch.put_item(Item={
                    "cell_id": item["cell_id"],
                    "hour": int(item["hour"]),
                    "base_score": str(item["base_score"]),
                    "heat_index": str(item["heat_index"]),
                    "greenery": str(item["greenery"]),
                    "built_density": str(item["built_density"]),
                    "updated_at": ts
                })

    def get_cell_score(self, cell_id: str, hour: int) -> Optional[Dict[str, Any]]:
        resp = self.scores_table.get_item(Key={"cell_id": cell_id, "hour": hour})
        item = resp.get("Item")
        if item:
            return {
                "cell_id": item["cell_id"],
                "hour": int(item["hour"]),
                "base_score": float(item["base_score"]),
                "heat_index": float(item["heat_index"]),
                "greenery": float(item["greenery"]),
                "built_density": float(item["built_density"]),
                "updated_at": item.get("updated_at", "")
            }
        return None

    def get_all_cell_scores(self, hour: int) -> Dict[str, Dict[str, Any]]:
        global _DYNAMO_SCORES_CACHE
        now = time.time()
        if hour in _DYNAMO_SCORES_CACHE:
            cached_time, cached_data = _DYNAMO_SCORES_CACHE[hour]
            if now - cached_time < 300.0 and len(cached_data) > 0:
                return cached_data

        # Scan DynamoDB if not in memory cache
        # Note: A single scan returns items across multiple hours.
        # Cache ALL hours discovered in the scan so subsequent queries are instantaneous.
        resp = self.scores_table.scan()
        by_hour: Dict[int, Dict[str, Dict[str, Any]]] = {h: {} for h in range(24)}

        for item in resp.get("Items", []):
            h = int(item.get("hour", -1))
            if 0 <= h < 24:
                cid = item["cell_id"]
                by_hour[h][cid] = {
                    "cell_id": cid,
                    "hour": h,
                    "base_score": float(item.get("base_score", 48.0)),
                    "heat_index": float(item.get("heat_index", 36.5)),
                    "greenery": float(item.get("greenery", 0.20)),
                    "built_density": float(item.get("built_density", 0.70)),
                    "updated_at": item.get("updated_at", "")
                }

        for h, items_map in by_hour.items():
            if items_map:
                _DYNAMO_SCORES_CACHE[h] = (now, items_map)

        return _DYNAMO_SCORES_CACHE.get(hour, (now, {}))[1]

    def get_cell_scores_24h(self, cell_id: str) -> List[float]:
        resp = self.scores_table.query(
            KeyConditionExpression="cell_id = :cid",
            ExpressionAttributeValues={":cid": cell_id}
        )
        items = resp.get("Items", [])
        scores_by_h = {int(it["hour"]): float(it["base_score"]) for it in items}
        return [scores_by_h.get(h, 45.0) for h in range(24)]


# Store factory selector
def get_store():
    if config.USE_MOCK_STORE:
        return MockStore
    else:
        try:
            return DynamoStore()
        except Exception as e:
            logger.warning(f"Failed to connect to DynamoDB ({e}). Falling back to MockStore.")
            return MockStore
