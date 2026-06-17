# PetMatch

**"Tinder para Pets"** — um aplicativo que conecta donos de pets para **cruzamento** ou **socialização (brincadeiras)**, usando um sistema de recomendação baseado em **geolocalização** e **filtragem de conteúdo**.

> **Observação:** o projeto já funciona ponta a ponta na web. O **backend-api**
> (NestJS) expõe o CRUD de pets, o feed e os swipes; o **motor de recomendação**
> (geo + conteúdo) ordena o feed; e o **frontend web** consome a API real
> (cadastro, swipe e match recíproco). O **app mobile** ainda é um andaime
> (scaffolding). Autenticação, persistência de match/chat e o app mobile são os
> próximos passos.

---

## Arquitetura

O projeto é organizado como um **monorepo de diretórios paralelos**, onde cada serviço é independente:

```
PetMatch/
├── docker-compose.yml      # Infraestrutura local (MongoDB)
├── backend-api/            # API principal (NestJS + Mongoose)
├── recommendation-engine/  # Motor de recomendação/IA (Python + FastAPI)
├── mobile-app/             # App mobile (React Native + Expo)
└── web-app/                # Frontend web (React + Vite)
```

## Stack

| Camada                | Tecnologia                                          |
| --------------------- | --------------------------------------------------- |
| **Backend Principal** | Node.js · NestJS · Mongoose                         |
| **Banco de Dados**    | MongoDB (com ênfase futura em *Geospatial Indexes*) |
| **Mobile Frontend**   | React Native · Expo · TypeScript                    |
| **Web Frontend**      | React · Vite · TypeScript                           |
| **Motor de IA**       | Python · FastAPI · scikit-learn                     |

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) (LTS) e npm
- [Docker](https://www.docker.com/) + Docker Compose
- [Python 3.10+](https://www.python.org/)
- [Expo Go](https://expo.dev/go) (para testar o app no celular)

---

## Como rodar cada serviço

### Tudo de uma vez (atalho)

Na raiz do projeto, sobe **MongoDB + motor de IA + backend + web-app** com um
único comando (logs combinados e coloridos por serviço):

```bash
npm run dev
```

Pré-requisitos: dependências instaladas (`npm run install:all` para os serviços
Node e o `.venv` do `recommendation-engine`) e o Docker rodando. Encerre com
`Ctrl+C` — o MongoDB segue em background (pare com `npm run db:down`). O app
mobile (Expo) roda à parte. Para subir um serviço isolado, siga os passos abaixo.

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
Variáveis opcionais: `MONGO_URI` (padrão `mongodb://127.0.0.1:27017/petmatch`) e
`AI_ENGINE_URL` (padrão `http://127.0.0.1:8000`, usado pelo feed).

Popular o banco com pets de exemplo (precisa do MongoDB no ar):

```bash
npm run seed
```

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

### 3. App Mobile (Expo)

```bash
cd mobile-app
npm install
npm start
```

Use o **Expo Go** no celular (escaneando o QR Code) ou um emulador Android/iOS.

### 4. Frontend Web (React + Vite)

```bash
cd web-app
npm install
cp .env.example .env   # opcional: ajusta as URLs dos serviços
npm run dev
```

A aplicação web sobe em `http://localhost:5173` com a tela de **swipe** (deck de
pets vindos da API/feed). Detalhes em [`web-app/README.md`](web-app/README.md).

---

## Status atual

Já funciona, ponta a ponta na web e com contrato unificado entre os serviços
(`gender`/`size`/`seeking` minúsculos, `ageMonths`, `location` GeoJSON):

- **Backend (NestJS):** CRUD de pets com DTOs + `ValidationPipe`; índices `2dsphere`;
  `GET /pets` (lista), `GET /pets/feed?petId=` (delega ao motor, com fallback no
  Mongo se o motor cair), `POST /pets` (dono pelo header `X-Owner-Id`, `location`
  derivada da cidade) e `POST /swipes` (persistência + match recíproco real).
- **Motor de recomendação (FastAPI):** recall geográfico (`$geoNear`) + ranking de
  conteúdo (scikit-learn); contratos Pydantic em camelCase.
- **Frontend web:** onboarding, cadastro, feed recomendado, swipe e tela de match,
  consumindo a API real.
- **Seed:** `npm run seed` popula a coleção `pets` com exemplos.
- **CI:** `.github/workflows/ci.yml` roda build/testes dos três serviços.

## Próximos passos

### Backend / Banco

- **Autenticação** (JWT via `@nestjs/passport` + `@nestjs/jwt`) substituindo o
  `X-Owner-Id`/`DEMO_OWNER_ID` provisório.
- Implementar **Users** (cadastro/perfil) — o módulo ainda é só schema.
- **Persistir o Match** (Etapa 2): hoje a reciprocidade é detectada e sinalizada,
  mas o documento `Match` e o **chat** ainda não são gravados/expostos. Corrigir
  também o índice único de `Match` (`{ petIds: 1 }` é multikey e impediria um pet
  de ter mais de um match — usar uma `pairKey` canônica).
- `ConfigModule` (`@nestjs/config`) e **Swagger** (`@nestjs/swagger`).
- (Opcional) cache (Redis) para o feed.

### App Mobile (React Native + Expo)

- Navegação, telas (Login, Swipe/Match, Perfil, Matches, Chat), camada de serviços
  consumindo `API_BASE_URL` e permissão de **geolocalização**.

### Frontend Web

- **Roteamento** (`react-router-dom`) e telas de login, perfil, lista de matches e chat.

### Transversais

- **Lint/format** (ESLint + Prettier no Node; Ruff/Black no Python) e testes de
  componente no front (Testing Library).
- Dockerfiles por serviço para deploy.
