import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type MatchDocument = Match & Document;

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

@Schema({ _id: false })
export class MatchOwnerSummary {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  ownerId!: mongoose.Types.ObjectId;

  @Prop()
  name!: string;

  @Prop()
  avatarUrl!: string;
}

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

@Schema({ collection: 'matches', timestamps: true })
export class Match {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true })
  petAId!: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true })
  petBId!: mongoose.Types.ObjectId;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }],
    required: true,
    validate: {
      validator: (value: mongoose.Types.ObjectId[]) => Array.isArray(value) && value.length === 2,
      message: 'petIds must contain exactly two pet ObjectIds',
    },
  })
  petIds!: mongoose.Types.ObjectId[];

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

  @Prop()
  lastMessageAt?: Date;

  @Prop({ default: 'mutual_like', enum: ['mutual_like', 'recomendacao', 'curadoria'] })
  matchReason!: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: () => ({}) })
  meta!: Record<string, any>;

  @Prop({ type: MatchSummary, default: () => ({}) })
  summary!: MatchSummary;

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
MatchSchema.index({ petIds: 1 }, { unique: true });
MatchSchema.index({ ownerIds: 1 });
MatchSchema.index({ petAId: 1 });
MatchSchema.index({ petBId: 1 });
MatchSchema.index({ lastMessageAt: -1 });
export const MatchSummarySchema = SchemaFactory.createForClass(MatchSummary);
export const MatchParticipantSchema = SchemaFactory.createForClass(MatchParticipant);
export const MatchOwnerSummarySchema = SchemaFactory.createForClass(MatchOwnerSummary);
