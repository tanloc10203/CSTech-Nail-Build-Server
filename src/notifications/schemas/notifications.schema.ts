import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export const DOCUMENT_NAME = 'Notification';
const COLLECTION_NAME = 'Notifications';

export enum NotiTypes {
  CheckInSuccess = 'CheckInSuccess',
  CheckOutSuccess = 'CheckOutSuccess',
  StartedTurningOver = 'StartedActivity',
  FinishedActivity = 'FinishedActivity',
  EditedActivity = 'EditedActivity',
}

@Schema({ timestamps: true, collection: COLLECTION_NAME })
export class Notification extends mongoose.Document {
  @Prop({ type: String, enum: Object.values(NotiTypes) })
  notiType: NotiTypes;

  @Prop({ type: String, required: true })
  notiContent: string;

  @Prop({ type: Object, default: {} })
  notiOptions: object;

  @Prop({ type: Boolean, default: false })
  isMarked: boolean;
}

export const NotificationsSchema = SchemaFactory.createForClass(Notification);
