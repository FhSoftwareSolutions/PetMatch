import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateSwipeDto } from './dto/create-swipe.dto';
import { Swipe, SwipeDocument } from './schemas/swipe.schema';

/** Resultado de registrar um swipe. */
export interface SwipeResult {
  // Se este like fechou um match recíproco. Sempre false na Etapa 1 (a detecção
  // de reciprocidade + criação do Match entram na Etapa 2).
  matched: boolean;
}

@Injectable()
export class SwipesService {
  constructor(
    @InjectModel(Swipe.name) private readonly swipeModel: Model<SwipeDocument>,
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
    await this.swipeModel.updateOne(
      {
        petId: new Types.ObjectId(dto.petId),
        targetPetId: new Types.ObjectId(dto.targetPetId),
      },
      { $set: { type: dto.type, ownerId }, $setOnInsert: { context: 'feed' } },
      { upsert: true },
    );
    return { matched: false };
  }
}
