"""
backend/app/models.py
Pydantic data models matching the API contract specifications.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"


class SensorReadingRequest(BaseModel):
    cell_id: str = Field(..., description="Cell Identifier, e.g., r4c6")
    temp: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., description="Relative Humidity percentage (0-100)")


class SensorReadingResponse(BaseModel):
    status: str = "success"
    cell_id: str
    updated_at: str


class SensorReadingItem(BaseModel):
    cell_id: str
    lat: float
    lon: float
    temp: float
    humidity: float
    updated_at: str


class AdviceRequest(BaseModel):
    cell_id: str
    profile: str = Field("vendor", description="Vulnerability profile: office, vendor, laborer, elderly, child")
    lang: str = Field("en", description="Language code: en or ta")


class AdviceResponse(BaseModel):
    cell_id: str
    profile: str
    lang: str
    advice: str


class UnsafeWindow(BaseModel):
    start: str
    end: str


class RiskResponse(BaseModel):
    cell_id: str
    score: float
    band: str
    unsafe_window: UnsafeWindow
    advice_en: str
    advice_ta: str


class RouteDetail(BaseModel):
    geometry: Dict[str, Any]
    minutes: float
    exposure: float


class RouteResponse(BaseModel):
    fastest: RouteDetail
    coolest: RouteDetail
    exposure_reduction_pct: float


class MunicipalTopCell(BaseModel):
    cell_id: str
    score: float
    band: str
    name: str
    population_note: str
    suggestion: str
