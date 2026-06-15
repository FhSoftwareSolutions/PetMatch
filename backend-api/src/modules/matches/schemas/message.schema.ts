import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ _id: false })
export class MessageAttachment {
  @Prop({ required: true })
  url!: string;

  @Prop({ required: true })
  type!: string;
}

@Schema({ collection: 'messages', timestamps: true })
export class Message {
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

  @Prop({ default: false })
  read!: boolean;

  @Prop({ default: 'text', enum: ['text', 'image', 'sticker'] })
  type!: string;

  @Prop({ default: () => ({}) })
  metadata!: Record<string, any>;

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ matchId: 1, createdAt: 1 });
MessageSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
export const MessageAttachmentSchema = SchemaFactory.createForClass(MessageAttachment);
