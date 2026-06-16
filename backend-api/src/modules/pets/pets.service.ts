import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { coordsForCity, DEFAULT_CITY } from '../../common/cities';
import { CreatePetDto } from './dto/create-pet.dto';
import { DEMO_OWNER_ID, FEED_RADIUS_KM } from './pets.constants';
import { Pet, PetDocument } from './schemas/pet.schema';

// URL do motor de recomendação (mesmo default do .env.example do engine).
const AI_ENGINE_URL = process.env.AI_ENGINE_URL ?? 'http://localhost:8000';

/** Forma "limpa" do pet devolvida pela API. */
export interface PetResponse {
  id: string;
  name: string;
  species: string;
  breed?: string;
  gender: string;
  ageMonths: number;
  size: string;
  seeking: string;
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

/** Item retornado pelo recommendation-engine (camelCase). */
interface EngineCandidate {
  petId: string;
  score: number;
  distanceKm: number;
  reasons: string[];
}

@Injectable()
export class PetsService {
  private readonly logger = new Logger(PetsService.name);

  constructor(@InjectModel(Pet.name) private readonly petModel: Model<PetDocument>) {}

  /** Lista simples dos pets disponíveis (mais recentes primeiro). */
  async findFeed(limit = 100): Promise<PetResponse[]> {
    const pets = await this.petModel
      .find({ status: 'available', active: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
    return pets.map(toPetResponse);
  }

  /**
   * Feed ORDENADO pelo recommendation-engine, para o pet de origem (`petId`).
   *
   * Pede ao motor os candidatos ranqueados (score + motivos), e completa cada um
   * com os dados que o motor não devolve (bio, temperamento, cidade) buscando o
   * documento no Mongo. Se a origem for inválida ou o motor estiver fora do ar,
   * cai para o feed simples — o app continua funcionando, só sem o score.
   */
  async findRecommendedFeed(petId: string): Promise<PetResponse[]> {
    let origin: any = null;
    try {
      origin = await this.petModel.findById(petId).lean().exec();
    } catch {
      origin = null; // id malformado
    }
    if (!origin) {
      return this.findFeed();
    }

    try {
      const candidates = await this.fetchRecommendations(origin);
      if (!candidates.length) return [];

      // Busca os documentos completos e remonta na ordem do motor.
      const ids = candidates.map((c) => c.petId);
      const docs = await this.petModel.find({ _id: { $in: ids } }).lean().exec();
      const byId = new Map(docs.map((d) => [String(d._id), d]));

      const out: PetResponse[] = [];
      for (const candidate of candidates) {
        const doc = byId.get(candidate.petId);
        if (!doc) continue;
        out.push({
          ...toPetResponse(doc),
          score: candidate.score,
          distanceKm: candidate.distanceKm,
          reasons: candidate.reasons,
        });
      }
      return out;
    } catch (err) {
      this.logger.warn(
        `Motor de recomendação indisponível (${String(err)}); usando feed simples.`,
      );
      const fallback = await this.findFeed();
      return fallback.filter((p) => p.id !== String(origin._id));
    }
  }

  /** Cadastra um novo pet, atribuído ao dono informado (cai no demo se ausente). */
  async create(dto: CreatePetDto, ownerId: Types.ObjectId = DEMO_OWNER_ID): Promise<PetResponse> {
    const city = dto.city ?? DEFAULT_CITY;
    const created = await this.petModel.create({
      name: dto.name,
      species: dto.species,
      breed: dto.breed,
      gender: dto.gender,
      ageMonths: dto.ageMonths,
      size: dto.size,
      seeking: dto.seeking,
      bio: dto.bio,
      mainPhotoUrl: dto.mainPhotoUrl,
      photos: dto.mainPhotoUrl ? [dto.mainPhotoUrl] : [],
      temperament: dto.temperament ?? [],
      ownerId,
      // location é obrigatório no schema; derivamos da cidade escolhida.
      location: { type: 'Point', coordinates: coordsForCity(city) },
      status: 'available',
      active: true,
      metadata: { city, seed: false },
    });
    return toPetResponse(created.toObject());
  }

  /** Chama o recommendation-engine (POST /recommendations) para o pet de origem. */
  private async fetchRecommendations(origin: any): Promise<EngineCandidate[]> {
    const res = await fetch(`${AI_ENGINE_URL}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        petId: String(origin._id),
        coordinates: origin.location?.coordinates,
        radiusKm: FEED_RADIUS_KM,
        limit: 100,
      }),
    });
    if (!res.ok) {
      throw new Error(`engine respondeu HTTP ${res.status}`);
    }
    const data = await res.json();
    return (data.results ?? []) as EngineCandidate[];
  }
}

/** Converte um documento Pet (lean/objeto) na resposta pública da API. */
function toPetResponse(pet: any): PetResponse {
  return {
    id: String(pet._id),
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    gender: pet.gender,
    ageMonths: pet.ageMonths,
    size: pet.size,
    seeking: pet.seeking,
    bio: pet.bio,
    mainPhotoUrl: pet.mainPhotoUrl,
    temperament: pet.temperament ?? [],
    recommendationTags: pet.recommendationTags ?? [],
    city: pet.metadata?.city,
  };
}
