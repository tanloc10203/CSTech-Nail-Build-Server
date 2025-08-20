import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { DOCUMENT_NAME, HistoriesSchema } from './schemas/history.schema';
import { UserModule } from '@src/user/user.module';
import { EventModule } from '@src/event/event.module';
import { NotificationsModule } from '@src/notifications/notifications.module';
import { ActivitiesModule } from '@src/activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DOCUMENT_NAME,
        schema: HistoriesSchema,
      },
    ]),
    forwardRef(() => UserModule),
    EventModule,
    NotificationsModule,
    forwardRef(() => ActivitiesModule),
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
