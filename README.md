# PetMatch

**"Tinder para Pets"** — um aplicativo que conecta donos de pets para **cruzamento** ou **socialização (brincadeiras)**, usando um sistema de recomendação baseado em **geolocalização** e **filtragem de conteúdo**.

> **Observação:** o projeto está em construção. O **motor de recomendação** já
> tem o pipeline (geo + conteúdo) implementado e testado, e o **frontend web**
> já roda a tela de swipe com dados mock. O **backend-api** (modelagem do banco)
> e o **app mobile** ainda são andaimes (scaffolding) — sem lógica de negócio.

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
pets com dados mock). Detalhes em [`web-app/README.md`](web-app/README.md).

---

## Próximos passos

Roteiro de implementação sugerido, mapeado na stack atual. Cada item parte do andaime já existente.

### Infraestrutura e Banco de Dados (MongoDB)

- Criar arquivos `.env` por serviço (connection string, portas, segredos) e um `.env.example` versionado.
- Definir o índice geoespacial `2dsphere` na coleção de pets para habilitar busca por proximidade (`$near` / `$geoWithin`).
- (Opcional) Adicionar serviço de cache (Redis) ao `docker-compose.yml` para o feed de recomendações.

### Backend API (NestJS + Mongoose)

- Modelar os **Schemas Mongoose**: `User`, `Pet` (com campo `location` do tipo GeoJSON `Point`) e `Match`.
- Registrar os schemas nos módulos via `MongooseModule.forFeature(...)`.
- Implementar **DTOs + validação** com `class-validator` / `class-transformer` (`ValidationPipe` global).
- Criar os **controllers e services** com o CRUD de cada módulo (users, pets, matches).
- Adicionar **autenticação** (JWT via `@nestjs/passport` + `@nestjs/jwt`).
- Expor um endpoint de **feed/descoberta** que consome o `recommendation-engine`.
- Configurar `ConfigModule` (`@nestjs/config`), CORS e documentação Swagger (`@nestjs/swagger`).

### Motor de Recomendação (FastAPI + scikit-learn)

- Conectar ao MongoDB via `pymongo` (ler perfis de pets e interações).
- Criar o endpoint `POST /recommendations` que recebe um pet + localização e retorna candidatos ordenados.
- Implementar a **filtragem por geolocalização** (raio de busca) combinada com **filtragem de conteúdo** (similaridade por features: espécie, raça, porte, temperamento) usando `scikit-learn`.
- Definir os contratos (schemas Pydantic) de request/response compartilhados com o backend.

### App Mobile (React Native + Expo)

- Adicionar **navegação** (`expo-router` ou `@react-navigation`).
- Implementar as telas em `src/screens`: Login/Cadastro, Swipe/Match, Perfil do Pet, Lista de Matches, Chat.
- Criar os **componentes** reutilizáveis em `src/components` (card de pet, botões de like/dislike, gesto de swipe).
- Implementar a **camada de serviços** em `src/services` (cliente HTTP, ex.: `axios`, consumindo `API_BASE_URL`).
- Adicionar gerenciamento de estado/sessão e permissão de **geolocalização** do dispositivo.

### Frontend Web (React + Vite)

- A tela de **swipe** (deck, histórico, match) já existe em `src/pages` e `src/components`, hoje com dados mock (`src/data/pets.ts`).
- Consumir pets reais da API NestJS / motor de recomendação pela **camada de serviços** (`src/services/api.ts`), no lugar do mock.
- Adicionar **roteamento** (`react-router-dom`) e novas telas (login, perfil, lista de matches, chat).

### Transversais

- Rodar as instalações de dependências (`npm install` / `pip install`) em cada serviço.
- Configurar **lint e formatação** (ESLint + Prettier no Node; Ruff/Black no Python).
- Adicionar **testes** (Jest no NestJS, Pytest no engine, Testing Library no front).
- Configurar **CI** (lint + testes + build) e, futuramente, Dockerfiles por serviço para deploy.
