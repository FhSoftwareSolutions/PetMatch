import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';

import { Match, MatchDocument } from './schemas/match.schema';
import { Pet, PetDocument } from '../pets/schemas/pet.schema';

@Injectable()
export class MatchesService {
  constructor(
    @InjectModel(Match.name) private readonly matchModel: Model<MatchDocument>,
    @InjectModel(Pet.name) private readonly petModel: Model<PetDocument>,
  ) {}

  /**
   * Cria (idempotente) o Match de um like recíproco entre dois pets.
   *
   * A `pairKey` (ids ordenados) garante um único documento por par, então
   * reprocessar o mesmo par não duplica. Retorna null se algum pet não existir.
   */
  async ensureFromReciprocalLike(
    petXId: Types.ObjectId,
    petYId: Types.ObjectId,
  ): Promise<MatchDocument | null> {
    // Ordem canônica para a pairKey ser estável (independe de quem curtiu antes).
    const [a, b] = [petXId, petYId].sort((x, y) => x.toString().localeCompare(y.toString()));
    const pairKey = `${a.toString()}_${b.toString()}`;

    const pets = await this.petModel.find({ _id: { $in: [a, b] } }).exec();
    const petA = pets.find((p) => (p._id as Types.ObjectId).equals(a));
    const petB = pets.find((p) => (p._id as Types.ObjectId).equals(b));
    if (!petA || !petB) return null;

    const summary = {
      petA: { petId: petA._id, name: petA.name, species: petA.species, mainPhotoUrl: petA.mainPhotoUrl },
      petB: { petId: petB._id, name: petB.name, species: petB.species, mainPhotoUrl: petB.mainPhotoUrl },
      ownerA: { ownerId: petA.ownerId },
      ownerB: { ownerId: petB.ownerId },
    };

    await this.matchModel.updateOne(
      { pairKey },
      {
        $setOnInsert: {
          pairKey,
          petAId: a,
          petBId: b,
          petIds: [a, b],
          ownerIds: [petA.ownerId, petB.ownerId],
          status: 'active',
          matchReason: 'mutual_like',
          summary,
        },
      },
      { upsert: true },
    );

    return this.matchModel.findOne({ pairKey }).exec();
  }

  /** Lista os matches de um dono, dos mais recentes (por última mensagem) para os mais antigos. */
  async listForOwner(ownerId: Types.ObjectId): Promise<MatchDocument[]> {
    return this.matchModel
      .find({ ownerIds: ownerId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .exec();
  }

  /** Carrega um match garantindo que o dono participa dele (autorização do chat). */
  async getForOwner(matchId: string, ownerId: Types.ObjectId): Promise<MatchDocument> {
    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      throw new BadRequestException('ID do match inválido');
    }
    const match = await this.matchModel.findById(matchId).exec();
    if (!match || !match.ownerIds.some((id) => id.equals(ownerId))) {
      throw new NotFoundException('Match não encontrado');
    }
    return match;
  }
}
