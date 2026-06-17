"""Estágio 2 — Ranking por similaridade de conteúdo (scikit-learn).

Recebe o pet de origem e os candidatos do recall (cada um com `distanceMeters`)
e devolve a lista ordenada por um score que combina:

- similaridade de conteúdo (cosseno sobre features multi-hot, via scikit-learn)
  ponderada por grupo de feature conforme o modo (`cruzamento` x `socializacao`);
- proximidade de porte (ordinal) e de idade (numérica);
- proximidade geográfica (distância normalizada pelo raio).

As funções são puras (não tocam o banco), o que as torna testáveis sem MongoDB.
"""

from typing import Any

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MultiLabelBinarizer

# Peso de cada grupo de feature dentro do vetor de conteúdo, por modo.
# cruzamento valoriza compatibilidade genética (espécie/raça/porte/saúde);
# socializacao valoriza convivência (temperamento/compatibilidade social).
GROUP_WEIGHTS: dict[str, dict[str, float]] = {
    "cruzamento": {
        "species": 3.0,
        "breed": 3.0,
        "health": 2.0,
        "temp": 1.0,
        "compat": 1.0,
        "tag": 1.0,
    },
    "socializacao": {
        "species": 1.0,
        "breed": 0.5,
        "health": 0.5,
        "temp": 3.0,
        "compat": 3.0,
        "tag": 1.5,
    },
    "ambos": {"species": 1.5, "breed": 1.0, "health": 1.0, "temp": 2.0, "compat": 2.0, "tag": 1.0},
}

# Peso de cada componente do score de conteúdo (tokens x porte x idade).
COMPONENT_WEIGHTS: dict[str, dict[str, float]] = {
    "cruzamento": {"token": 1.0, "size": 1.0, "age": 0.5},
    "socializacao": {"token": 1.0, "size": 0.3, "age": 0.3},
    "ambos": {"token": 1.0, "size": 0.6, "age": 0.4},
}

SIZE_ORDER = {"pequeno": 0, "medio": 1, "grande": 2}
AGE_SCALE_MONTHS = 60.0

# Rótulos amigáveis para flags de compatibilidade nas justificativas.
COMPAT_LABELS = {
    "goodWithDogs": "cães",
    "goodWithCats": "gatos",
    "goodWithKids": "crianças",
}


def _pet_tokens(pet: dict[str, Any]) -> list[str]:
    """Conjunto de tokens categóricos/multi-label que representam o pet."""
    tokens: list[str] = []
    if pet.get("species"):
        tokens.append(f"species:{pet['species']}")
    if pet.get("breed"):
        tokens.append(f"breed:{pet['breed']}")
    for temperament in pet.get("temperament") or []:
        tokens.append(f"temp:{temperament}")
    for key, value in (pet.get("compatibility") or {}).items():
        if value:
            tokens.append(f"compat:{key}")
    for key, value in (pet.get("health") or {}).items():
        if value:
            tokens.append(f"health:{key}")
    for tag in pet.get("recommendationTags") or []:
        tokens.append(f"tag:{tag}")
    return tokens


def _token_similarity(
    origin: dict[str, Any], candidates: list[dict[str, Any]], mode: str
) -> np.ndarray:
    """Cosseno entre origem e candidatos sobre o vetor multi-hot ponderado."""
    weights = GROUP_WEIGHTS.get(mode, GROUP_WEIGHTS["ambos"])
    # Linha 0 = pet de origem; linhas seguintes = candidatos (mesma ordem da lista).
    token_lists = [_pet_tokens(origin)] + [_pet_tokens(c) for c in candidates]

    # MultiLabelBinarizer transforma os conjuntos de tokens numa matriz 0/1:
    # uma coluna por token distinto, uma linha por pet (multi-hot encoding).
    binarizer = MultiLabelBinarizer()
    matrix = binarizer.fit_transform(token_lists).astype(float)

    if matrix.shape[1] == 0:  # nenhum token em ninguém -> nada a comparar
        return np.zeros(len(candidates))

    # Pondera cada coluna pelo peso do grupo (o prefixo antes do ':', ex. "breed").
    # É assim que "pesar mais raça no cruzamento" vira matemática: colunas de breed
    # recebem peso maior e passam a dominar o cosseno.
    column_weights = np.array(
        [weights.get(token.split(":", 1)[0], 1.0) for token in binarizer.classes_]
    )
    weighted = matrix * column_weights

    # Similaridade do cosseno da origem (weighted[:1]) contra todos os candidatos.
    sims = cosine_similarity(weighted[:1], weighted[1:])[0]
    return sims


def _size_similarity(a: Any, b: Any) -> float:
    # Porte é ordinal (pequeno<medio<grande): 1.0 se igual, 0.5 se adjacente, 0.0 nos extremos.
    if a not in SIZE_ORDER or b not in SIZE_ORDER:
        return 0.0
    return 1.0 - abs(SIZE_ORDER[a] - SIZE_ORDER[b]) / 2.0


