import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { AppNotification } from './notification.entity';
import { ConnectedAccount } from './entities/connected-account.entity';
import { TasksModule } from '../tasks/tasks.module';
import { HabitsModule } from '../habits/habits.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppNotification, ConnectedAccount]),
    TasksModule,
    HabitsModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
