import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import moment from 'moment';
import mongoose from 'mongoose';

export const DOCUMENT_NAME = 'Activity';
const COLLECTION_NAME = 'Activities';

export enum ActivityType {
  CheckIn = 'check_in',
  CheckOut = 'check_out',
}

@Schema({ timestamps: true, collection: COLLECTION_NAME })
export class Activity extends mongoose.Document {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  activeDate: string;

  @Prop({ type: Date, required: true })
  checkedInAt: Date;

  @Prop({ type: Date, default: null })
  checkedOutAt: Date;

  @Prop({ type: Number, required: true })
  order: number;

  @Prop({ type: Number, default: 0 })
  oldOrder: number;

  @Prop({ type: Number, default: 0 })
  firstOrder: number;

  @Prop({ type: Number, default: 0 })
  totalTurn: number;

  @Prop({ type: Number, default: 0 })
  checkedInOrder: number;

  @Prop({ type: Boolean, default: false })
  isLate: boolean;

  @Prop({ type: Boolean, default: false })
  isFirstTurn: boolean;
  
  @Prop({
    type: String,
    default: ActivityType.CheckIn,
    enum: Object.values(ActivityType),
  })
  type: ActivityType;
}

export const ActivitiesSchema = SchemaFactory.createForClass(Activity);
