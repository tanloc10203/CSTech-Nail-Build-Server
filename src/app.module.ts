import { HttpExceptionFilter } from '@app/configs/filters/http-exception.filter';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ActivitiesModule } from './activities/activities.module';
import { AuthModule } from './auth/auth.module';
import { CustomerModule } from './customer/customer.module';
import { EventModule } from './event/event.module';
import { HistoryModule } from './history/history.module';
import { KeyStoreModule } from './keyStore/keyStore.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ServicesModule } from './services/services.module';
import { UserModule } from './user/user.module';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { AdminService } from './admin.service';
import { TaskModule } from './task/task.module';
import { ScheduleModule } from '@nestjs/schedule';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      expandVariables: true,
    }),
    MongooseModule.forRoot(process.env.DB_URI, {
      onConnectionCreate: (connection: Connection) => {
        connection.on('connected', () => console.log('MongoDB connected'));
        connection.on('open', () => console.log('MongoDB open'));
        connection.on('disconnected', () =>
          console.log('MongoDB disconnected'),
        );
        connection.on('reconnected', () => console.log('MongoDB reconnected'));
        connection.on('disconnecting', () =>
          console.log('MongoDB disconnecting'),
        );

        return connection;
      },
    }),
    UserModule,
    AuthModule,
    KeyStoreModule,
    ServicesModule,
    ActivitiesModule,
    NotificationsModule,
    EventModule,
    CustomerModule,
    HistoryModule,
    TaskModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    AdminService,
  ],
})
export class AppModule {}
