"""
backend/app/routes/advice.py
Route POST /advice
Generates short Tamil or English heat safety advice for a given cell, profile, and language.
"""

from fastapi import APIRouter
from app.models import AdviceRequest, AdviceResponse
from app.services import store, scoring, advice
from app.routes.cells import get_current_hour

router = APIRouter()


@router.post("/advice", response_model=AdviceResponse)
async def generate_safety_advice(req: AdviceRequest):
    """
    Generates tailored 2-sentence heat safety advice in Tamil or English.
    """
    hour = get_current_hour()
    storage = store.get_store()

    score_rec = storage.get_cell_score(req.cell_id, hour)
    base_score = float(score_rec.get("base_score", 50.0)) if score_rec else 50.0

    score = scoring.calculate_cell_score(base_score, req.profile)
    band = scoring.get_risk_band(score)

    advice_text = await advice.generate_advice(
        score=score,
        band=band,
        profile=req.profile,
        lang=req.lang
    )

    return AdviceResponse(
        cell_id=req.cell_id,
        profile=req.profile,
        lang=req.lang,
        advice=advice_text
    )
