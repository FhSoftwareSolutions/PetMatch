"""Conexão com o MongoDB via pymongo.

O motor lê diretamente o banco `petmatch` (mesmas coleções do backend-api:
`pets`, `swipes`, `matches`), conforme decidido na issue #1.
"""

from functools import lru_cache

from pymongo import MongoClient
from pymongo.database import Database

from .config import get_settings


@lru_cache
def get_client() -> MongoClient:
    """Cliente MongoDB reutilizável (singleton cacheado)."""
    settings = get_settings()
    # @lru_cache garante UM único MongoClient no processo: o pool de conexões é
    # reaproveitado entre requisições (criar um cliente por request vazaria conexões).
    return MongoClient(
        settings.mongo_uri,
        # Falha rápido (5s) se o Mongo estiver fora do ar, em vez de pendurar a request.
        serverSelectionTimeoutMS=5000,
        # Retorna datetimes com timezone (os timestamps do Mongoose são gravados em UTC).
        tz_aware=True,
    )


def get_database() -> Database:
    """Retorna o database configurado (`petmatch` por padrão).

    Usado como dependência do FastAPI (`Depends(get_database)`), o que permite
    sobrescrevê-lo nos testes com um banco fake.
    """
    return get_client()[get_settings().mongo_db]
