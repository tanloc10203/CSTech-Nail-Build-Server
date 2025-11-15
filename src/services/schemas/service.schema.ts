import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export const DOCUMENT_NAME = 'Service';
const COLLECTION_NAME = 'Services';

@Schema({ timestamps: true, collection: COLLECTION_NAME })
export class Service extends mongoose.Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ type: Number, default: 0 })
  initTurn: number;

  // @Prop({ type: Number, default: 0 })
  // order: number;
}

export const ServicesSchema = SchemaFactory.createForClass(Service);
