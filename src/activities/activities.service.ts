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
import { HistoryStatus } from '@src/history/schemas/history.schema';
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

  /**
   * Check-in employee
   * @param createActivityDto
   * @returns
   */
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
      checkedInOrder: currentOrder,
      isLate,
    });

    // 3. Save
    await Promise.all([
      activity.save(),
      this.notificationsService.create({
        notiContent: `Employee ${user.firstName} ${user.lastName} Checked in at ${moment(checkedInAt).format('DD/MM/YYYY HH:mm:ss')}`,
        notiType: NotiTypes.CheckInSuccess,
      }),
    ]);
    await this.sortOrderByTotalTurn(true, createActivityDto.user);

    // 6. Push get activities
    this.eventService.revalidateActivity();

    return activity;
  }

  async findAll(sortBy: keyof Activity = 'order'): Promise<Activity[]> {
    // const currentDate = moment().add(1, 'days').format('YYYY-MM-DD');
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
      .sort({ [sortBy]: 1 })
      .lean();

    if (response.length === 0) return [];

    // find all histories by date
    const results = (await Promise.all(
      response.map(async (activity) => {
        const histories = await this.historyService.findByUser(
          activity.user._id.toString(),
        );

        const current =
          histories.length > 0 && histories[0]?.status === HistoryStatus.Pending
            ? histories[0]
            : null;

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

  async findById(id: string) {
    return await this.activityModel.findById(new mongoose.Types.ObjectId(id));
  }

  async update(id: string, updateActivityDto: UpdateActivityDto) {
    const foundActive = await this.activityModel.findOne({ _id: id });
    if (!foundActive) {
      throw new NotFoundException('Activity not found!');
    }

    if (updateActivityDto.newPosition && updateActivityDto.oldPosition) {
      foundActive.firstOrder = updateActivityDto.newPosition;

      // find activity by firstOrder and date
      const foundSwap = await this.activityModel.findOne({
        activeDate: moment().format('YYYY-MM-DD'),
        firstOrder: updateActivityDto.newPosition,
      });

      if (!foundSwap) {
        throw new NotFoundException('Activity not found!');
      }

      foundSwap.firstOrder = updateActivityDto.oldPosition;

      await Promise.all([foundSwap.save(), foundActive.save()]);

      // sort order by total turn
      await this.sortOrderByTotalTurn(false, foundActive.user.toString());

      this.eventService.revalidateActivity();
    }

    return true;
  }

  async remove(id: string): Promise<boolean> {
    const activity = await this.findById(id);
    if (!activity) {
      throw new NotFoundException('Activity not found!');
    }

    const { firstOrder, order, user } = activity;

    // Xoá activity và history song song
    await Promise.all([
      activity.deleteOne(),
      this.historyService.removeByUser(user.toString()),
    ]);

    // Cập nhật lại firstOrder và order song song
    await Promise.all([
      this.activityModel.updateMany(
        { firstOrder: { $gt: firstOrder } },
        { $inc: { firstOrder: -1 } },
      ),
      this.activityModel.updateMany(
        { order: { $gt: order } },
        { $inc: { order: -1 } },
      ),
    ]);

    // Gửi event revalidate (không cần chờ nếu không phụ thuộc kết quả)
    void this.eventService.revalidateActivity();
    void this.eventService.revalidateGetUserCheckin();

    return true;
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

    // It is first turn then isFirstTurn = true
    if (!lastActivity.isFirstTurn) lastActivity.isFirstTurn = true;

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
    }

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
  }

  async updateCheckedOutAt(userId: string) {
    // 1. Get current activity by user
    const currentByUser = await this.findLastActivityByUser(userId);

    if (!currentByUser) {
      throw new NotFoundException('Not found current by user!');
    }

    currentByUser.type = ActivityType.CheckOut;
    currentByUser.checkedOutAt = moment().toDate();

    await currentByUser.save();
  }

  async sortOrderByTotalTurn(isCheckIn: boolean, userId: string) {
    const currentDate = moment().format('YYYY-MM-DD');

    const others = await this.activityModel
      .find({
        activeDate: currentDate,
      })
      .sort({ order: 1 });

    // if length = 0 is equal current activity
    if (others.length === 0) return;

    // Check if this is first turn for all users (fair distribution)
    const isFirstTurn = await this.checkIfFirstTurn(others);

    console.log('isFirstTurn', isFirstTurn);

    let newDataSorted: Activity[] = [];
    if (isFirstTurn) {
      // First turn: fair distribution based on check-in time
      newDataSorted = await this.sortFirstTurnFairly(
        others,
        1,
        isCheckIn,
        userId,
      );
    } else {
      // Subsequent turns: sort by totalTurn
      newDataSorted = this.insertionSortActivity(others, 1);
    }

    await this.updateSortedOrder(newDataSorted);
  }

  private isHalfTurn = (initTurn: number) => {
    return initTurn % 1 === 0.5;
  };

  /**
   * Check if this is the first turn for all users (everyone has history <= 1)
   */
  private async checkIfFirstTurn(activities: Activity[]): Promise<boolean> {
    // Nếu có tồn tại activities có isFirstTurn = false thì có nghĩa
    // là chưa chia hết turn lượt đầu tiên cho tất cả nhân viên
    return activities.some((activity) => !activity.isFirstTurn);
  }

  /**
   * Sort activities fairly for first turn based on check-in time
   * People who checked in earlier will be placed at the end to give others a chance
   */
  private async sortFirstTurnFairly(
    activities: Activity[],
    startOrder: number,
    isCheckIn: boolean,
    userId: string,
  ): Promise<Activity[]> {
    try {
      console.log(`activities::`, activities);

      // Sort by check-in time (earliest first)
      const sortedByCheckIn = activities.sort((a, b) => {
        const timeA = new Date(a.checkedInAt).getTime();
        const timeB = new Date(b.checkedInAt).getTime();
        return timeA - timeB;
      });

      console.log(`sortedByCheckIn::`, sortedByCheckIn);

      if (isCheckIn) {
        // Check-in case (isCheckIn = true)
        // Find activity of the user who is checking in
        const activitySelectedByUserId = sortedByCheckIn.find(
          (activity) => activity.user.toString() === userId,
        );

        if (!activitySelectedByUserId) {
          // If user's activity not found, use original logic
          const fairOrder = [...sortedByCheckIn];
          return fairOrder.map((activity, index) => {
            return {
              ...activity,
              order: startOrder + index,
              oldOrder: activity.order,
            } as Activity;
          });
        }

        // Check if there are any activities with isFirstTurn = true
        const hasFirstTurnTrue = sortedByCheckIn.some(
          (activity) =>
            activity.isFirstTurn &&
            activity.user.toString() !== userId,
        );

        // Get other activities (excluding the selected user's activity)
        const otherActivities = sortedByCheckIn.filter(
          (activity) => activity.user.toString() !== userId,
        );

        // Sort other activities by order to find the correct position
        const sortedOtherActivities = [...otherActivities].sort(
          (a, b) => a.order - b.order,
        );

        let fairOrder: Activity[] = [];

        if (hasFirstTurnTrue) {
          // Find the activity with isFirstTurn = false that has the highest order
          const notFirstTurnActivities = sortedOtherActivities.filter(
            (activity) => !activity.isFirstTurn,
          );

          if (notFirstTurnActivities.length > 0) {
            // Find the one with highest order (last position in sorted array)
            const lastNotFirstTurn =
              notFirstTurnActivities[notFirstTurnActivities.length - 1];

            // Find the index of lastNotFirstTurn in sortedOtherActivities
            const lastNotFirstTurnIndex = sortedOtherActivities.findIndex(
              (activity) =>
                activity.user.toString() ===
                lastNotFirstTurn.user.toString(),
            );

            // Split: activities before and including lastNotFirstTurn, then activitySelectedByUserId, then the rest
            fairOrder = [
              ...sortedOtherActivities.slice(0, lastNotFirstTurnIndex + 1),
              activitySelectedByUserId,
              ...sortedOtherActivities.slice(lastNotFirstTurnIndex + 1),
            ];
          } else {
            // No isFirstTurn = false found, put activitySelectedByUserId at the top
            fairOrder = [activitySelectedByUserId, ...sortedOtherActivities];
          }
        } else {
          // No activities with isFirstTurn = true, use original logic
          fairOrder = [...sortedByCheckIn];
        }

        // Update order starting from startOrder
        return fairOrder.map((activity, index) => {
          return {
            ...activity,
            order: startOrder + index,
            oldOrder: activity.order,
          } as Activity;
        });
      }

      // Handle check-out case (isCheckIn = false)

      // Find activity of the selected user
      const activitySelectedByUserId = sortedByCheckIn.find(
        (activity) => activity.user.toString() === userId,
      );

      if (!activitySelectedByUserId) {
        // If user's activity not found, use original logic
        const fairOrder = [...sortedByCheckIn].reverse();
        return fairOrder.map((activity, index) => {
          return {
            ...activity,
            order: startOrder + index,
            oldOrder: activity.order,
          } as Activity;
        });
      }

      const selectedOrder = activitySelectedByUserId.order;

      // For activities with order > selectedOrder (except the selected one), decrease order by 1
      const adjustedActivities = sortedByCheckIn.map((activity) => {
        if (
          activity.user.toString() === userId ||
          activity.order <= selectedOrder
        ) {
          return activity;
        }
        return {
          ...activity.toObject(),
          order: activity.order - 1,
          oldOrder: activity.order,
        } as Activity;
      });

      console.log(`adjustedActivities::`, adjustedActivities);

      // Separate activities into two groups based on isFirstTurn (excluding selected user's activity)
      const notFirstTurn = adjustedActivities.filter(
        (activity) =>
          !activity.isFirstTurn && activity.user.toString() !== userId,
      );
      const isFirstTurn = adjustedActivities.filter(
        (activity) =>
          activity.isFirstTurn && activity.user.toString() !== userId,
      );

      activitySelectedByUserId.order = adjustedActivities.length;

      // Sort: isFirstTurn = false first (priority), isFirstTurn = true after, selected user's activity at the end
      const fairOrder = [
        ...notFirstTurn,
        ...isFirstTurn,
        activitySelectedByUserId,
      ];

      console.log(`fairOrder::`, fairOrder);

      // Update order starting from startOrder
      return fairOrder;
    } catch (error) {
      console.log(`error::`, error);
      throw error;
    }
  }

  private insertionSortActivity(array: Activity[], startOrder: number) {
    const len = array.length;

    if (len === 0) return array;

    let newArray = array.map((item, index) => {
      const _item = item.toObject();

      return {
        ..._item,
        totalTurnTerm: this.isHalfTurn(_item.totalTurn)
          ? _item.totalTurn - 0.5
          : _item.totalTurn,
        oldOrder: _item.order, // lưu order cũ
      };
    });

    for (let i = 1; i < len; i++) {
      let item = newArray[i];
      let j = i - 1; // index previous item

      // sort by total turn
      while (
        j >= 0 &&
        (newArray[j].totalTurnTerm > item.totalTurnTerm ||
          (newArray[j].totalTurnTerm === item.totalTurnTerm &&
            newArray[j].firstOrder > item.firstOrder))
      ) {
        newArray[j + 1] = newArray[j];
        j--;
      }

      newArray[j + 1] = item;
    }

    // sort bằng Array.sort()
    // newArray.sort((a, b) => {
    //   if (a.totalTurnTerm !== b.totalTurnTerm) {
    //     return a.totalTurnTerm - b.totalTurnTerm;
    //   }
    //   return a.firstOrder - b.firstOrder;
    // });

    // update order mới
    newArray = newArray.map((item, index) => {
      const { totalTurnTerm, ...rest } = item; // bỏ field tạm
      return { ...rest, order: startOrder + index };
    });

    return newArray as unknown as Activity[];
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

  deleteByUserId(userId: string) {
    return this.activityModel.deleteMany({ user: userId });
  }

  async editTotalTurn(activityId: string, totalTurn: number) {
    const result = await this.activityModel.findByIdAndUpdate(
      activityId,
      {
        $set: { totalTurn },
      },
      {
        new: true,
      },
    );

    if (!result) throw new NotFoundException('Activity not found!');

    await this.sortOrderByTotalTurn(false, result.user.toString());

    this.eventService.revalidateActivity();
  }
}
