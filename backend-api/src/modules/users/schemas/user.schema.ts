import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class UserPreferences {
  @Prop({ default: true })
  notifyNewMatch!: boolean;

  @Prop({ default: true })
  notifyNewMessage!: boolean;

  @Prop({ default: 'pt-BR' })
  language!: string;
}

@Schema({ _id: false })
export class UserProfile {
  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  bio?: string;
}

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ unique: true, sparse: true })
  phone?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ default: 'user', enum: ['user', 'admin'] })
  role!: string;

  @Prop({ type: UserPreferences, default: () => ({}) })
  preferences!: UserPreferences;

  @Prop({ type: UserProfile, default: () => ({}) })
  profile!: UserProfile;

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
export const UserPreferencesSchema = SchemaFactory.createForClass(UserPreferences);
export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);
