# 🐾 PetMatch — Frontend (React + Vite)

"Tinder para pets": deslize cards de animais e dê *match* com o futuro melhor amigo.
Versão React + Vite, componentizada e pronta pra evoluir.

## 🚀 Rodando localmente

Precisa do **Node.js** instalado (https://nodejs.org — versão LTS).

```bash
npm install      # instala as dependências (só na primeira vez)
npm run dev      # sobe o servidor de desenvolvimento
```

Abra o endereço que aparecer no terminal (geralmente http://localhost:5173).

Para gerar a versão de produção:
```bash
npm run build    # gera a pasta dist/
npm run preview  # testa o build localmente
```

## 🧩 Estrutura

```
frontend/
├─ index.html              # HTML raiz do Vite
├─ package.json
├─ vite.config.js
└─ src/
   ├─ main.jsx             # ponto de entrada
   ├─ App.jsx              # orquestra deck, histórico e match
   ├─ index.css            # estilos + tokens de cor
   ├─ data/pets.js         # lista de pets (mock)
   └─ components/
      ├─ PetCard.jsx       # card individual + lógica de swipe
      ├─ ActionBar.jsx     # botões curtir/passar/voltar
      └─ MatchModal.jsx    # tela de match
```

## ✅ O que já funciona

- Swipe por arrasto (mouse e toque) e pelos botões
- Carimbos "Adotar" / "Passar"
- Botão voltar (rewind), recomeçar e tela de match
- Layout responsivo (foco mobile) e `prefers-reduced-motion`

## 🗺️ Próximos passos

- [ ] Trocar emojis por fotos reais
- [ ] Puxar pets de uma API/Supabase em vez do mock
- [ ] Login e perfil do adotante
- [ ] Chat com o tutor após o match
- [ ] Filtros (espécie, porte, distância)
