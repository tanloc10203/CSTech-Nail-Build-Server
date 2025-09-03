import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ActivitiesService } from '@src/activities/activities.service';
import { EventService } from '@src/event/event.service';
import { NotificationsService } from '@src/notifications/notifications.service';
import { NotiTypes } from '@src/notifications/schemas/notifications.schema';
import { UserService } from '@src/user/user.service';
import * as moment from 'moment';
import mongoose from 'mongoose';
import { CreateHistoryDto } from './dto/create-history.dto';
import { DoneHistoryDto } from './dto/done-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { History, HistoryStatus } from './schemas/history.schema';

@Injectable()
export class HistoryService {
  constructor(
    @InjectModel(History.name)
    private readonly historyModel: mongoose.Model<History>,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly eventService: EventService,
    @Inject(forwardRef(() => ActivitiesService))
    private readonly activityService: ActivitiesService,
  ) {}

  async create(createHistoryDto: CreateHistoryDto) {
    const currentDate = moment().format('DD/MM/YYYY HH:mm:ss');

    // Check employee exist &&& Check turn booked finished ?
    const [foundEmployee, isPending] = await Promise.all([
      this.userService.findById(createHistoryDto.employee),
      this.historyModel.findOne({
        date: moment().format('YYYY-MM-DD'),
        employee: createHistoryDto.employee,
        finishedAt: null,
        status: HistoryStatus.Pending,
      }),
    ]);

    if (!foundEmployee) {
      throw new NotFoundException('Employee not found!');
    }

    if (isPending) {
      throw new ConflictException('Employee turn is pending!');
    }

    // 1. Create a new history
    const history = new this.historyModel({
      ...createHistoryDto,
      startedAt: moment().toDate(),
      date: moment().format('YYYY-MM-DD'),
    });

    // 2. Create notification
    await Promise.all([
      history.save(),
      this.notificationsService.create({
        notiContent: `Booked successfully. Employee ${foundEmployee.firstName} ${foundEmployee.lastName} started turning at ${currentDate}`,
        notiType: NotiTypes.StartedTurningOver,
      }),
      this.activityService.incrementTurn(
        createHistoryDto.employee,
        createHistoryDto.turn,
      ),
    ]);

    await this.activityService.sortOrder(createHistoryDto.employee);

    // 3. Push notification to admin
    await Promise.all([
      this.eventService.pushNotificationToAdmin(),
      this.eventService.getActivities(),
    ]);

    // 4. Push event to activities

    return history;
  }

  async done(doneHistoryDto: DoneHistoryDto) {
    // find history by id
    const [history, employee] = await Promise.all([
      this.historyModel.findById(doneHistoryDto.historyId),
      this.userService.findById(doneHistoryDto.employee),
    ]);

    // throw new NotFoundException('Maintain!');

    if (!employee) {
      throw new NotFoundException('Employee not found!');
    }

    if (!history) {
      throw new NotFoundException('History not found!');
    }

    if (history.status === HistoryStatus.Finished) {
      throw new ConflictException('History is finished!');
    }

    history.finishedAt = moment().toDate();
    history.status = HistoryStatus.Finished;

    // update history
    const [result] = await Promise.all([
      history.save(),
      this.notificationsService.create({
        notiContent: `Booked successfully. Employee ${employee.firstName} ${employee.lastName} finished turning at ${moment().format('DD/MM/YYYY HH:mm:ss')}`,
        notiType: NotiTypes.FinishedActivity,
      }),
      this.activityService.sortOrder(doneHistoryDto.employee),
    ]);

    // 2. Create notification

    // 3. Push notification to admin

    // 4. Push event to activities
    await Promise.all([
      this.eventService.pushNotificationToAdmin(),
      this.eventService.getActivities(),
    ]);

    // create notification
    return result;
  }

  async checkout(id: string) {
    return 'OIK';
  }

  findAll() {
    return `This action returns all history`;
  }

  findOne(id: number) {
    return `This action returns a #${id} history`;
  }

  async update(id: string, updateHistoryDto: UpdateHistoryDto) {
    // 1. Find history by id
    const [history, employee, activity] = await Promise.all([
      this.historyModel.findById(updateHistoryDto.historyId),
      this.userService.findById(updateHistoryDto.employee),
      this.activityService.findById(updateHistoryDto.activityId),
    ]);

    if (!activity) {
      throw new NotFoundException('Activity not found!');
    }

    if (!employee) {
      throw new NotFoundException('Employee not found!');
    }

    if (!history) {
      throw new NotFoundException('History not found!');
    }

    let isChanged = false;

    // 2. Check oldTurn and newTurn edit
    if (history.turn !== updateHistoryDto.turn) {
      isChanged = true;

      // 2.1 Update total turn
      const prevTurn = activity.totalTurn - updateHistoryDto.oldTurn;
      const newTotalTurn = prevTurn + updateHistoryDto.turn;

      activity.totalTurn = newTotalTurn;

      history.turn = updateHistoryDto.turn;

      await activity.save();
    }

    // 3. Check service
    if (history.service.toString() !== updateHistoryDto.service) {
      isChanged = true;
      history.service = new mongoose.Types.ObjectId(updateHistoryDto.service);
    }

    if (isChanged) {
      await history.save();

      // 4. Create notification
      await this.notificationsService.create({
        notiContent: `Booked successfully. Employee ${employee.firstName} ${employee.lastName} changed activity at ${moment().format('DD/MM/YYYY HH:mm:ss')}`,
        notiType: NotiTypes.EditedActivity,
      });

      // 5. Push notification to admin
      await this.eventService.pushNotificationToAdmin();

      // 6. Push event to activities
      await this.eventService.getActivities();
    }

    return 'OK';
  }

  async remove(id: string) {
    return `This action removes a #${id} history`;
  }

  async findByUser(userId: string): Promise<History[]> {
    const response = await this.historyModel
      .find({ employee: userId, date: moment().format('YYYY-MM-DD') })
      .populate('service')
      .sort({ startedAt: -1 })
      .lean();

    return response as History[];
  }

  async deleteByUserId(userId: string) {
    return this.historyModel.deleteMany({ employee: userId });
  }

  async removeByUser(userId: string) {
    await this.historyModel.deleteMany({ employee: userId });
  }
}
