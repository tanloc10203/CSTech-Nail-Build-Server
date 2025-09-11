import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DOCUMENT_NAME, UserSchema } from './schemas/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ActivitiesModule } from '@src/activities/activities.module';
import { HistoryModule } from '@src/history/history.module';
import { EventModule } from '@src/event/event.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DOCUMENT_NAME,
        schema: UserSchema,
      },
    ]),
    forwardRef(() => ActivitiesModule),
    forwardRef(() => HistoryModule),
    EventModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
