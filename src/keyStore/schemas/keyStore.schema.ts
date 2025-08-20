import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from '@src/user/schemas/user.schema';
import mongoose from 'mongoose';

export const DOCUMENT_NAME = 'KeyStore';
const COLLECTION_NAME = 'KeyStores';

@Schema({ timestamps: true, collection: COLLECTION_NAME })
export class KeyStore extends mongoose.Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' })
  user: User;

  @Prop({ required: true })
  publicKey: string;

  @Prop({ required: true })
  privateKey: string;

  @Prop()
  refreshToken: string;

  @Prop({ default: [] })
  refreshTokensUsed: string[];
}

export const KeyStoresSchema = SchemaFactory.createForClass(KeyStore);
