import { useState } from 'react';
import SwipePage from './pages/SwipePage';
import RegisterPetPage from './pages/RegisterPetPage';
import { setMyPet } from './lib/session';
import type { Pet } from './services/api';

// Marca, no navegador, que o usuário já passou pelo cadastro inicial.
const ONBOARDED_KEY = 'petmatch_onboarded';

/**
 * Componente raiz do app web.
 *
 * Na primeira visita abre o cadastro de pet em tela cheia (onboarding); o pet
 * cadastrado vira a origem das recomendações. Depois vai direto para o feed de
 * swipe, onde o cadastro reabre como overlay.
 */
export default function App() {
  const [onboarded, setOnboarded] = useState(() => Boolean(localStorage.getItem(ONBOARDED_KEY)));

  /** Marca o onboarding como concluído (cadastrou ou pulou). */
  function finish() {
    localStorage.setItem(ONBOARDED_KEY, '1');
    setOnboarded(true);
  }

  /** Cadastrou no onboarding: guarda o pet como origem e segue para o feed. */
  function handleDone(pet: Pet) {
    setMyPet(pet);
    finish();
  }

  if (!onboarded) {
    return <RegisterPetPage isOnboarding onDone={handleDone} onCancel={finish} />;
  }

  return <SwipePage />;
}
