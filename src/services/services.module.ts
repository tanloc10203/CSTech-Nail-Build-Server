import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DOCUMENT_NAME, ServicesSchema } from './schemas/service.schema';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { EventModule } from '@src/event/event.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DOCUMENT_NAME,
        schema: ServicesSchema,
      },
    ]),
    EventModule,
  ],
  providers: [ServicesService],
  controllers: [ServicesController],
  exports: [ServicesService],
})
export class ServicesModule {}
