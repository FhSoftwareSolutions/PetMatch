import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

/** Tipo do documento Mongoose de Swipe (classe + métodos do Document). */
export type SwipeDocument = Swipe & Document;

/**
 * Registro de um swipe (like/dislike) de um pet sobre outro.
 *
 * É a fonte que o recommendation-engine lê para NÃO recomendar de novo um pet
 * já avaliado. `timestamps: true` gerencia `createdAt`/`updatedAt`.
 */
@Schema({ collection: 'swipes', timestamps: true })
export class Swipe {
  // Pet que fez o swipe (quem avalia).
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true })
  petId!: mongoose.Types.ObjectId;

  // Pet avaliado (alvo do swipe).
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true })
  targetPetId!: mongoose.Types.ObjectId;

  // Dono que executou a ação (redundante com o dono de petId, mas evita um join).
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  ownerId!: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: ['like', 'dislike'] })
  type!: string;

  // Onde o swipe aconteceu (ex.: 'feed'), para futura análise/telemetria.
  @Prop({ default: 'feed' })
  context!: string;
}

export const SwipeSchema = SchemaFactory.createForClass(Swipe);

// Índices.
// - (petId, targetPetId) único: garante um swipe por par avaliador/alvo.
// - (ownerId, createdAt): histórico de swipes de um dono, do mais recente.
SwipeSchema.index({ petId: 1, targetPetId: 1 }, { unique: true });
SwipeSchema.index({ ownerId: 1, createdAt: -1 });