def _age_similarity(a: Any, b: Any) -> float:
    # Quanto maior a diferença de idade (em meses), menor a similaridade; zera a partir
    # de AGE_SCALE_MONTHS de diferença. Tolerante a campos ausentes/inválidos.
    try:
        return max(0.0, 1.0 - abs(float(a) - float(b)) / AGE_SCALE_MONTHS)
    except (TypeError, ValueError):
        return 0.0


def _distance_similarity(distance_km: float, radius_km: float) -> float:
    # Decaimento linear: 1.0 em cima do ponto de origem, 0.0 na borda do raio.
    if radius_km <= 0:
        return 0.0
    return max(0.0, 1.0 - distance_km / radius_km)


def _build_reasons(
    origin: dict[str, Any], candidate: dict[str, Any], mode: str, distance_km: float
) -> list[str]:
    """Justificativas legíveis para o card do feed (máx. 5)."""
    reasons: list[str] = []

    if origin.get("species") and candidate.get("species") == origin.get("species"):
        reasons.append(f"Mesma espécie ({candidate['species']})")

    if mode == "cruzamento":
        if origin.get("breed") and candidate.get("breed") == origin.get("breed"):
            reasons.append(f"Mesma raça ({candidate['breed']})")
        if (
            origin.get("gender")
            and candidate.get("gender")
            and candidate["gender"] != origin["gender"]
        ):
            reasons.append("Gênero oposto (compatível para cruzamento)")
    else:
        shared_temp = sorted(
            set(origin.get("temperament") or []) & set(candidate.get("temperament") or [])
        )
        if shared_temp:
            reasons.append("Temperamento em comum: " + ", ".join(shared_temp))
        origin_compat = origin.get("compatibility") or {}
        shared_compat = [
            COMPAT_LABELS.get(key, key)
            for key, value in (candidate.get("compatibility") or {}).items()
            if value and origin_compat.get(key)
        ]
        if shared_compat:
            reasons.append("Sociável com: " + ", ".join(shared_compat))

    if origin.get("size") and origin.get("size") == candidate.get("size"):
        reasons.append(f"Mesmo porte ({candidate['size']})")

    reasons.append(f"A {distance_km:.1f} km de distância")
    return reasons[:5]


def rank_candidates(
    origin: dict[str, Any],
    candidates: list[dict[str, Any]],
    *,
    mode: str,
    radius_km: float,
    weight_distance: float,
    weight_content: float,
    limit: int,
) -> list[dict[str, Any]]:
    """Ordena os candidatos por score decrescente e devolve no máximo `limit`."""
    if not candidates:
        return []

    # Calcula a similaridade de tokens de todos os candidatos de uma vez (vetorizado).
    token_sims = _token_similarity(origin, candidates, mode)
    components = COMPONENT_WEIGHTS.get(mode, COMPONENT_WEIGHTS["ambos"])
    component_total = sum(components.values())  # p/ normalizar a média do conteúdo
    score_total = weight_distance + weight_content  # p/ normalizar o score final

    ranked: list[dict[str, Any]] = []
    for index, candidate in enumerate(candidates):
        # distanceMeters vem do $geoNear (estágio de recall); convertemos para km.
        distance_km = float(candidate.get("distanceMeters", 0.0)) / 1000.0

        # Score de conteúdo = média ponderada de tokens + porte + idade (em [0, 1]).
        content = (
            components["token"] * float(token_sims[index])
            + components["size"] * _size_similarity(origin.get("size"), candidate.get("size"))
            + components["age"]
            * _age_similarity(origin.get("ageMonths"), candidate.get("ageMonths"))
        ) / component_total

        distance_score = _distance_similarity(distance_km, radius_km)

        # Score final = mistura geo x conteúdo, normalizada pelos pesos das settings.
        if score_total > 0:
            score = (weight_distance * distance_score + weight_content * content) / score_total
        else:
            score = content  # fallback defensivo: pesos zerados -> usa só conteúdo

        # Monta o item de saída espelhando os campos de Pet que o card precisa.
        ranked.append(
            {
                "pet_id": str(candidate.get("_id")),
                "score": round(score, 4),
                "distance_km": round(distance_km, 2),
                "reasons": _build_reasons(origin, candidate, mode, distance_km),
                "name": candidate.get("name"),
                "species": candidate.get("species"),
                "breed": candidate.get("breed"),
                "gender": candidate.get("gender"),
                "age_months": candidate.get("ageMonths"),
                "size": candidate.get("size"),
                "seeking": candidate.get("seeking"),
                "main_photo_url": candidate.get("mainPhotoUrl"),
                "bio": candidate.get("bio"),
                "city": candidate.get("city"),
                "temperament": candidate.get("temperament") or [],
                "recommendation_tags": candidate.get("recommendationTags") or [],
            }
        )

    # Ordena por score decrescente e devolve só os `limit` melhores.
    ranked.sort(key=lambda item: item["score"], reverse=True)
    return ranked[:limit]
