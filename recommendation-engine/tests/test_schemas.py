"""Testes dos contratos Pydantic (aliases camelCase e validações)."""

import pytest
from pydantic import ValidationError

from app.schemas import RecommendationRequest


def test_aceita_camelcase():
    req = RecommendationRequest(petId="abc", coordinates=[10.0, 20.0], radiusKm=5, limit=3)
    assert req.pet_id == "abc"
    assert req.radius_km == 5
    assert req.limit == 3


def test_coordinates_precisa_ter_dois_elementos():
    with pytest.raises(ValidationError):
        RecommendationRequest(petId="abc", coordinates=[1.0, 2.0, 3.0])


def test_coordinates_valida_intervalos():
    with pytest.raises(ValidationError):
        RecommendationRequest(petId="abc", coordinates=[200.0, 0.0])
    with pytest.raises(ValidationError):
        RecommendationRequest(petId="abc", coordinates=[0.0, 100.0])


def test_radius_km_deve_ser_positivo():
    with pytest.raises(ValidationError):
        RecommendationRequest(petId="abc", coordinates=[0.0, 0.0], radiusKm=0)


def test_serializa_em_camelcase():
    req = RecommendationRequest(petId="abc", coordinates=[10.0, 20.0], radiusKm=5)
    dumped = req.model_dump(by_alias=True)
    assert "petId" in dumped
    assert "radiusKm" in dumped
