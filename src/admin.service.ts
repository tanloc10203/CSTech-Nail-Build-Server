import { Injectable, OnModuleInit } from '@nestjs/common';
import { UserService } from './user/user.service';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(private readonly userService: UserService) {}

  async onModuleInit() {
    await this.ensureAdminAccount();
  }

  private async ensureAdminAccount() {
    const admin = await this.userService.checkIsAdmin();

    if (!admin) {
      await this.userService.createAdmin({
        username: 'admin',
        password: 'admin',
        firstName: 'Admin',
        lastName: 'Admin',
      });

      console.log('Admin account created');
    } else {
      console.log('Admin account already exists');
    }
  }
}
