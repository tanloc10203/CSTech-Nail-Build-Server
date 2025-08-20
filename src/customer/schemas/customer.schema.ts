import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export const DOCUMENT_NAME = 'Customer';
const COLLECTION_NAME = 'Customers';

@Schema({ timestamps: true, collection: COLLECTION_NAME })
export class Customer extends mongoose.Document {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ default: null })
  email: string;

  @Prop({ default: null })
  phone: string;

  @Prop({ default: null })
  address: string;

  @Prop({ default: null })
  avatar: string;

  @Prop({ default: null })
  dob: Date;
}

export const CustomersSchema = SchemaFactory.createForClass(Customer);
