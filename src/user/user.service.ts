import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ActivitiesService } from '@src/activities/activities.service';
import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRoles, UserStatus } from './schemas/user.schema';
import { HistoryService } from '@src/history/history.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: mongoose.Model<User>,

    @Inject(forwardRef(() => ActivitiesService))
    private readonly activityService: ActivitiesService,

    @Inject(forwardRef(() => HistoryService))
    private readonly historyService: HistoryService,
  ) {}

  async createAdmin(createUserDto: CreateUserDto) {
    const user = new this.userModel({
      ...createUserDto,
      role: UserRoles.ADMIN,
    });

    user.salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(createUserDto.password, user.salt);

    await user.save();
  }

  async create(createUserDto: CreateUserDto) {
    if (createUserDto.username) {
      const userExist = await this.findByUsername(createUserDto.username);

      if (userExist) {
        throw new ConflictException('User already exist');
      }
    }

    const foundIsAdmin = await this.userModel.findOne({
      role: UserRoles.ADMIN,
    });

    // 1. First user is admin

    const user = new this.userModel({
      ...createUserDto,
      role: !foundIsAdmin ? UserRoles.ADMIN : UserRoles.EMPLOYEE,
    });

    if (createUserDto.password) {
      user.salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(createUserDto.password, user.salt);
    }

    await user.save();

    return user;
  }

  async findAll(): Promise<User[]> {
    const users = await this.userModel
      .find({
        role: UserRoles.EMPLOYEE,
      })
      .populate('userSkills');
    return users;
  }

  async getAllEmployees(): Promise<User[]> {
    const users = await this.userModel
      .find({
        role: UserRoles.EMPLOYEE,
        status: UserStatus.ACTIVE,
      })
      .populate('userSkills')
      .select({ password: 0, salt: 0, role: 0, __v: 0 })
      .lean();

    if (users.length === 0) return [];

    // find activities by user id
    const userActivities = await Promise.all(
      users.map(async (user) => {
        const activity = await this.activityService.findLastActivityByUser(
          user._id.toString(),
        );

        return { ...user, activity };
      }),
    );

    return userActivities as User[];
  }

  async searchingUserAccount(value: string): Promise<User[]> {
    const users = await this.userModel
      .find({
        $or: [
          { firstName: { $regex: value, $options: 'i' } },
          { lastName: { $regex: value, $options: 'i' } },
          { username: { $regex: value, $options: 'i' } },
        ],
        role: UserRoles.EMPLOYEE,
        status: UserStatus.ACTIVE,
      })
      .populate('userSkills')
      .select({ password: 0, salt: 0, role: 0, __v: 0 })
      .lean();

    if (users.length === 0) return [];

    // find activities by user id
    const userActivities = await Promise.all(
      users.map(async (user) => {
        const activity = await this.activityService.findLastActivityByUser(
          user._id.toString(),
        );

        return { ...user, activity };
      }),
    );

    return userActivities as User[];
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(new mongoose.Types.ObjectId(id));
    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel
      .findById(new mongoose.Types.ObjectId(id))
      .lean();
    return user as User;
  }

  async findByUsername(username: string) {
    const user = await this.userModel.findOne({ username: username }).exec();
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userModel.findByIdAndUpdate(id, updateUserDto, {
      new: true,
    });

    return true;
  }

  async checkIsAdmin() {
    const foundIsAdmin = await this.userModel.findOne({
      role: UserRoles.ADMIN,
    });

    return foundIsAdmin;
  }

  async delete(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await Promise.all([
      this.userModel.findByIdAndDelete(id),
      this.activityService.deleteByUserId(id),
      this.historyService.deleteByUserId(id),
    ]);

    return true;
  }
}
