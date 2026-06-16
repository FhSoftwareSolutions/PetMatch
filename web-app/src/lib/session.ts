/**
 * "Meu pet" = o pet do usuário, usado como ORIGEM das recomendações.
 *
 * Sem autenticação ainda, guardamos no localStorage o pet cadastrado mais
 * recente; o feed pede ao backend as recomendações para ele.
 */

import type { Pet } from '../services/api';

const MY_PET_KEY = 'petmatch_my_pet';

export interface MyPet {
  id: string;
  name: string;
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
