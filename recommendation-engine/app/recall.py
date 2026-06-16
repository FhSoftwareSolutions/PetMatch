"""Estágio 1 — Recall: candidatos por geolocalização + filtros rígidos.

Usa o índice `2dsphere` da coleção `pets` (definido no backend) via `$geoNear`.

IMPORTANTE: o schema `Pet` declara DOIS índices 2dsphere (um simples em
`location` e um composto `{location, seeking, status}`). Quando há mais de um
índice geográfico, o `$geoNear` exige o parâmetro `key` para desambiguar — por
isso passamos sempre `key="location"`.
"""

from typing import Any

from pymongo.database import Database

# Compatibilidade de objetivo: o que um pet com dado `seeking` aceita ver.
SEEKING_COMPAT: dict[str, list[str]] = {
    "cruzamento": ["cruzamento", "ambos"],
    "socializacao": ["socializacao", "ambos"],
    "ambos": ["cruzamento", "socializacao", "ambos"],
}


def build_match_query(
    origin: dict[str, Any],
    exclude_ids: list[Any],
    effective_seeking: str,
) -> dict[str, Any]:
    """Monta os filtros rígidos aplicados dentro do `$geoNear`.

    Sempre exclui pets inativos/indisponíveis, o próprio pet, pets do mesmo dono
    e alvos já avaliados (`exclude_ids`). Para `cruzamento`, adiciona as
    restrições rígidas de mesma espécie e gênero oposto.
    """
    query: dict[str, Any] = {
        "status": "available",  # só perfis disponíveis (não escondidos/adotados)
        "active": True,  # ignora perfis desativados
        "_id": {"$nin": exclude_ids},  # exclui o próprio pet + alvos já avaliados
        "ownerId": {"$ne": origin.get("ownerId")},  # não recomenda pets do mesmo dono
        # Só candidatos cujo objetivo é compatível com o do pet de origem.
        "seeking": {"$in": SEEKING_COMPAT.get(effective_seeking, SEEKING_COMPAT["ambos"])},
    }

    if effective_seeking == "cruzamento":
        # Restrições rígidas de cruzamento: mesma espécie e gênero oposto. Aplicadas
        # aqui (no recall) porque são regras de elegibilidade, não de "ranking".
        if origin.get("species") is not None:
            query["species"] = origin["species"]
        if origin.get("gender") is not None:
            query["gender"] = {"$ne": origin["gender"]}

    return query


def build_geo_pipeline(
    coordinates: list[float],
    radius_km: float,
    match_query: dict[str, Any],
    max_candidates: int,
) -> list[dict[str, Any]]:
    """Monta o pipeline de agregação do recall (geo + filtros + limite)."""
    return [
        # $geoNear precisa ser o PRIMEIRO estágio do pipeline e ordena os documentos
        # do mais próximo ao mais distante do ponto de origem.
        {
            "$geoNear": {
                "near": {"type": "Point", "coordinates": coordinates},
                # Grava a distância calculada (em metros) em cada doc, para o ranking usar.
                "distanceField": "distanceMeters",
                "maxDistance": radius_km * 1000.0,  # raio em km -> metros
                "spherical": True,  # distância sobre a esfera (obrigatório p/ índice 2dsphere)
                # Desambigua os dois índices 2dsphere existentes no schema Pet: sem 'key'
                # o Mongo recusa o $geoNear quando há mais de um índice geográfico.
                "key": "location",
                "query": match_query,  # filtros rígidos aplicados junto com o geo
            }
        },
        {"$limit": max_candidates},  # teto de segurança antes do ranking
    ]


def fetch_swiped_target_ids(db: Database, origin_id: Any) -> list[Any]:
    """IDs dos pets que o pet de origem já avaliou (like/dislike).

    Em *cold start* (pet novo, sem swipes) retorna lista vazia, e o ranking cai
    naturalmente para apenas conteúdo + geo.
    """
    cursor = db.swipes.find({"petId": origin_id}, {"targetPetId": 1})
    return [doc["targetPetId"] for doc in cursor]


def run_recall(
    db: Database,
    origin: dict[str, Any],
    coordinates: list[float],
    radius_km: float,
    effective_seeking: str,
    max_candidates: int,
) -> list[dict[str, Any]]:
    """Executa o recall e devolve os candidatos com `distanceMeters` calculado."""
    swiped = fetch_swiped_target_ids(db, origin["_id"])
    exclude_ids = [origin["_id"], *swiped]
    query = build_match_query(origin, exclude_ids, effective_seeking)
    pipeline = build_geo_pipeline(coordinates, radius_km, query, max_candidates)
    return list(db.pets.aggregate(pipeline))
