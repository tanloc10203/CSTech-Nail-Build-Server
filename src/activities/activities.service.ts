import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventService } from '@src/event/event.service';
import { HistoryService } from '@src/history/history.service';
import { NotificationsService } from '@src/notifications/notifications.service';
import { NotiTypes } from '@src/notifications/schemas/notifications.schema';
import { UserService } from '@src/user/user.service';
import * as moment from 'moment';
import mongoose from 'mongoose';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { Activity, ActivityType } from './schemas/activities.schema';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name)
    private readonly activityModel: mongoose.Model<Activity>,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly eventService: EventService,
    @Inject(forwardRef(() => HistoryService))
    private readonly historyService: HistoryService,
  ) {}

  async create(createActivityDto: CreateActivityDto) {
    const currentDate = moment().format('YYYY-MM-DD');

    // 1. Check user check-in exist & find last order & find user by id
    const [userCheckIn, lastOrder, user] = await Promise.all([
      this.activityModel.findOne({
        user: createActivityDto.user,
        activeDate: currentDate,
      }),
      this.activityModel
        .findOne({
          activeDate: currentDate,
        })
        .sort({ order: -1 })
        .limit(1),
      this.userService.findById(createActivityDto.user),
    ]);

    if (!user) {
      throw new NotFoundException('Employee not found!');
    }

    if (userCheckIn) {
      throw new ConflictException('Employee already check-in!');
    }

    const checkedInAt = moment().toDate();

    // If check in late after 9:15 then totalTurn = +1 turn
    let isLate = moment().format('HH:mm:ss') >= '09:15:00';

    // if is sunday then after 11h15
    if (moment().day() === 0)
      isLate = moment().format('HH:mm:ss') >= '11:15:00';

    const currentOrder = lastOrder ? lastOrder.order + 1 : 1;

    // 2. Create activity
    const activity = new this.activityModel({
      user: createActivityDto.user,
      checkedInAt,
      order: currentOrder,
      oldOrder: currentOrder,
      activeDate: currentDate,
      totalTurn: isLate ? 1 : 0,
      firstOrder: currentOrder,
    });

    // 3. Save
    await Promise.all([
      activity.save(),
      this.notificationsService.create({
        notiContent: `Employee ${user.firstName} ${user.lastName} Checked in at ${moment(checkedInAt).format('DD/MM/YYYY HH:mm:ss')}`,
        notiType: NotiTypes.CheckInSuccess,
      }),
    ]);
    await this.sortOrder(createActivityDto.user, false);

    // 4. Create notification

    // 5. Send notification socket
    await this.eventService.pushNotificationToAdmin();

    // 6. Push get activities
    await this.eventService.getActivities();

    return activity;
  }

  async findAll(): Promise<Activity[]> {
    const currentDate = moment().format('YYYY-MM-DD');

    const response = await this.activityModel
      .find({
        activeDate: currentDate,
      })
      .populate({
        path: 'user',
        select: '-password -salt -role -__v',
        populate: { path: 'userSkills', select: '-__v' },
      })
      .sort({ order: 1 })
      .lean();

    if (response.length === 0) return [];

    // find all histories by date
    const results = (await Promise.all(
      response.map(async (activity) => {
        const histories = await this.historyService.findByUser(
          activity.user._id.toString(),
        );

        const current = histories.length > 0 ? histories[0] : null;

        // sorted history
        const sortedHistory = histories.sort(
          (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
        );

        return {
          ...activity,
          histories: sortedHistory,
          current,
        };
      }),
    )) as Activity[];

    return results;
  }

  findOne(id: number) {
    return `This action returns a #${id} activity`;
  }

  async findById(id: string) {
    return await this.activityModel.findById(new mongoose.Types.ObjectId(id));
  }

  async update(id: string, updateActivityDto: UpdateActivityDto) {
    const foundActive = await this.activityModel.findOne({ _id: id });
    if (!foundActive) {
      throw new NotFoundException('Activity not found!');
    }

    if (updateActivityDto.newPosition && updateActivityDto.oldPosition) {
      // update swap position current date

      foundActive.order = updateActivityDto.newPosition;
      foundActive.oldOrder = updateActivityDto.oldPosition;

      // find activity by order and date
      const foundSwap = await this.activityModel.findOne({
        activeDate: moment().format('YYYY-MM-DD'),
        order: updateActivityDto.newPosition,
      });

      if (!foundSwap) {
        throw new NotFoundException('Activity not found!');
      }

      foundSwap.order = updateActivityDto.oldPosition;
      foundSwap.oldOrder = updateActivityDto.newPosition;

      await Promise.all([foundSwap.save(), foundActive.save()]);

      await this.eventService.getActivities();
    }

    return true;
  }

  remove(id: number) {
    return `This action removes a #${id} activity`;
  }

  async findLastActivityByUser(userId: string): Promise<Activity | null> {
    const response = await this.activityModel
      .findOne({
        user: userId,
        activeDate: moment().format('YYYY-MM-DD'),
      })
      .sort({ order: -1 })
      .limit(1);

    if (!response) return null;

    return response as Activity;
  }

  async incrementTurn(userId: string, turn: number) {
    const lastActivity = await this.findLastActivityByUser(userId);

    if (!lastActivity) {
      return;
    }

    lastActivity.totalTurn += turn;
    lastActivity.type = ActivityType.CheckIn;

    await lastActivity.save();

    return lastActivity;
  }

  async sortOrder(userId: string, isUpdate = true) {
    const currentDate = moment().format('YYYY-MM-DD');

    // 1. Get current activity by user
    const currentByUser = await this.findLastActivityByUser(userId);

    if (!currentByUser) {
      throw new NotFoundException('Not found current by user!');
    }

    if (isUpdate === true) {
      currentByUser.type = ActivityType.CheckOut;

      await currentByUser.save();

      // 2. Get other activities gather than by order of current and sorted by order ASC
      const others = await this.activityModel
        .find({
          activeDate: currentDate,
          order: { $gt: currentByUser.order },
        })
        .sort({ order: 1 });

      // if length = 0 is equal current activity by user
      if (others.length === 0) return;

      // sorted priorities by total turn
      const newDataSorted = this.insertionSortActivity(
        [currentByUser, ...others],
        currentByUser.order,
      );

      await this.updateSortedOrder(newDataSorted);

      return true;
    }

    // 2. Get other activities gather than by order of current and sorted by order ASC
    const others = await this.activityModel
      .find({
        activeDate: currentDate,
      })
      .sort({ order: 1 });

    if (others.length === 0) return;

    const newDataSorted = this.insertionSortActivity(
      others,
      1,
    );

    await this.updateSortedOrder(newDataSorted);
  }

  private insertionSortActivity(array: Activity[], startOrder: number) {
    const len = array.length;

    if (len === 0) return array;

    // set old order index
    for (let i = 0; i < len; i++) {
      array[i].oldOrder = array[i].order;
    }

    for (let i = 1; i < len; i++) {
      let item = array[i];
      let j = i - 1; // index previous item

      // sort by total turn
      while (
        j >= 0 &&
        (array[j].totalTurn > item.totalTurn ||
          (array[j].totalTurn === item.totalTurn &&
            array[j].firstOrder > item.firstOrder))
      ) {
        array[j + 1] = array[j];
        j--;
      }

      array[j + 1] = item;
    }

    // update order
    for (let i = 0; i < len; i++) {
      array[i].order = startOrder + i;
    }

    return array;
  }

  private async updateSortedOrder(sorted: Activity[]) {
    const bulkOps = sorted.map((activity) => ({
      updateOne: {
        filter: { _id: activity._id },
        update: {
          $set: { order: activity.order, oldOrder: activity.oldOrder },
        },
      },
    }));

    await this.activityModel.bulkWrite(bulkOps);
  }
}
