# PetMatch — Frontend Web (React + Vite + TypeScript)

Frontend web do PetMatch: a tela de **descoberta** ("Tinder para pets"), onde o
usuário desliza cards de animais (swipe) e dá *match*, além do **cadastro de pet**.
É o frontend web canônico do projeto (ver o README na raiz do repositório).

> Estado atual: consome a **API NestJS** (`backend-api`) — lista os pets em
> `GET /pets` e cadastra em `POST /pets`, com fotos reais. É preciso ter o
> backend e o MongoDB no ar (o jeito mais fácil é `npm run dev` na raiz). A
> integração com o `recommendation-engine` para ordenar o feed é um próximo passo.

## Como rodar

Precisa do backend + MongoDB no ar — veja o README da raiz, ou rode `npm run dev`
na raiz para subir tudo de uma vez. Para rodar só o frontend:

```bash
npm install            # só na primeira vez
cp .env.example .env   # opcional: ajusta a URL da API
npm run dev            # http://localhost:5173
```

Build de produção:

```bash
npm run build    # type-check (tsc -b) + bundle do Vite em dist/
npm run preview  # serve o build localmente
```

## Estrutura

```
web-app/
├─ index.html              # HTML raiz do Vite (carrega as fontes)
├─ .env.example            # VITE_API_BASE_URL / VITE_AI_ENGINE_BASE_URL
└─ src/
   ├─ main.tsx             # ponto de entrada (monta o React em #root)
   ├─ App.tsx              # raiz: onboarding (1ª vez) + feed de swipe
   ├─ index.css            # estilos globais + tokens de cor
   ├─ vite-env.d.ts        # tipagem das variáveis de ambiente
   ├─ pages/
   │  ├─ SwipePage.tsx     # feed de swipe (busca os pets na API)
   │  └─ RegisterPetPage.tsx  # formulário de cadastro de pet
   ├─ components/
   │  ├─ PetCard.tsx       # card + foto real (fallback emoji) + swipe
   │  ├─ ActionBar.tsx     # botões curtir/passar/voltar
   │  └─ MatchModal.tsx    # tela de "É um Match!"
   ├─ lib/
   │  ├─ display.ts        # helpers de exibição (emoji, idade, gradiente)
   │  └─ options.ts        # opções dos selects do formulário
   └─ services/
      └─ api.ts            # cliente HTTP (fetchPets / createPet) + tipos
```

## O que já funciona

- Onboarding: na 1ª visita abre o cadastro; depois vai direto para o swipe
- Cadastro de pet (botão **+ Cadastrar pet**) gravando no banco via API
- Feed de swipe com **fotos reais** (fallback de emoji se a foto falhar)
- Swipe por arrasto (mouse/toque) e botões, carimbos, voltar, recomeçar e match
- Layout responsivo (foco mobile) e suporte a `prefers-reduced-motion`

## Próximos passos

- [ ] Ordenar o feed pelo `recommendation-engine` (geo + conteúdo)
- [ ] Autenticação/perfil do tutor (hoje os pets usam um dono "demo")
- [ ] Roteamento (`react-router-dom`) e chat após o match
- [ ] Lint/format (ESLint + Prettier) e testes (Vitest + Testing Library)
