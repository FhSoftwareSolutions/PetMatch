# PetMatch

**"Tinder para Pets"** — um aplicativo que conecta donos de pets para **cruzamento** ou **socialização (brincadeiras)**, usando um sistema de recomendação baseado em **geolocalização** e **filtragem de conteúdo**.

> **Observação:** este repositório contém apenas o **andaime (scaffolding)** inicial — infraestrutura, dependências e pontos de entrada de cada serviço. A lógica de negócio ainda não foi implementada.

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
npm run dev
```

A aplicação web sobe em `http://localhost:5173`.

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

- Adicionar **roteamento** (`react-router-dom`) e estruturar as páginas em `src/pages`.
- Reaproveitar a **camada de serviços** (`src/services`) para consumir a API NestJS.
- Definir o propósito do web (painel administrativo, landing público, ou versão desktop do app) e construir as telas correspondentes.

### Transversais

- Rodar as instalações de dependências (`npm install` / `pip install`) em cada serviço.
- Configurar **lint e formatação** (ESLint + Prettier no Node; Ruff/Black no Python).
- Adicionar **testes** (Jest no NestJS, Pytest no engine, Testing Library no front).
- Configurar **CI** (lint + testes + build) e, futuramente, Dockerfiles por serviço para deploy.
