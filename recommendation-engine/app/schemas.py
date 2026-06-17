"""Contratos Pydantic de request/response do endpoint de recomendações.

A API expõe os campos em camelCase (alinhado ao backend NestJS), enquanto o
código Python usa snake_case. Isso é feito via `alias_generator=to_camel`.
"""

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel

Seeking = Literal["socializacao", "cruzamento", "ambos"]


class CamelModel(BaseModel):
    """Base que serializa/aceita campos em camelCase e em snake_case."""

    # alias_generator=to_camel -> a API troca dados em camelCase (petId, radiusKm),
    # alinhado ao backend NestJS; o FastAPI serializa respostas com by_alias=True.
    # populate_by_name=True -> aceita também o nome snake_case ao instanciar no Python.
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class RecommendationRequest(CamelModel):
    """Entrada do feed: pet de origem + ponto de busca."""

    pet_id: str = Field(..., description="ObjectId do pet de origem.")
    coordinates: list[float] = Field(
        ..., description="Ponto de origem no formato GeoJSON [lng, lat]."
    )
    radius_km: Optional[float] = Field(
        default=None, gt=0, description="Raio de busca em km (default vem das settings)."
    )
    limit: Optional[int] = Field(
        default=None, gt=0, le=200, description="Máximo de resultados (default nas settings)."
    )
    seeking: Optional[Seeking] = Field(
        default=None,
        description="Override do objetivo; se ausente, usa o `seeking` do pet de origem.",
    )

    @field_validator("coordinates")
    @classmethod
    def _validate_coordinates(cls, value: list[float]) -> list[float]:
        # Ordem GeoJSON é [longitude, latitude] (e NÃO [lat, lng]) — é o formato que o
        # Mongo espera no $geoNear, então validamos exatamente nessa ordem.
        if len(value) != 2:
            raise ValueError("coordinates deve ser [lng, lat] (2 números).")
        lng, lat = value
        if not -180 <= lng <= 180:
            raise ValueError("longitude (coordinates[0]) deve estar entre -180 e 180.")
        if not -90 <= lat <= 90:
            raise ValueError("latitude (coordinates[1]) deve estar entre -90 e 90.")
        return value


class Candidate(CamelModel):
    """Um pet recomendado, com score e justificativas."""

    pet_id: str
    score: float
    distance_km: float
    reasons: list[str] = Field(default_factory=list)

    # Campos espelhados de `Pet` para o cliente montar o card.
    name: str
    species: str
    breed: Optional[str] = None
    gender: str
    age_months: Optional[int] = None
    size: Optional[str] = None
    seeking: Optional[str] = None
    main_photo_url: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    temperament: list[str] = Field(default_factory=list)
    recommendation_tags: list[str] = Field(default_factory=list)


class RecommendationResponse(CamelModel):
    """Saída do feed: candidatos ordenados por score decrescente."""

    origin_pet_id: str
    mode: Seeking
    count: int
    results: list[Candidate] = Field(default_factory=list)
