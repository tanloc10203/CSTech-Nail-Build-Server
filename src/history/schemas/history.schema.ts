import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export const DOCUMENT_NAME = 'History';
const COLLECTION_NAME = 'Histories';

export enum HistoryStatus {
  Pending = 'pending',
  Finished = 'finished',
}

export enum Turns {
  Free = 0,
  Half = 0.5,
  One = 1,
  OneHalf = 1.5,
  Two = 2,
}

@Schema({ timestamps: true, collection: COLLECTION_NAME })
export class History extends mongoose.Document {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
  })
  service: mongoose.Types.ObjectId;

  @Prop({ default: 'pending', enum: Object.values(HistoryStatus) })
  status: HistoryStatus;

  @Prop({ type: Date, required: true })
  startedAt: Date;

  @Prop({ type: Date, default: null })
  finishedAt: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
  })
  customer: mongoose.Types.ObjectId;

  @Prop({ required: true, type: Number })
  turn: number;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  employee: mongoose.Types.ObjectId;

  @Prop({ type: Date })
  date: Date;
}

export const HistoriesSchema = SchemaFactory.createForClass(History);
