/**
 * Sessão do usuário no navegador.
 *
 * Sem login: usamos um ownerId estável (X-Owner-Id) por navegador.
 * Com login: guardamos o token JWT + a conta; o backend passa a preferir o
 * usuário autenticado. Também guardamos o "meu pet" (origem das recomendações).
 */

import type { Pet } from '../services/api';

const MY_PET_KEY = 'petmatch_my_pet';
const OWNER_ID_KEY = 'petmatch_owner_id';
const TOKEN_KEY = 'petmatch_token';
const ACCOUNT_KEY = 'petmatch_account';

export interface MyPet {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
  email: string;
}

/** Gera um id no formato ObjectId (24 hex) com a Web Crypto API. */
function randomOwnerId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Identidade anônima estável deste navegador (enquanto não há login). */
export function getMyOwnerId(): string {
  try {
    const existing = localStorage.getItem(OWNER_ID_KEY);
    if (existing) return existing;
    const id = randomOwnerId();
    localStorage.setItem(OWNER_ID_KEY, id);
    return id;
  } catch {
    return randomOwnerId();
  }
}

/** Token JWT atual (ou null se anônimo). */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Conta logada (ou null). */
export function getAccount(): Account | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as Account) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}

/** Dono "efetivo" da requisição: a conta logada ou o id anônimo do navegador. */
export function currentOwnerId(): string {
  return getAccount()?.id ?? getMyOwnerId();
}

/** Salva a sessão após register/login. */
export function setSession(accessToken: string, account: Account): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
}

/** Encerra a sessão (mantém o "meu pet" e o id anônimo). */
export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ACCOUNT_KEY);
}

/** Lê o pet ativo do usuário (origem das recomendações). */
export function getMyPet(): MyPet | null {
  try {
    const raw = localStorage.getItem(MY_PET_KEY);
    return raw ? (JSON.parse(raw) as MyPet) : null;
  } catch {
    return null;
  }
}

/** Define o pet ativo do usuário. */
export function setMyPet(pet: Pet): void {
  localStorage.setItem(MY_PET_KEY, JSON.stringify({ id: pet.id, name: pet.name }));
}

/** Limpa o pet ativo (ex.: ao excluí-lo). */
export function clearMyPet(): void {
  localStorage.removeItem(MY_PET_KEY);
}
