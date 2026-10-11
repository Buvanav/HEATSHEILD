"""
backend/app/routes/municipal.py
Route GET /municipal/top?n=10
Ranks the top N most heat-vulnerable grid cells for municipal city office action.
"""

from typing import List
from fastapi import APIRouter, Query
from app.models import MunicipalTopCell
from app.services import store, scoring
from app.routes.cells import load_grid_geojson, get_current_hour

router = APIRouter()

POPULATION_NOTES = {
    "r4c6": "Dense commercial market with heavy pedestrian foot traffic and unshaded street stalls.",
    "r5c4": "High outdoor commuter volume around T. Nagar bus terminus and Ranganathan Street.",
    "r5c5": "Transit interchange area with outdoor rickshaw pullers and vendors.",
    "r1c2": "Industrial estate border with high asphalt built-density and outdoor physical workers.",
    "r2c3": "Metro construction corridor with high concrete glare and unshaded pedestrian paths.",
    "r3c3": "High density Bazaar street with narrow alleys restricting air circulation.",
    "r7c1": "Bus depot and temple foot-traffic zone with outdoor flower sellers and pilgrims.",
    "r4c7": "Pondy Bazaar retail zone with high ambient asphalt heat retention."
}

SUGGESTIONS = {
    "r4c6": "Deploy portable mist cooling fans, distribute hydration packs, open Panagal Park shade canopy.",
    "r5c4": "Install temporary shade sails along Ranganathan St, position drinking water kiosks.",
    "r5c5": "Set up mobile cooling bus shelter, distribute ORS hydration packets to vendors.",
    "r1c2": "Mandate shade breaks for outdoor workers, set up cool misting tent at bus terminus.",
    "r2c3": "Set up water hydration station outside Saidapet Metro entrance.",
    "r3c3": "Deploy community water dispenser, schedule street misting truck during peak afternoon.",
    "r7c1": "Distribute cooling umbrellas to temple pilgrims and vendors outside Vadapalani temple.",
    "r4c7": "Activate commercial district cooling shelter and green shade tents."
}


@router.get("/municipal/top", response_model=List[MunicipalTopCell])
async def get_top_vulnerable_cells(
    n: int = Query(default=10, ge=1, le=100, description="Number of top vulnerable cells to return")
):
    """
    Ranks the top N most vulnerable cells for city office heat mitigation interventions.
    """
    hour = get_current_hour()
    grid_data = load_grid_geojson()
    storage = store.get_store()
    scores_map = storage.get_all_cell_scores(hour)

    cell_rankings = []
    for feature in grid_data.get("features", []):
        props = feature.get("properties", {})
        cid = props.get("cell_id")
        name = props.get("name", f"Cell {cid}")

        score_rec = scores_map.get(cid, {})
        base_score = float(score_rec.get("base_score", 48.0))
        # Municipal view uses vendor/laborer weighted risk (profile factor 1.2)
        score = scoring.calculate_cell_score(base_score, "vendor")
        band = scoring.get_risk_band(score)

        pop_note = POPULATION_NOTES.get(
            cid,
            f"Urban area ({name}) with high built density ({int(props.get('built_density', 0.7)*100)}%) and limited canopy."
        )

        sug = SUGGESTIONS.get(
            cid,
            "Install public drinking water fountain, plant urban shade trees, issue heat safety advisories."
        )

        cell_rankings.append(MunicipalTopCell(
            cell_id=cid,
            score=score,
            band=band,
            name=name,
            population_note=pop_note,
            suggestion=sug
        ))

    # Sort descending by risk score
    cell_rankings.sort(key=lambda x: x.score, reverse=True)

    return cell_rankings[:n]
