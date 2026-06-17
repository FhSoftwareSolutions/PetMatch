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
# Para testar em um dispositivo físico, aponte a API para o IP da sua máquina:
# export EXPO_PUBLIC_API_BASE_URL=http://SEU_IP:3000
npm start
```

Use o **Expo Go** no celular (escaneando o QR Code) ou um emulador Android/iOS.
O app tem navegação (abas + stack), login, feed/swipe, matches, chat e perfil.

### 4. Frontend Web (React + Vite)

```bash
cd web-app
npm install
cp .env.example .env   # opcional: ajusta as URLs dos serviços
npm run dev
```

A aplicação web sobe em `http://localhost:5173` com a tela de **swipe** (deck de
pets vindos da API/feed). Detalhes em [`web-app/README.md`](web-app/README.md).

### 5. Tudo em containers (opcional)

Para subir a stack completa (Mongo + motor + API + web) só com Docker:

```bash
docker compose --profile full up -d --build
```

Web em `http://localhost:5173`, API em `http://localhost:3000` (Swagger em
`/docs`) e motor em `http://localhost:8000`. Sem o profile, `docker compose up -d`
sobe apenas o MongoDB (para o fluxo `npm run dev`).

---

## Como usar o app

Com os serviços no ar (`npm run dev` + `npm run seed`, ou
`docker compose --profile full up -d --build`):

1. Abra o **web** em `http://localhost:5173`.
2. **Onboarding**: na primeira visita, cadastre seu pet (nome, espécie, sexo,
   idade, porte, objetivo e cidade). Ele vira a *origem* das recomendações.
3. **Descobrir**: deslize os cards (arraste ou use os botões ❤ / ✕). O feed é
   ordenado pelo motor de recomendação (proximidade + compatibilidade).
4. **Match**: quando dois pets se curtem, abre a tela de match — siga para o
   **chat**. Seus matches ficam em 💬 no cabeçalho (rota `/matches`).
5. **Conta (opcional)**: em 👤 **Perfil** dá para criar conta / entrar, ver e
   excluir seus pets e **enviar fotos** por upload (anônimo segue usando URL).

> **Para ver um match de verdade** é preciso reciprocidade: use dois navegadores
> (ou uma aba anônima), cadastre um pet em cada e curtam-se mutuamente. Os pets
> do `seed` não curtem de volta sozinhos.

**Mobile:** `cd mobile-app && npm start` e abra no Expo Go. Em dispositivo físico,
aponte a API: `export EXPO_PUBLIC_API_BASE_URL=http://SEU_IP:3000`.

**API:** documentação interativa (Swagger) em `http://localhost:3000/docs`.
Principais rotas: `POST /auth/register|login`, `GET /pets`,
`GET /pets/feed?petId=`, `POST /pets`, `POST /swipes`, `GET /matches`,
`GET|POST /matches/:matchId/messages`, `POST /uploads`.

---

## Status atual

App **completo ponta a ponta** (web + mobile), com contrato unificado entre os
serviços (`gender`/`size`/`seeking` minúsculos, `ageMonths`, `location` GeoJSON).

**Backend (NestJS)**
- CRUD de pets com DTOs + `ValidationPipe`; índices `2dsphere`.
- `GET /pets` (lista), `GET /pets/mine` (do dono) e `GET /pets/feed?petId=`
  (delega ao motor de recomendação, com fallback no Mongo se ele cair).
- `POST /swipes` com persistência e **match recíproco** real (cria o `Match`).
- **Autorização de escrita**: editar/excluir pet exige ser o dono (`@OwnerId`);
  `POST /uploads` exige login. Leitura do feed/pets segue pública.
- `GET /matches` e chat (`GET`/`POST /matches/:matchId/messages`).
- **Autenticação JWT** (`/auth/register`, `/auth/login`, `/users/me`, bcrypt);
  a identidade anônima por `X-Owner-Id` segue funcionando para quem não loga.
- **Upload de imagens** (`POST /uploads`, servidas em `/uploads`).
- **Swagger** em `/docs` e configuração via `.env` (`ConfigModule`).

**Motor de recomendação (FastAPI)** — recall geográfico (`$geoNear`) + ranking de
conteúdo (scikit-learn); contratos Pydantic em camelCase.

**Frontend web (React + Vite)** — roteamento, onboarding, cadastro de pet (com
foto por **upload** e **geolocalização**), feed recomendado, swipe, match, lista
de **matches**, **chat**, **perfil** (conta + meus pets) e telas de login/cadastro.

**App mobile (Expo + React Native)** — navegação (abas + stack), sessão em
AsyncStorage e telas de descoberta, matches, chat, perfil e cadastros.

**Qualidade** — testes (Jest no backend, Pytest no motor, Vitest no web), lint
(ESLint no Node, Ruff/Black no Python), **CI** por serviço e **Dockerfiles** +
`docker compose --profile full`.

## Próximos passos

- **Tempo real no chat** (WebSocket/SSE) e **push notifications** de match/mensagem.
- **Armazenamento de imagens** externo (ex.: S3/GCS) no lugar do disco local.
- Vincular pets criados de forma anônima à conta após o login.
- Cache (Redis) para o feed e paginação infinita no deck.
- Observabilidade (logs estruturados, métricas) e pipeline de deploy.
- Segurança: `npm audit` aponta 1 item moderado transitivo (`js-yaml` via
  `@nestjs/swagger`), sem correção não-quebrante por ora e sem exposição prática.
