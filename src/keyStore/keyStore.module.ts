import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KeyStoreService } from './keyStore.service';
import { DOCUMENT_NAME, KeyStoresSchema } from './schemas/keyStore.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DOCUMENT_NAME,
        schema: KeyStoresSchema,
      },
    ]),
  ],
  controllers: [],
  providers: [KeyStoreService],
  exports: [KeyStoreService],
})
export class KeyStoreModule {}
