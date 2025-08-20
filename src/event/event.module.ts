import { forwardRef, Module } from '@nestjs/common';
import { EventGateway } from './event.gateway';
import { EventService } from './event.service';
import { ActivitiesModule } from '@src/activities/activities.module';
import { NotificationsModule } from '@src/notifications/notifications.module';

@Module({
  imports: [forwardRef(() => ActivitiesModule), NotificationsModule],
  providers: [EventGateway, EventService],
  exports: [EventService],
})
export class EventModule {}
