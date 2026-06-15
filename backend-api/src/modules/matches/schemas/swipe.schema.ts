import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type SwipeDocument = Swipe & Document;

@Schema({ collection: 'swipes', timestamps: true })
export class Swipe {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true })
  petId!: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true })
  targetPetId!: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  ownerId!: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: ['like', 'dislike'] })
  type!: string;

  @Prop({ default: 'feed' })
  context!: string;

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const SwipeSchema = SchemaFactory.createForClass(Swipe);
SwipeSchema.index({ petId: 1, targetPetId: 1 }, { unique: true });
SwipeSchema.index({ ownerId: 1, createdAt: -1 });
