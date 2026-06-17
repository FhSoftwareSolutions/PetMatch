/**
 * Cliente HTTP do app mobile para a API do PetMatch.
 *
 * A URL base vem de `EXPO_PUBLIC_API_BASE_URL` (defina o IP da sua máquina para
 * testar em um dispositivo físico) e cai para localhost em emulador/web.
 */
import { getOwnerId, getToken, setSession, type Account } from '../lib/session';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export type Gender = 'macho' | 'femea';
export type Size = 'pequeno' | 'medio' | 'grande';
export type Seeking = 'socializacao' | 'cruzamento' | 'ambos';

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  gender: Gender;
  ageMonths: number;
  size: Size;
  seeking: Seeking;
  bio?: string;
  mainPhotoUrl?: string;
  temperament: string[];
  recommendationTags: string[];
  city?: string;
  score?: number;
  distanceKm?: number;
  reasons?: string[];
}

export interface NewPet {
  name: string;
  species: string;
  breed?: string;
  gender: Gender;
  ageMonths: number;
  size: Size;
  seeking: Seeking;
  bio?: string;
  city?: string;
}

export interface MatchPet {
  petId: string;
  name?: string;
  species?: string;
  mainPhotoUrl?: string;
}
export interface MatchOwner {
  ownerId: string;
}
export interface Match {
  id: string;
  petIds: string[];
  ownerIds: string[];
  status: string;
  lastMessageAt?: string;
  summary: { petA: MatchPet; petB: MatchPet; ownerA: MatchOwner; ownerB: MatchOwner };
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  recipientId: string;
  text: string;
  read: boolean;
  createdAt?: string;
}

export type SwipeType = 'like' | 'dislike';
export interface SwipeResult {
  matched: boolean;
  matchId?: string;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'X-Owner-Id': getOwnerId() };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function jsonHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', ...authHeaders() };
}

async function errorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.message) return Array.isArray(body.message) ? body.message.join(', ') : body.message;
  } catch {
    /* sem JSON */
  }
  return `HTTP ${res.status}`;
}

// ---- Pets ----
export async function fetchPets(): Promise<Pet[]> {
  const res = await fetch(`${API_BASE_URL}/pets`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Não foi possível carregar os pets (HTTP ${res.status}).`);
  return res.json();
}

export async function fetchFeed(petId: string): Promise<Pet[]> {
  const res = await fetch(`${API_BASE_URL}/pets/feed?petId=${encodeURIComponent(petId)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Não foi possível carregar o feed (HTTP ${res.status}).`);
  return res.json();
}

export async function fetchMyPets(): Promise<Pet[]> {
  const res = await fetch(`${API_BASE_URL}/pets/mine`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Não foi possível carregar seus pets (HTTP ${res.status}).`);
  return res.json();
}

export async function createPet(input: NewPet): Promise<Pet> {
  const res = await fetch(`${API_BASE_URL}/pets`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Falha ao cadastrar o pet: ${await errorDetail(res)}`);
  return res.json();
}

export async function deletePet(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/pets/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Não foi possível excluir o pet (HTTP ${res.status}).`);
}

// ---- Swipes ----
export async function recordSwipe(
  petId: string,
  targetPetId: string,
  type: SwipeType,
): Promise<SwipeResult> {
  const res = await fetch(`${API_BASE_URL}/swipes`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ petId, targetPetId, type }),
  });
  if (!res.ok) throw new Error(`Não foi possível registrar o swipe (HTTP ${res.status}).`);
  return res.json();
}

// ---- Auth ----
interface AuthResponse {
  accessToken: string;
  user: Account;
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  city?: string;
}): Promise<Account> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Falha no cadastro: ${await errorDetail(res)}`);
  const data: AuthResponse = await res.json();
  await setSession(data.accessToken, data.user);
  return data.user;
}

export async function login(input: { email: string; password: string }): Promise<Account> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Falha no login: ${await errorDetail(res)}`);
  const data: AuthResponse = await res.json();
  await setSession(data.accessToken, data.user);
  return data.user;
}

// ---- Matches & chat ----
export async function fetchMatches(): Promise<Match[]> {
  const res = await fetch(`${API_BASE_URL}/matches`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Não foi possível carregar seus matches (HTTP ${res.status}).`);
  return res.json();
}

export async function fetchMessages(matchId: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE_URL}/matches/${encodeURIComponent(matchId)}/messages`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Não foi possível carregar a conversa (HTTP ${res.status}).`);
  return res.json();
}

export async function sendMessage(matchId: string, text: string): Promise<Message> {
  const res = await fetch(`${API_BASE_URL}/matches/${encodeURIComponent(matchId)}/messages`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Não foi possível enviar a mensagem (HTTP ${res.status}).`);
  return res.json();
}
