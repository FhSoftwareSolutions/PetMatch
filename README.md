# 🐾 PetMatch

**"Tinder para Pets"** — um aplicativo que conecta donos de pets para **cruzamento** ou **socialização (brincadeiras)**, usando um sistema de recomendação baseado em **geolocalização** e **filtragem de conteúdo**.

> ⚠️ Este repositório contém apenas o **andaime (scaffolding)** inicial: infraestrutura, dependências e pontos de entrada de cada serviço. A lógica de negócio ainda não foi implementada.

---

## 🧱 Arquitetura

O projeto é organizado como um **monorepo de diretórios paralelos**, onde cada serviço é independente:

```
PetMatch/
├── docker-compose.yml      # Infraestrutura local (MongoDB)
├── backend-api/            # API principal (NestJS + Mongoose)
├── recommendation-engine/  # Motor de recomendação/IA (Python + FastAPI)
└── mobile-app/             # App mobile (React Native + Expo)
```

## 🛠️ Stack

| Camada                 | Tecnologia                                              |
| ---------------------- | ------------------------------------------------------- |
| **Backend Principal**  | Node.js · NestJS · Mongoose                             |
| **Banco de Dados**     | MongoDB (com ênfase futura em *Geospatial Indexes*)     |
| **Frontend (Mobile + Web)** | React Native · Expo (iOS · Android · Web) · TypeScript |
| **Motor de IA**        | Python · FastAPI · scikit-learn                         |

---

## 🚀 Como rodar cada serviço

### 0. Banco de Dados (MongoDB via Docker)

Na raiz do projeto:

```bash
docker compose up -d
```

O MongoDB ficará disponível em `mongodb://localhost:27017` (database padrão: `petmatch`).

### 1. Backend API (NestJS)

```bash
cd backend-api
npm install
npm run start:dev
```

A API sobe em `http://localhost:3000`.
Variável opcional: `MONGO_URI` (padrão `mongodb://localhost:27017/petmatch`).

### 2. Motor de Recomendação (FastAPI)

```bash
cd recommendation-engine
python -m venv .venv
# Windows:  .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

A API de IA sobe em `http://localhost:8000`.
Verifique o status acessando `http://localhost:8000/` → `{"status": "PetMatch AI Engine Online"}`.

### 3. App Mobile + Web (Expo)

```bash
cd mobile-app
npm install
npm start        # menu com opções de plataforma
```

A partir do mesmo código (React Native + Expo), o app roda em:

- **Mobile:** use o **Expo Go** no celular (escaneando o QR Code) ou um emulador Android/iOS.
- **Web:** rode `npm run web` para abrir no navegador (`http://localhost:8081`).

---

## 📌 Pré-requisitos

- [Node.js](https://nodejs.org/) (LTS) e npm
- [Docker](https://www.docker.com/) + Docker Compose
- [Python 3.10+](https://www.python.org/)
- [Expo Go](https://expo.dev/go) (para testar o app no celular)
