import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';

import { Pet, PetDocument } from './schemas/pet.schema';
import { Swipe } from '../matches/schemas/swipe.schema';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { coordsForCity } from '../../common/cities';
import { FEED_DEFAULT_LIMIT, FEED_RADIUS_KM, SEEKING_COMPAT } from './pets.constants';

// URL do motor de recomendação (Python). Configurável por ambiente.
const AI_ENGINE_URL = process.env.AI_ENGINE_URL ?? 'http://127.0.0.1:8000';
const ENGINE_TIMEOUT_MS = 5000;

/**
 * Regras de negócio dos pets: o CRUD persistido no MongoDB (via Mongoose) e o
 * feed recomendado. As escritas (update/remove) passam por `assertOwnership`,
 * garantindo que só o dono altere o próprio pet.
 */
@Injectable()
export class PetsService {
  constructor(
    @InjectModel(Pet.name) private readonly petModel: Model<PetDocument>,
    @InjectModel(Swipe.name) private readonly swipeModel: Model<Swipe>,
  ) {}

  /**
   * Cria um pet. O `ownerId` vem do header (resolvido no controller) e a
   * `location` é derivada da `city` quando não enviada explicitamente.
   */
  async create(dto: CreatePetDto, ownerId: Types.ObjectId): Promise<PetDocument> {
    try {
      const location = dto.location ?? { type: 'Point', coordinates: coordsForCity(dto.city) };
      const created = new this.petModel({
        ...dto,
        ownerId,
        location,
        photos: dto.mainPhotoUrl ? [dto.mainPhotoUrl] : [],
        metadata: dto.city ? { city: dto.city } : {},
      });
      return await created.save();
    } catch (error: any) {
      throw new BadRequestException(`Erro ao criar pet: ${error.message}`);
    }
  }

  /** Lista simples de pets disponíveis (sem ordenação por recomendação). */
  async findAllAvailable(limit = 60): Promise<PetDocument[]> {
    return this.petModel
      .find({ active: true, status: 'available' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /** Lista os pets do dono (autenticado ou identificado por X-Owner-Id). */
  async findMine(ownerId: Types.ObjectId): Promise<PetDocument[]> {
    return this.petModel.find({ ownerId }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<PetDocument> {
    this.assertObjectId(id);
    const pet = await this.petModel.findById(id).exec();
    if (!pet) throw new NotFoundException(`Pet com ID ${id} não encontrado`);
    return pet;
  }

  async update(id: string, dto: UpdatePetDto, ownerId: Types.ObjectId): Promise<PetDocument> {
    await this.assertOwnership(id, ownerId);
    const updated = await this.petModel.findByIdAndUpdate(id, { ...dto }, { new: true }).exec();
    if (!updated) throw new NotFoundException(`Pet com ID ${id} não encontrado`);
    return updated;
  }

  async remove(id: string, ownerId: Types.ObjectId): Promise<PetDocument> {
    await this.assertOwnership(id, ownerId);
    const deleted = await this.petModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException(`Pet com ID ${id} não encontrado`);
    return deleted;
  }

  /** Garante que o pet existe e pertence ao dono (autorização de escrita). */
  private async assertOwnership(id: string, ownerId: Types.ObjectId): Promise<PetDocument> {
    this.assertObjectId(id);
    const pet = await this.petModel.findById(id).exec();
    if (!pet) throw new NotFoundException(`Pet com ID ${id} não encontrado`);
    if (!(pet.ownerId as Types.ObjectId).equals(ownerId)) {
      throw new ForbiddenException('Você não é o dono deste pet.');
    }
    return pet;
  }

  /**
   * Feed recomendado para o pet de origem. Delega a ordenação ao
   * recommendation-engine (geo + conteúdo). Se o motor estiver indisponível,
   * cai para um modo degradado consultando o Mongo direto (sem score).
   */
  async getFeed(petId: string, limit = FEED_DEFAULT_LIMIT): Promise<Record<string, any>[]> {
    this.assertObjectId(petId);
    const origin = await this.petModel.findById(petId).exec();
    if (!origin) throw new NotFoundException(`Pet com ID ${petId} não encontrado`);

    try {
      return await this.fetchFeedFromEngine(origin, limit);
    } catch {
      // Motor fora do ar / erro de rede: feed degradado direto do banco.
      return this.fallbackFeedFromDb(origin, limit);
    }
  }

  /** Chama o recommendation-engine e mapeia os candidatos para o shape do front. */
  private async fetchFeedFromEngine(
    origin: PetDocument,
    limit: number,
  ): Promise<Record<string, any>[]> {
    const originId = origin._id as Types.ObjectId;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ENGINE_TIMEOUT_MS);
    let response: any;
    try {
      response = await fetch(`${AI_ENGINE_URL}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: originId.toString(),
          coordinates: origin.location.coordinates,
          radiusKm: FEED_RADIUS_KM,
          limit,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    if (!response.ok) {
      throw new Error(`recommendation-engine respondeu HTTP ${response.status}`);
    }
    const data: any = await response.json();
    return (data.results ?? []).map((r: any) => ({
      id: r.petId,
      name: r.name,
      species: r.species,
      breed: r.breed ?? undefined,
      gender: r.gender,
      ageMonths: r.ageMonths,
      size: r.size,
      seeking: r.seeking,
      bio: r.bio ?? undefined,
      city: r.city ?? undefined,
      mainPhotoUrl: r.mainPhotoUrl ?? undefined,
      temperament: r.temperament ?? [],
      recommendationTags: r.recommendationTags ?? [],
      score: r.score,
      distanceKm: r.distanceKm,
      reasons: r.reasons ?? [],
    }));
  }

  /** Modo degradado: recall simples no Mongo (mesmos filtros rígidos do motor). */
  private async fallbackFeedFromDb(
    origin: PetDocument,
    limit: number,
  ): Promise<Record<string, any>[]> {
    const originId = origin._id as Types.ObjectId;
    const swipes = await this.swipeModel.find({ petId: originId }).select('targetPetId').exec();
    const excludeIds = [originId, ...swipes.map((s: any) => s.targetPetId)];

    const query: any = {
      active: true,
      status: 'available',
      _id: { $nin: excludeIds },
      ownerId: { $ne: origin.ownerId },
      seeking: { $in: SEEKING_COMPAT[origin.seeking] ?? SEEKING_COMPAT.ambos },
    };

    if (origin.seeking === 'cruzamento') {
      if (origin.species) query.species = origin.species;
      if (origin.gender) query.gender = { $ne: origin.gender };
    }

    // Consulta geoespacial nativa do MongoDB: `$nearSphere` traz os pets dentro
    // de um raio (em metros) do pet de origem, JÁ ordenados do mais próximo ao
    // mais distante. Depende do índice 2dsphere em `location` (ver pet.schema).
    if (origin.location?.coordinates) {
      query.location = {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: origin.location.coordinates },
          $maxDistance: FEED_RADIUS_KM * 1000,
        },
      };
    }

    const pets = await this.petModel.find(query).limit(limit).exec();
    return pets.map((p) => p.toJSON());
  }

  private assertObjectId(id: string): void {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID do pet inválido');
    }
  }
}
