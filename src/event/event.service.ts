import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ActivitiesService } from '@src/activities/activities.service';
import { NotificationsService } from '@src/notifications/notifications.service';
import { Server } from 'socket.io';

@Injectable()
export class EventService {
  public socket: Server;

  constructor(
    @Inject(forwardRef(() => ActivitiesService))
    private activityService: ActivitiesService,
    private notificationService: NotificationsService,
  ) {}

  async pushNotificationToAdmin() {
    let results = [];

    try {
      const response = await this.notificationService.findAll(1, 10);
      results = response;
    } catch (error) {}

    this.socket.emit('notifications:get', results);
  }

  async getActivities() {
    let results = [];

    try {
      const response = await this.activityService.findAll();
      results = response;
    } catch (error) {}

    this.socket.emit('activities:get', results);
  }

  revalidateActivity(refresh?: boolean) {
    this.socket.emit('activities:revalidate', refresh);
  }

  revalidateGetUserCheckin(refresh?: boolean) {
    this.socket.emit('employee:revalidate', refresh);
  }
}
