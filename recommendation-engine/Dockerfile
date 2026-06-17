FROM python:3.11-slim
WORKDIR /app

# Instala as dependências primeiro (melhor cache de camadas).
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
