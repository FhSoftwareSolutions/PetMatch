import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

/** Tipo do documento Mongoose de Message (classe + métodos do Document). */
export type MessageDocument = Message & Document;

/** Anexo de uma mensagem (imagem, sticker, etc.). */
@Schema({ _id: false })
export class MessageAttachment {
  @Prop({ required: true })
  url!: string;

  @Prop({ required: true })
  type!: string;
}

/**
 * Mensagem de chat trocada dentro de um match.
 *
 * `timestamps: true` gerencia `createdAt`/`updatedAt` (usados para ordenar a
 * conversa e listar não lidas).
 */
@Schema({ collection: 'messages', timestamps: true })
export class Message {
  // Match (conversa) ao qual a mensagem pertence.
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true })
  matchId!: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  senderId!: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  recipientId!: mongoose.Types.ObjectId;

  @Prop({ required: true })
  text!: string;

  @Prop({ type: [MessageAttachment], default: [] })
  attachments!: MessageAttachment[];

  // Marca de leitura para destacar conversas com mensagens novas.
  @Prop({ default: false })
  read!: boolean;

  @Prop({ default: 'text', enum: ['text', 'image', 'sticker'] })
  type!: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: () => ({}) })
  metadata!: Record<string, any>;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Índices.
// - (matchId, createdAt): lê uma conversa em ordem cronológica.
// - (recipientId, read, createdAt): conta/lista mensagens não lidas por usuário.
// - (senderId, createdAt): mensagens enviadas por um usuário.
MessageSchema.index({ matchId: 1, createdAt: 1 });
MessageSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
