import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { EventModule } from '@src/event/event.module';

@Module({
  imports: [EventModule],
  providers: [TaskService],
})
export class TaskModule {}
