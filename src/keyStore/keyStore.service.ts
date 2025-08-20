import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { KeyStore } from './schemas/keyStore.schema';
import mongoose from 'mongoose';

@Injectable()
export class KeyStoreService {
  constructor(
    @InjectModel(KeyStore.name)
    private readonly keyStoreModel: mongoose.Model<KeyStore>,
  ) {}

  async createKeyToken({ userId, publicKey, privateKey, refreshToken }) {
    const filter = { user: userId },
      update = {
        publicKey,
        privateKey,
        refreshTokensUsed: [],
        refreshToken,
      },
      options = { upsert: true, new: true };

    const tokens = await this.keyStoreModel.findOneAndUpdate(
      filter,
      update,
      options,
    );

    return tokens;
  }

  async findByUserId(userId: string) {
    return await this.keyStoreModel.findOne({ user: userId }).exec();
  }

  async deleteKeyByUserId(userId: string) {
    return await this.keyStoreModel.findOneAndDelete({ user: userId });
  }
}
