"""Pacote do motor de recomendação do PetMatch.

Organização:
- config:  Settings (pydantic-settings) lidas do ambiente / .env.
- db:      conexão pymongo com o MongoDB compartilhado com o backend.
- schemas: contratos Pydantic de request/response.
- recall:  recall geoespacial + filtros rígidos (MongoDB / 2dsphere).
- ranking: ranking por similaridade de conteúdo (scikit-learn).
- service: orquestra o pipeline recall -> ranking.
"""
