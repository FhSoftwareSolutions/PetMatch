"""PetMatch - Motor de Recomendação / IA.

Servidor FastAPI que expõe:
- GET  /                 health check.
- POST /recommendations  feed de candidatos (geo + filtragem de conteúdo).

Para rodar:
    uvicorn main:app --reload
"""

from fastapi import Depends, FastAPI, HTTPException
from pymongo.database import Database

from app.config import Settings, get_settings
from app.db import get_database
from app.schemas import RecommendationRequest, RecommendationResponse
from app.service import InvalidPetIdError, PetNotFoundError, recommend

app = FastAPI(title="PetMatch AI Engine", version="0.2.0")


@app.get("/")
def read_status() -> dict[str, str]:
    """Endpoint de health check do motor de recomendação."""
    return {"status": "PetMatch AI Engine Online"}


@app.post("/recommendations", response_model=RecommendationResponse)
def post_recommendations(
    request: RecommendationRequest,
    # Depends injeta o banco e as settings; nos testes são sobrescritos via
    # app.dependency_overrides, dispensando um MongoDB real.
    db: Database = Depends(get_database),
    settings: Settings = Depends(get_settings),
) -> RecommendationResponse:
    """Retorna candidatos ordenados por compatibilidade para o pet de origem."""
    # Traduz as exceções de domínio do service em respostas HTTP apropriadas.
    try:
        return recommend(db, request, settings)
    except InvalidPetIdError as exc:
        raise HTTPException(status_code=422, detail="petId inválido (não é um ObjectId).") from exc
    except PetNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Pet de origem não encontrado.") from exc
