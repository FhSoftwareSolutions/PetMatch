import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type PetDocument = Pet & Document;

@Schema({ _id: false })
export class PetLocation {
  @Prop({ required: true, enum: ['Point'] })
  type!: string;

  @Prop({
    required: true,
    type: [Number],
    validate: {
      validator: (value: number[]) => Array.isArray(value) && value.length === 2,
      message: 'location.coordinates must be [lng, lat]',
    },
  })
  coordinates!: number[];
}

@Schema({ collection: 'pets', timestamps: true })
export class Pet {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  ownerId!: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  species!: string;

  @Prop()
  breed?: string;

  @Prop({ required: true, enum: ['Macho', 'Fêmea'] })
  gender!: string;

  @Prop({ required: true })
  birthDate!: Date;

  @Prop({ required: true, enum: ['Pequeno', 'Médio', 'Grande'] })
  size!: string;

  @Prop({ required: true, enum: ['Socialização', 'Cruzamento'] })
  purpose!: string;

  @Prop({ type: [String], default: [] })
  photos!: string[];

  @Prop()
  mainPhotoUrl?: string;

  @Prop()
  bio?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: () => ({}) })
  characteristics!: Record<string, any>;

  @Prop({ required: true, enum: ['Baixa', 'Média', 'Alta'] })
  energyLevel!: string;

  @Prop({ default: true })
  sociableWithOtherPets!: boolean;

  @Prop({ default: false })
  castrated!: boolean;

  @Prop({ default: false })
  vaccinesUpToDate!: boolean;

  @Prop({ type: PetLocation, required: true })
  location!: PetLocation;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: 'available', enum: ['available', 'hidden', 'adopted'] })
  status!: string;

  @Prop({ type: [String], default: [] })
  recommendationTags!: string[];

  @Prop({ type: mongoose.Schema.Types.Mixed, default: () => ({}) })
  metadata!: Record<string, any>;

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const PetSchema = SchemaFactory.createForClass(Pet);
PetSchema.index({ location: '2dsphere' });
PetSchema.index({ ownerId: 1 });
PetSchema.index({ purpose: 1 });
PetSchema.index({ status: 1 });
PetSchema.index({ species: 1 });
PetSchema.index({ location: '2dsphere', purpose: 1, status: 1 });
export const PetLocationSchema = SchemaFactory.createForClass(PetLocation);
