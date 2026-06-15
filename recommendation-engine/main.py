"""PetMatch - Motor de Recomendação / IA.

Servidor FastAPI básico. A lógica de recomendação (geolocalização +
filtragem de conteúdo com scikit-learn) será adicionada futuramente.

Para rodar:
    uvicorn main:app --reload
"""

from fastapi import FastAPI

app = FastAPI(title="PetMatch AI Engine", version="0.1.0")


@app.get("/")
def read_status():
    """Endpoint de health check do motor de recomendação."""
    return {"status": "PetMatch AI Engine Online"}
