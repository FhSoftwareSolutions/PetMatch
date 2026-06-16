"""Configurações do serviço, lidas do ambiente (ou de um arquivo .env)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Parâmetros de conexão e do feed de recomendações.

    Os nomes batem com as variáveis do `.env.example` de forma
    case-insensitive (ex.: ``MONGO_URI`` -> ``mongo_uri``).
    """

    model_config = SettingsConfigDict(
        env_file=".env",  # lê variáveis de um .env local, se existir
        env_file_encoding="utf-8",
        extra="ignore",  # ignora chaves extras no .env em vez de quebrar
    )

    # Conexão (mesmo banco do backend-api). Usamos 127.0.0.1 em vez de "localhost"
    # de propósito: "localhost" pode resolver para IPv6 (::1) e o pymongo (Python)
    # e o Mongoose (Node) resolvem de formas diferentes — fixar 127.0.0.1 garante
    # que backend e motor leiam/escrevam no MESMO MongoDB.
    mongo_uri: str = "mongodb://127.0.0.1:27017"
    mongo_db: str = "petmatch"

    # Parâmetros padrão do feed (usados quando o request não os informa).
    default_radius_km: float = 25.0
    default_limit: int = 30
    # Teto de candidatos trazidos do recall geoespacial antes de rodar o ranking
    # (protege contra ranquear uma cidade inteira numa região muito densa).
    max_candidates: int = 200

    # Pesos do score final (geo x conteúdo). Não precisam somar 1: são
    # normalizados pela soma na hora de calcular o score.
    weight_distance: float = 0.4
    weight_content: float = 0.6


@lru_cache
def get_settings() -> Settings:
    """Retorna as configurações (cacheadas para reuso entre requisições)."""
    return Settings()
