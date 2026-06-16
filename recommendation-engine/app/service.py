"""Orquestração do pipeline de recomendação: recall -> ranking -> resposta."""

from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from pymongo.database import Database

from .config import Settings
from .ranking import rank_candidates
from .recall import run_recall
from .schemas import Candidate, RecommendationRequest, RecommendationResponse


class InvalidPetIdError(ValueError):
    """`petId` não é um ObjectId válido."""


class PetNotFoundError(LookupError):
    """Pet de origem não encontrado no banco."""


def fetch_origin_pet(db: Database, pet_id: str) -> dict[str, Any] | None:
    # O petId chega como string; converter para ObjectId pode falhar se vier malformado.
    # Nesse caso lançamos InvalidPetIdError, que o main.py traduz em HTTP 422.
    try:
        object_id = ObjectId(pet_id)
    except (InvalidId, TypeError) as exc:
        raise InvalidPetIdError(pet_id) from exc
    return db.pets.find_one({"_id": object_id})


def recommend(
    db: Database, request: RecommendationRequest, settings: Settings
) -> RecommendationResponse:
    """Gera as recomendações para o pet de origem do request."""
    # 1) Carrega o pet de origem; sem ele não há o que recomendar (-> 404).
    origin = fetch_origin_pet(db, request.pet_id)
    if origin is None:
        raise PetNotFoundError(request.pet_id)

    # 2) Resolve os parâmetros efetivos. Precedência do objetivo:
    #    override do request > seeking do pet > "ambos" (mais permissivo).
    effective_seeking = request.seeking or origin.get("seeking") or "ambos"
    # Raio e limite caem para os defaults das settings quando não informados.
    radius_km = request.radius_km or settings.default_radius_km
    limit = request.limit or settings.default_limit

    # 3) Recall: candidatos elegíveis por geo + filtros rígidos.
    candidates = run_recall(
        db,
        origin,
        request.coordinates,
        radius_km,
        effective_seeking,
        settings.max_candidates,
    )

    # 4) Ranking: ordena os candidatos por compatibilidade (conteúdo) + proximidade.
    ranked = rank_candidates(
        origin,
        candidates,
        mode=effective_seeking,
        radius_km=radius_km,
        weight_distance=settings.weight_distance,
        weight_content=settings.weight_content,
        limit=limit,
    )

    # 5) Empacota no contrato de saída (dicts -> modelos Candidate validados).
    return RecommendationResponse(
        origin_pet_id=str(origin["_id"]),
        mode=effective_seeking,
        count=len(ranked),
        results=[Candidate(**item) for item in ranked],
    )
