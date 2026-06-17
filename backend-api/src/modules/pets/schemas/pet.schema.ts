import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

/** Tipo do documento Mongoose de Pet (classe + métodos do Document). */
export type PetDocument = Pet & Document;

/** Localização do pet em GeoJSON Point (subdocumento). */
@Schema({ _id: false })
export class PetLocation {
  @Prop({ required: true, enum: ['Point'], default: 'Point' })
  type!: string;

  // Ordem GeoJSON: [longitude, latitude].
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

/**
 * Perfil do pet — base do feed de recomendação.
 *
 * Os enums em português (minúsculos, sem acento) são o contrato compartilhado
 * com o motor de recomendação (Python) e os frontends:
 * - gender:  macho | femea
 * - size:    pequeno | medio | grande
 * - seeking: socializacao (brincar) | cruzamento | ambos
 * - status:  available (visível) | hidden | adopted
 *
 * `timestamps: true` gerencia `createdAt`/`updatedAt` automaticamente. O
 * `toJSON` expõe `id` (string) no lugar de `_id`/`__v`, alinhado ao que os
 * frontends esperam.
 */
@Schema({
  collection: 'pets',
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret._id?.toString?.() ?? ret._id;
      delete ret._id;
      return ret;
    },
  },
})
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
  photos!: string[];

  @Prop()
  mainPhotoUrl?: string;

  @Prop()
  bio?: string;

  // Cidade escolhida no cadastro (deriva `location`); útil no card do feed.
  @Prop()
  city?: string;

  @Prop({ type: [String], default: [] })
  temperament!: string[];

  // Flags de convivência (ex.: { goodWithDogs, goodWithCats, goodWithKids }).
  @Prop({ type: mongoose.Schema.Types.Mixed, default: () => ({}) })
  compatibility!: Record<string, any>;

  // Tags livres usadas pelo recommendation-engine para enriquecer o ranking.
  @Prop({ type: [String], default: [] })
  recommendationTags!: string[];

  @Prop({ type: PetLocation, required: true })
  location!: PetLocation;

  @Prop({ default: true })
  active!: boolean;

  @Prop({ default: 'available', enum: ['available', 'hidden', 'adopted'] })
  status!: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: () => ({}) })
  metadata!: Record<string, any>;
}

export const PetSchema = SchemaFactory.createForClass(Pet);

// Índices.
// - 2dsphere em `location`: busca por proximidade ($geoNear / $nearSphere).
// - composto {location, seeking, status}: otimiza o recall do motor (geo +
//   objetivo + disponibilidade). Como há DOIS índices 2dsphere, o engine passa
//   `key: "location"` no $geoNear para desambiguar.
PetSchema.index({ location: '2dsphere' });
PetSchema.index({ ownerId: 1 });
PetSchema.index({ seeking: 1 });
PetSchema.index({ status: 1 });
PetSchema.index({ species: 1 });
PetSchema.index({ location: '2dsphere', seeking: 1, status: 1 });
