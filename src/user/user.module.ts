import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DOCUMENT_NAME, UserSchema } from './schemas/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ActivitiesModule } from '@src/activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DOCUMENT_NAME,
        schema: UserSchema,
      },
    ]),
    forwardRef(() => ActivitiesModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
