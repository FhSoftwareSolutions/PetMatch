/**
 * "Meu pet" = o pet do usuário, usado como ORIGEM das recomendações.
 *
 * Sem autenticação ainda, guardamos no localStorage o pet cadastrado mais
 * recente; o feed pede ao backend as recomendações para ele.
 */

import type { Pet } from '../services/api';

const MY_PET_KEY = 'petmatch_my_pet';
const OWNER_ID_KEY = 'petmatch_owner_id';

export interface MyPet {
  id: string;
  name: string;
}

/** Gera um id no formato ObjectId (24 hex) com a Web Crypto API. */
function randomOwnerId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Identidade estável do usuário neste navegador (enquanto não há login).
 *
 * Um ObjectId de 24 hex gerado e persistido na primeira chamada; vai no header
 * `X-Owner-Id` de toda escrita, virando o `ownerId` dos pets e swipes. Some se o
 * usuário limpar o storage — sem recuperação até existir conta de verdade.
 */
export function getMyOwnerId(): string {
  try {
    const existing = localStorage.getItem(OWNER_ID_KEY);
    if (existing) return existing;
    const id = randomOwnerId();
    localStorage.setItem(OWNER_ID_KEY, id);
    return id;
  } catch {
    // localStorage indisponível (modo privado/SSR): id efêmero por chamada.
    return randomOwnerId();
  }
}

/** Lê o pet ativo do usuário (ou null se ainda não cadastrou). */
export function getMyPet(): MyPet | null {
  try {
    const raw = localStorage.getItem(MY_PET_KEY);
    return raw ? (JSON.parse(raw) as MyPet) : null;
  } catch {
    return null;
  }
}

/** Define o pet ativo do usuário (origem das recomendações). */
export function setMyPet(pet: Pet): void {
  localStorage.setItem(MY_PET_KEY, JSON.stringify({ id: pet.id, name: pet.name }));
}
