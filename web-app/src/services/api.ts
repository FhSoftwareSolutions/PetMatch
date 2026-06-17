/**
 * Cliente HTTP do frontend para a API do PetMatch.
 *
 * As URLs vêm de variáveis de ambiente (`VITE_*`, ver `.env.example`) e caem
 * para os endereços locais padrão quando não definidas.
 */

import { getMyOwnerId, getToken, setSession, type Account } from '../lib/session';

/** URL base da API NestJS (backend-api). */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/** URL base do motor de recomendação (recommendation-engine). */
export const AI_ENGINE_BASE_URL =
  import.meta.env.VITE_AI_ENGINE_BASE_URL ?? 'http://localhost:8000';

export type Gender = 'macho' | 'femea';
export type Size = 'pequeno' | 'medio' | 'grande';
export type Seeking = 'socializacao' | 'cruzamento' | 'ambos';

/** Pet como devolvido pela API (`GET /pets`). */
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
  // Preenchidos só no feed recomendado (GET /pets/feed):
  score?: number;
  distanceKm?: number;
  reasons?: string[];
}

/** Campos enviados pelo formulário de cadastro (`POST /pets`). */
export interface NewPet {
  name: string;
  species: string;
  breed?: string;
  gender: Gender;
  ageMonths: number;
  size: Size;
  seeking: Seeking;
  bio?: string;
  mainPhotoUrl?: string;
  temperament?: string[];
  city?: string;
  // GeoJSON [lng, lat] capturado do dispositivo (opcional; senão deriva da city).
  location?: { type: 'Point'; coordinates: [number, number] };
}

/** Cabeçalhos de identidade: ownerId anônimo + Bearer quando logado. */
function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'X-Owner-Id': getMyOwnerId() };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Cabeçalhos de uma escrita JSON identificada. */
function jsonHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', ...authHeaders() };
}

/** Extrai a mensagem de erro do corpo (o Nest devolve { message }). */
async function errorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join(', ') : body.message;
    }
  } catch {
    /* corpo sem JSON */
  }
  return `HTTP ${res.status}`;
}

// ===================== Pets =====================

/** Lista simples dos pets disponíveis (sem ordenação por recomendação). */
export async function fetchPets(): Promise<Pet[]> {
  const res = await fetch(`${API_BASE_URL}/pets`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Não foi possível carregar os pets (HTTP ${res.status}).`);
  return res.json();
}

/** Feed ordenado pelo recommendation-engine para o pet de origem (`petId`). */
export async function fetchFeed(petId: string): Promise<Pet[]> {
  const res = await fetch(`${API_BASE_URL}/pets/feed?petId=${encodeURIComponent(petId)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Não foi possível carregar o feed (HTTP ${res.status}).`);
  return res.json();
}

/** Pets do dono atual (`GET /pets/mine`). */
export async function fetchMyPets(): Promise<Pet[]> {
  const res = await fetch(`${API_BASE_URL}/pets/mine`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Não foi possível carregar seus pets (HTTP ${res.status}).`);
  return res.json();
}

/** Cadastra um novo pet e devolve o registro criado. */
export async function createPet(input: NewPet): Promise<Pet> {
  const res = await fetch(`${API_BASE_URL}/pets`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Falha ao cadastrar o pet: ${await errorDetail(res)}`);
  return res.json();
}

/** Remove um pet do dono. */
export async function deletePet(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/pets/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Não foi possível excluir o pet (HTTP ${res.status}).`);
}

// ===================== Swipes =====================

export type SwipeType = 'like' | 'dislike';

/** Resultado de registrar um swipe. `matched` indica reciprocidade real. */
export interface SwipeResult {
  matched: boolean;
  matchId?: string;
}

/** Registra um like/dislike do meu pet (origem) sobre outro pet (alvo). */
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

// ===================== Auth =====================

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  city?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  user: Account;
}

/** Cria a conta, guarda a sessão e devolve a conta. */
export async function registerAccount(input: RegisterInput): Promise<Account> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Falha no cadastro: ${await errorDetail(res)}`);
  const data: AuthResponse = await res.json();
  setSession(data.accessToken, data.user);
  return data.user;
}

/** Autentica, guarda a sessão e devolve a conta. */
export async function login(input: LoginInput): Promise<Account> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Falha no login: ${await errorDetail(res)}`);
  const data: AuthResponse = await res.json();
  setSession(data.accessToken, data.user);
  return data.user;
}

// ===================== Matches & Chat =====================

export interface MatchPet {
  petId: string;
  name?: string;
  species?: string;
  mainPhotoUrl?: string;
}

export interface MatchOwner {
  ownerId: string;
  name?: string;
  avatarUrl?: string;
}

export interface Match {
  id: string;
  petIds: string[];
  ownerIds: string[];
  status: string;
  lastMessageAt?: string;
  createdAt?: string;
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

/** Lista os matches do dono atual. */
export async function fetchMatches(): Promise<Match[]> {
  const res = await fetch(`${API_BASE_URL}/matches`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Não foi possível carregar seus matches (HTTP ${res.status}).`);
  return res.json();
}

/** Mensagens de um match, em ordem cronológica. */
export async function fetchMessages(matchId: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE_URL}/matches/${encodeURIComponent(matchId)}/messages`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Não foi possível carregar a conversa (HTTP ${res.status}).`);
  return res.json();
}

/** Envia uma mensagem em um match. */
export async function sendMessage(matchId: string, text: string): Promise<Message> {
  const res = await fetch(`${API_BASE_URL}/matches/${encodeURIComponent(matchId)}/messages`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Não foi possível enviar a mensagem (HTTP ${res.status}).`);
  return res.json();
}
