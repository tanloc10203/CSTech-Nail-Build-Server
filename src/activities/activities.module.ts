import { forwardRef, Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivitiesSchema, DOCUMENT_NAME } from './schemas/activities.schema';
import { NotificationsModule } from '@src/notifications/notifications.module';
import { UserModule } from '@src/user/user.module';
import { EventModule } from '@src/event/event.module';
import { HistoryModule } from '@src/history/history.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DOCUMENT_NAME,
        schema: ActivitiesSchema,
      },
    ]),
    NotificationsModule,
    forwardRef(() => UserModule),
    EventModule,
    forwardRef(() => HistoryModule),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
