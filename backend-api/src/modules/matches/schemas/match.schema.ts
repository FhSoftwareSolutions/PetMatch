import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

/** Tipo do documento Mongoose de Match (classe + métodos do Document). */
export type MatchDocument = Match & Document;

/** Resumo desnormalizado de um pet participante do match (para a lista de matches). */
@Schema({ _id: false })
export class MatchParticipant {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true })
  petId!: mongoose.Types.ObjectId;

  @Prop()
  name!: string;

  @Prop()
  species!: string;

  @Prop()
  mainPhotoUrl!: string;
}

/** Resumo desnormalizado de um dono participante do match. */
@Schema({ _id: false })
export class MatchOwnerSummary {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  ownerId!: mongoose.Types.ObjectId;

  @Prop()
  name!: string;

  @Prop()
  avatarUrl!: string;
}

/**
 * Snapshot dos dois pets e dos dois donos no momento do match.
 *
 * É uma cópia (desnormalização) propositada: deixa a tela de "meus matches"
 * rápida, sem precisar fazer join/populate de Pet e User a cada listagem.
 */
@Schema({ _id: false })
export class MatchSummary {
  @Prop({ type: MatchParticipant, required: true })
  petA!: MatchParticipant;

  @Prop({ type: MatchParticipant, required: true })
  petB!: MatchParticipant;

  @Prop({ type: MatchOwnerSummary, required: true })
  ownerA!: MatchOwnerSummary;

  @Prop({ type: MatchOwnerSummary, required: true })
  ownerB!: MatchOwnerSummary;
}

/**
 * Match entre dois pets (e, por consequência, seus donos).
 *
 * Os participantes aparecem em duas formas, mantidas em sincronia:
 * - `petAId`/`petBId`: acesso direto a cada pet por lado;
 * - `petIds`/`ownerIds` (arrays de 2): consulta canônica "todos os matches de
 *   um pet/dono" via um único índice, sem depender de qual lado (A ou B) o pet
 *   ocupa. Os donos correspondentes ficam em `ownerIds` (mesma ordem) e no
 *   snapshot `summary`.
 *
 * `timestamps: true` gerencia `createdAt`/`updatedAt` automaticamente.
 */
@Schema({ collection: 'matches', timestamps: true })
export class Match {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true })
  petAId!: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true })
  petBId!: mongoose.Types.ObjectId;

  // Os dois pets do match (exatamente 2). É o caminho de consulta canônico.
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }],
    required: true,
    validate: {
      validator: (value: mongoose.Types.ObjectId[]) => Array.isArray(value) && value.length === 2,
      message: 'petIds must contain exactly two pet ObjectIds',
    },
  })
  petIds!: mongoose.Types.ObjectId[];

  // Os dois donos do match (exatamente 2), espelhando a ordem de petIds.
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    required: true,
    validate: {
      validator: (value: mongoose.Types.ObjectId[]) => Array.isArray(value) && value.length === 2,
      message: 'ownerIds must contain exactly two user ObjectIds',
    },
  })
  ownerIds!: mongoose.Types.ObjectId[];

  @Prop({ default: 'active', enum: ['active', 'closed', 'cancelled'] })
  status!: string;

  // Atualizado a cada mensagem; usado para ordenar a lista de conversas.
  @Prop()
  lastMessageAt?: Date;

  // Origem do match: like mútuo, recomendação do motor ou curadoria manual.
  @Prop({ default: 'mutual_like', enum: ['mutual_like', 'recomendacao', 'curadoria'] })
  matchReason!: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: () => ({}) })
  meta!: Record<string, any>;

  @Prop({ type: MatchSummary, default: () => ({}) })
  summary!: MatchSummary;
}

export const MatchSchema = SchemaFactory.createForClass(Match);

// Índices.
// - petIds único: impede matches duplicados e é o caminho canônico de busca.
// - ownerIds: lista os matches de um dono.
// - petAId/petBId: acesso direto por lado específico do par.
// - lastMessageAt: ordena as conversas da mais recente para a mais antiga.
MatchSchema.index({ petIds: 1 }, { unique: true });
MatchSchema.index({ ownerIds: 1 });
MatchSchema.index({ petAId: 1 });
MatchSchema.index({ petBId: 1 });
MatchSchema.index({ lastMessageAt: -1 });
