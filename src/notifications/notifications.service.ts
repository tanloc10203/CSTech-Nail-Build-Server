import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Notification, NotiTypes } from './schemas/notifications.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly NotificationModel: mongoose.Model<Notification>,
  ) {}

  async create(createNotificationDto: {
    notiType: NotiTypes;
    notiContent: string;
    notiOptions?: object;
    isMarked?: boolean;
  }) {
    return await this.NotificationModel.create(createNotificationDto);
  }

  async findAll(page: number, limit = 5) {
    if (page < 1) {
      page = 1;
    }

    return await this.NotificationModel.find()
      .sort({ createdAt: -1 })
      .skip(limit * (page - 1))
      .limit(limit);
  }
}
