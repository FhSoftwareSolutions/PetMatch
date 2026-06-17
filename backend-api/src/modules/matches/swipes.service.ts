import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateSwipeDto } from './dto/create-swipe.dto';
import { Swipe, SwipeDocument } from './schemas/swipe.schema';
import { MatchesService } from './matches.service';

/** Resultado de registrar um swipe. */
export interface SwipeResult {
  // true quando este like fecha um match recíproco (o alvo já havia curtido a
  // origem). Nesse caso o documento Match é criado e seu id volta em matchId.
  matched: boolean;
  matchId?: string;
}

@Injectable()
export class SwipesService {
  constructor(
    @InjectModel(Swipe.name) private readonly swipeModel: Model<SwipeDocument>,
    private readonly matchesService: MatchesService,
  ) {}

  /**
   * Registra (idempotente) um swipe like/dislike do pet de origem sobre um alvo.
   *
   * O índice único (petId, targetPetId) garante um swipe por par avaliador/alvo;
   * reavaliar o mesmo alvo apenas atualiza o `type`. A partir daqui o
   * recommendation-engine para de recomendar o alvo (ele lê `db.swipes` pelo
   * `petId` de origem), então o feed deixa de repetir pets já vistos.
   */
  async record(dto: CreateSwipeDto, ownerId: Types.ObjectId): Promise<SwipeResult> {
    const petId = new Types.ObjectId(dto.petId);
    const targetPetId = new Types.ObjectId(dto.targetPetId);

    await this.swipeModel.updateOne(
      { petId, targetPetId },
      { $set: { type: dto.type, ownerId }, $setOnInsert: { context: 'feed' } },
      { upsert: true },
    );

    // Match recíproco: só em likes e quando o alvo já tinha curtido a origem.
    if (dto.type !== 'like') return { matched: false };
    const reciprocal = await this.swipeModel.exists({
      petId: targetPetId,
      targetPetId: petId,
      type: 'like',
    });
    if (!reciprocal) return { matched: false };

    const match = await this.matchesService.ensureFromReciprocalLike(petId, targetPetId);
    return { matched: true, matchId: match?.id };
  }
}
