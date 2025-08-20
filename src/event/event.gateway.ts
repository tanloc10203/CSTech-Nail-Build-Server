import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventService } from './event.service';
import { ActivitiesService } from '@src/activities/activities.service';
import { NotificationsService } from '@src/notifications/notifications.service';

@WebSocketGateway()
export class EventGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private eventService: EventService,
    private activityService: ActivitiesService,
    private notificationService: NotificationsService,
  ) {}

  afterInit(server: Server) {
    this.eventService.socket = server;
  }

  @SubscribeMessage('activities:get')
  async getActivities() {
    console.log('====================================');
    console.log(`get activities`);
    console.log('====================================');

    try {
      const response = await this.activityService.findAll();
      return response;
    } catch (error) {
      return [];
    }
  }

  @SubscribeMessage('notifications:get')
  async getNotifications(
    @MessageBody() { page, limit = 5 }: { page: number; limit?: number },
  ) {
    console.log('====================================');
    console.log(`get notifications`);
    console.log('====================================');

    try {
      const response = await this.notificationService.findAll(page, limit);
      return response;
    } catch (error) {
      return [];
    }
  }

  handleConnection(socket: Socket) {
    console.log('====================================');
    console.log(`Client connected: ${socket.id}`);
    console.log('====================================');
  }

  handleDisconnect(socket: Socket) {
    console.log('====================================');
    console.log(`Client disconnected: ${socket.id}`);
    console.log('====================================');
  }
}
