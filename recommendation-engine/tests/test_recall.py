"""Testes do estágio de recall (construção de query e pipeline geoespacial)."""

from app.recall import SEEKING_COMPAT, build_geo_pipeline, build_match_query


def _origin():
    return {"ownerId": "owner-1", "species": "cao", "gender": "macho", "seeking": "cruzamento"}


def test_match_query_base_filters_sempre_presentes():
    query = build_match_query(_origin(), ["a", "b"], "socializacao")
    assert query["status"] == "available"
    assert query["active"] is True
    assert query["_id"] == {"$nin": ["a", "b"]}
    assert query["ownerId"] == {"$ne": "owner-1"}


def test_match_query_cruzamento_aplica_especie_e_genero_oposto():
    query = build_match_query(_origin(), [], "cruzamento")
    assert query["species"] == "cao"
    assert query["gender"] == {"$ne": "macho"}
    assert query["seeking"] == {"$in": SEEKING_COMPAT["cruzamento"]}


def test_match_query_socializacao_nao_restringe_especie_nem_genero():
    query = build_match_query(_origin(), [], "socializacao")
    assert "species" not in query
    assert "gender" not in query
    assert query["seeking"] == {"$in": SEEKING_COMPAT["socializacao"]}


def test_match_query_ambos_aceita_todos_os_seeking():
    query = build_match_query(_origin(), [], "ambos")
    assert set(query["seeking"]["$in"]) == {"cruzamento", "socializacao", "ambos"}
    assert "species" not in query
    assert "gender" not in query


def test_geo_pipeline_usa_key_para_desambiguar_indice_2dsphere():
    pipeline = build_geo_pipeline([10.0, -20.0], 25.0, {"status": "available"}, 200)
    geo = pipeline[0]["$geoNear"]
    assert geo["near"] == {"type": "Point", "coordinates": [10.0, -20.0]}
    assert geo["maxDistance"] == 25000.0
    assert geo["spherical"] is True
    assert geo["key"] == "location"  # crítico: há dois índices 2dsphere no schema
    assert geo["query"] == {"status": "available"}
    assert pipeline[1] == {"$limit": 200}
