import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/** Tipo do documento Mongoose de User (classe + métodos do Document). */
export type UserDocument = User & Document;

/** Preferências de notificação e idioma do usuário (subdocumento). */
@Schema()
export class UserPreferences {
  @Prop({ default: true })
  notifyNewMatch!: boolean;

  @Prop({ default: true })
  notifyNewMessage!: boolean;

  @Prop({ default: 'pt-BR' })
  language!: string;
}

/** Dados públicos de perfil do usuário (subdocumento, sem _id próprio). */
@Schema({ _id: false })
export class UserProfile {
  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  bio?: string;
}

/**
 * Dono de pet (usuário da plataforma).
 *
 * `timestamps: true` cria e mantém `createdAt`/`updatedAt` automaticamente —
 * por isso eles não são declarados como @Prop aqui.
 */
@Schema({
  collection: 'users',
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret._id?.toString?.() ?? ret._id;
      delete ret._id;
      delete ret.passwordHash; // nunca expor o hash da senha
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true })
  name!: string;

  // unique:true já cria o índice único; não é preciso declarar index() de novo.
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  // Guardamos apenas o hash da senha, nunca a senha em texto puro.
  @Prop({ required: true })
  passwordHash!: string;

  // sparse: permite vários usuários sem telefone sem violar o índice único.
  @Prop({ unique: true, sparse: true })
  phone?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ default: 'user', enum: ['user', 'admin'] })
  role!: string;

  // Subdocumentos embutidos; default: () => ({}) garante o objeto preenchido.
  @Prop({ type: UserPreferences, default: () => ({}) })
  preferences!: UserPreferences;

  @Prop({ type: UserProfile, default: () => ({}) })
  profile!: UserProfile;
}

export const UserSchema = SchemaFactory.createForClass(User);
