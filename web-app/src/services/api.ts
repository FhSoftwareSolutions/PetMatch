/**
 * Cliente HTTP do frontend para a API do PetMatch.
 *
 * As URLs vêm de variáveis de ambiente (`VITE_*`, ver `.env.example`) e caem
 * para os endereços locais padrão quando não definidas.
 */

import { getMyOwnerId } from '../lib/session';

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
}

/** Lista simples dos pets disponíveis (sem ordenação por recomendação). */
export async function fetchPets(): Promise<Pet[]> {
  const res = await fetch(`${API_BASE_URL}/pets`);
  if (!res.ok) {
    throw new Error(`Não foi possível carregar os pets (HTTP ${res.status}).`);
  }
  return res.json();
}

/**
 * Feed ordenado pelo recommendation-engine para o pet de origem (`petId`),
 * com score de match e motivos em cada pet.
 */
export async function fetchFeed(petId: string): Promise<Pet[]> {
  const res = await fetch(`${API_BASE_URL}/pets/feed?petId=${encodeURIComponent(petId)}`);
  if (!res.ok) {
    throw new Error(`Não foi possível carregar o feed (HTTP ${res.status}).`);
  }
  return res.json();
}

/** Cabeçalhos de uma escrita identificada pelo ownerId estável do navegador. */
function writeHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json', 'X-Owner-Id': getMyOwnerId() };
}

/** Cadastra um novo pet e devolve o registro criado. */
export async function createPet(input: NewPet): Promise<Pet> {
  const res = await fetch(`${API_BASE_URL}/pets`, {
    method: 'POST',
    headers: writeHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    // O Nest devolve { message } (string ou lista) nos erros de validação.
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) {
        detail = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      }
    } catch {
      /* corpo sem JSON — mantém o detalhe padrão */
    }
    throw new Error(`Falha ao cadastrar o pet: ${detail}`);
  }
  return res.json();
}

export type SwipeType = 'like' | 'dislike';

/** Resultado de registrar um swipe. `matched` refletirá reciprocidade real na Etapa 2. */
export interface SwipeResult {
  matched: boolean;
}

/**
 * Registra um like/dislike do meu pet (origem) sobre outro pet (alvo).
 *
 * Persistir o swipe faz o feed recomendado parar de repetir pets já avaliados
 * (o recommendation-engine lê os swipes da origem para excluí-los).
 */
export async function recordSwipe(
  petId: string,
  targetPetId: string,
  type: SwipeType,
): Promise<SwipeResult> {
  const res = await fetch(`${API_BASE_URL}/swipes`, {
    method: 'POST',
    headers: writeHeaders(),
    body: JSON.stringify({ petId, targetPetId, type }),
  });
  if (!res.ok) {
    throw new Error(`Não foi possível registrar o swipe (HTTP ${res.status}).`);
  }
  return res.json();
}
