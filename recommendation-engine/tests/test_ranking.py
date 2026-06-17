"""Testes do estágio de ranking (similaridade de conteúdo + score final)."""

from app.ranking import rank_candidates

WEIGHTS = {"weight_distance": 0.4, "weight_content": 0.6}


def _pet(**overrides):
    base = {
        "_id": "pet",
        "name": "Pet",
        "species": "cao",
        "breed": "labrador",
        "gender": "macho",
        "ageMonths": 24,
        "size": "medio",
        "seeking": "socializacao",
        "temperament": [],
        "compatibility": {},
        "health": {},
        "recommendationTags": [],
        "distanceMeters": 1000.0,
    }
    base.update(overrides)
    return base


def test_lista_vazia_retorna_vazio():
    origin = _pet()
    assert rank_candidates(origin, [], mode="socializacao", radius_km=25, limit=10, **WEIGHTS) == []


def test_candidato_proximo_e_similar_fica_em_primeiro():
    origin = _pet(temperament=["brincalhao", "docil"], compatibility={"goodWithDogs": True})
    similar_perto = _pet(
        _id="bom",
        temperament=["brincalhao", "docil"],
        compatibility={"goodWithDogs": True},
        distanceMeters=500.0,
    )
    diferente_longe = _pet(
        _id="ruim",
        species="gato",
        breed="siames",
        size="grande",
        ageMonths=1,
        temperament=[],
        compatibility={},
        distanceMeters=20000.0,
    )
    ranked = rank_candidates(
        origin,
        [diferente_longe, similar_perto],
        mode="socializacao",
        radius_km=25,
        limit=10,
        **WEIGHTS,
    )
    assert ranked[0]["pet_id"] == "bom"
    assert ranked[0]["score"] > ranked[1]["score"]
    assert ranked[0]["distance_km"] == 0.5  # 500m -> 0.5km


def test_cruzamento_prioriza_mesma_raca():
    origin = _pet(seeking="cruzamento", temperament=["calmo"])
    mesma_raca = _pet(_id="mesma", breed="labrador", gender="femea", temperament=[], size=None)
    outra_raca = _pet(_id="outra", breed="poodle", gender="femea", temperament=["calmo"], size=None)
    origin["size"] = None
    ranked = rank_candidates(
        origin, [outra_raca, mesma_raca], mode="cruzamento", radius_km=25, limit=10, **WEIGHTS
    )
    assert ranked[0]["pet_id"] == "mesma"


def test_socializacao_prioriza_temperamento_sobre_raca():
    origin = _pet(
        temperament=["brincalhao", "docil"], compatibility={"goodWithDogs": True}, size=None
    )
    so_temperamento = _pet(
        _id="temp",
        breed="poodle",
        temperament=["brincalhao", "docil"],
        compatibility={"goodWithDogs": True},
        size=None,
    )
    so_raca = _pet(_id="raca", breed="labrador", temperament=[], compatibility={}, size=None)
    ranked = rank_candidates(
        origin, [so_raca, so_temperamento], mode="socializacao", radius_km=25, limit=10, **WEIGHTS
    )
    assert ranked[0]["pet_id"] == "temp"


def test_distancia_desempata_candidatos_identicos():
    origin = _pet(temperament=["docil"])
    perto = _pet(_id="perto", temperament=["docil"], distanceMeters=1000.0)
    longe = _pet(_id="longe", temperament=["docil"], distanceMeters=15000.0)
    ranked = rank_candidates(
        origin, [longe, perto], mode="socializacao", radius_km=25, limit=10, **WEIGHTS
    )
    assert ranked[0]["pet_id"] == "perto"


def test_limit_trunca_resultados():
    origin = _pet()
    candidates = [_pet(_id=f"c{i}", distanceMeters=1000.0 * (i + 1)) for i in range(5)]
    ranked = rank_candidates(
        origin, candidates, mode="socializacao", radius_km=50, limit=2, **WEIGHTS
    )
    assert len(ranked) == 2


def test_score_dentro_de_zero_e_um():
    origin = _pet(temperament=["docil"])
    cand = _pet(_id="x", temperament=["docil"], distanceMeters=3000.0)
    ranked = rank_candidates(origin, [cand], mode="socializacao", radius_km=25, limit=10, **WEIGHTS)
    assert 0.0 <= ranked[0]["score"] <= 1.0


def test_ranking_inclui_campos_de_exibicao():
    origin = _pet()
    cand = _pet(
        _id="c",
        bio="late pouco",
        city="São Paulo",
        temperament=["docil"],
        recommendationTags=["vacinado"],
        distanceMeters=1000.0,
    )
    ranked = rank_candidates(origin, [cand], mode="socializacao", radius_km=25, limit=10, **WEIGHTS)
    item = ranked[0]
    assert item["bio"] == "late pouco"
    assert item["city"] == "São Paulo"
    assert item["temperament"] == ["docil"]
    assert item["recommendation_tags"] == ["vacinado"]


def test_reasons_de_cruzamento_explicam_compatibilidade():
    origin = _pet(seeking="cruzamento", breed="labrador", gender="macho")
    cand = _pet(_id="c", breed="labrador", gender="femea", distanceMeters=1200.0)
    ranked = rank_candidates(origin, [cand], mode="cruzamento", radius_km=25, limit=10, **WEIGHTS)
    reasons = ranked[0]["reasons"]
    assert any("Mesma espécie" in r for r in reasons)
    assert any("Mesma raça" in r for r in reasons)
    assert any("Gênero oposto" in r for r in reasons)
    assert any("km de distância" in r for r in reasons)
