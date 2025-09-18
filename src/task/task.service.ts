import { showMessageNoti } from '@app/utils/notifier';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventService } from '@src/event/event.service';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private eventService: EventService) {}

  // // Cron job: chạy mỗi 10 giây
  // @Cron('*/10 * * * * *') // biểu thức cron
  // handleCron() {
  //   this.logger.debug('Cron job chạy mỗi 10 giây!');
  //   void this.eventService.revalidateActivity();
  //   void this.eventService.revalidateGetUserCheckin();
  // }

  // Dùng cron expression có sẵn (mỗi ngày lúc 0h05p giờ đêm)
  @Cron('5 0 * * *')
  handleMidnight() {
    this.logger.debug('Chạy lúc 0h05p mỗi ngày');
    showMessageNoti('Đang refresh dữ liệu ngày mới');
    void this.eventService.revalidateActivity(true);
    void this.eventService.revalidateGetUserCheckin(true);
  }

  // // Interval: chạy lặp lại mỗi 5 giây
  // @Interval(5000)
  // handleInterval() {
  //   this.logger.debug('Interval job chạy mỗi 5 giây');
  // }

  // // Timeout: chạy 1 lần sau 15 giây
  // @Timeout(15000)
  // handleTimeout() {
  //   this.logger.debug('Timeout job chạy sau 15 giây kể từ khi start app');
  // }
}
