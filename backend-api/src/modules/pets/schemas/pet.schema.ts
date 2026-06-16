import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type PetDocument = Pet & Document;

@Schema({ _id: false })
export class PetHealth {
  @Prop({ default: false })
  neutered!: boolean;

  @Prop({ default: false })
  vaccinated!: boolean;

  @Prop({ default: false })
  specialNeeds!: boolean;
}

@Schema({ _id: false })
export class PetCompatibility {
  @Prop({ default: false })
  goodWithDogs!: boolean;

  @Prop({ default: false })
  goodWithCats!: boolean;

  @Prop({ default: false })
  goodWithKids!: boolean;
}

@Schema({ _id: false })
export class PetLocation {
  @Prop({ required: true, enum: ['Point'] })
  type!: string;

  @Prop({ required: true, type: [Number], validate: {
    validator: (value: number[]) => Array.isArray(value) && value.length === 2,
    message: 'location.coordinates must be [lng, lat]'
  }})
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

  @Prop({ required: true, enum: ['macho', 'femea'] })
  gender!: string;

  @Prop({ required: true, min: 0 })
  ageMonths!: number;

  @Prop({ required: true, enum: ['pequeno', 'medio', 'grande'] })
  size!: string;

  @Prop({ required: true, enum: ['socializacao', 'cruzamento', 'ambos'] })
  seeking!: string;

  @Prop({ type: [String], default: [] })
  temperament!: string[];

  @Prop({ type: PetHealth, default: () => ({}) })
  health!: PetHealth;

  @Prop({ type: PetCompatibility, default: () => ({}) })
  compatibility!: PetCompatibility;

  @Prop({ type: [String], default: [] })
  photos!: string[];

  @Prop()
  mainPhotoUrl?: string;

  @Prop()
  bio?: string;

  @Prop({ type: PetLocation, required: true })
  location!: PetLocation;

  @Prop({ default: true })
  active!: boolean;

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
PetSchema.index({ seeking: 1 });
PetSchema.index({ status: 1 });
PetSchema.index({ species: 1 });
PetSchema.index({ location: '2dsphere', seeking: 1, status: 1 });
export const PetHealthSchema = SchemaFactory.createForClass(PetHealth);
export const PetCompatibilitySchema = SchemaFactory.createForClass(PetCompatibility);
export const PetLocationSchema = SchemaFactory.createForClass(PetLocation);
