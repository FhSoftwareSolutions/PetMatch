"""Testes do endpoint FastAPI (health + fluxo /recommendations com banco fake)."""

from bson import ObjectId
from fastapi.testclient import TestClient

import main
from app.db import get_database


class _FakeCollection:
    def __init__(self, find_one_doc=None, find_docs=None, aggregate_docs=None):
        self._find_one_doc = find_one_doc
        self._find_docs = find_docs or []
        self._aggregate_docs = aggregate_docs or []

    def find_one(self, *args, **kwargs):
        return self._find_one_doc

    def find(self, *args, **kwargs):
        return iter(self._find_docs)

    def aggregate(self, *args, **kwargs):
        return iter(self._aggregate_docs)


class _FakeDB:
    def __init__(self, pets, swipes):
        self.pets = pets
        self.swipes = swipes


def test_health():
    client = TestClient(main.app)
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json() == {"status": "PetMatch AI Engine Online"}


def test_recommendations_fluxo_completo():
    origin_id = ObjectId()
    origin = {
        "_id": origin_id,
        "ownerId": ObjectId(),
        "species": "cao",
        "breed": "labrador",
        "gender": "macho",
        "ageMonths": 24,
        "size": "medio",
        "seeking": "socializacao",
        "temperament": ["brincalhao", "docil"],
        "compatibility": {"goodWithDogs": True},
        "health": {"vaccinated": True},
        "recommendationTags": [],
    }
    candidates = [
        {
            "_id": ObjectId(),
            "name": "Mel",
            "species": "cao",
            "breed": "poodle",
            "gender": "femea",
            "ageMonths": 20,
            "size": "medio",
            "seeking": "socializacao",
            "temperament": ["brincalhao", "docil"],
            "compatibility": {"goodWithDogs": True},
            "health": {"vaccinated": True},
            "recommendationTags": [],
            "mainPhotoUrl": "http://img/mel.jpg",
            "distanceMeters": 800.0,
        },
        {
            "_id": ObjectId(),
            "name": "Rex",
            "species": "cao",
            "breed": "labrador",
            "gender": "macho",
            "ageMonths": 60,
            "size": "grande",
            "seeking": "ambos",
            "temperament": [],
            "compatibility": {},
            "health": {},
            "recommendationTags": [],
            "distanceMeters": 12000.0,
        },
    ]
    fake_db = _FakeDB(
        pets=_FakeCollection(find_one_doc=origin, aggregate_docs=candidates),
        swipes=_FakeCollection(find_docs=[]),  # cold start: sem swipes
    )

    main.app.dependency_overrides[get_database] = lambda: fake_db
    try:
        client = TestClient(main.app)
        resp = client.post(
            "/recommendations",
            json={"petId": str(origin_id), "coordinates": [-46.6, -23.5], "radiusKm": 25},
        )
    finally:
        main.app.dependency_overrides.clear()

    assert resp.status_code == 200
    data = resp.json()
    assert data["originPetId"] == str(origin_id)
    assert data["mode"] == "socializacao"
    assert data["count"] == 2
    # Mel (perto + mesmo temperamento) deve vir antes do Rex (longe + dissimilar).
    assert data["results"][0]["name"] == "Mel"
    assert "distanceKm" in data["results"][0]
    assert "score" in data["results"][0]
    assert data["results"][0]["reasons"]


def test_recommendations_pet_inexistente_retorna_404():
    fake_db = _FakeDB(
        pets=_FakeCollection(find_one_doc=None),
        swipes=_FakeCollection(find_docs=[]),
    )
    main.app.dependency_overrides[get_database] = lambda: fake_db
    try:
        client = TestClient(main.app)
        resp = client.post(
            "/recommendations",
            json={"petId": str(ObjectId()), "coordinates": [-46.6, -23.5]},
        )
    finally:
        main.app.dependency_overrides.clear()
    assert resp.status_code == 404


def test_recommendations_pet_id_invalido_retorna_422():
    fake_db = _FakeDB(
        pets=_FakeCollection(find_one_doc=None),
        swipes=_FakeCollection(find_docs=[]),
    )
    main.app.dependency_overrides[get_database] = lambda: fake_db
    try:
        client = TestClient(main.app)
        resp = client.post(
            "/recommendations",
            json={"petId": "nao-e-objectid", "coordinates": [-46.6, -23.5]},
        )
    finally:
        main.app.dependency_overrides.clear()
    assert resp.status_code == 422
