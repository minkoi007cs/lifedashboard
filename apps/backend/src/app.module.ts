import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { FinanceModule } from './finance/finance.module';
import { FocusModule } from './focus/focus.module';
import { AdminModule } from './admin/admin.module';
import { CaloriesModule } from './calories/calories.module';
import { HabitsModule } from './habits/habits.module';
import { buildDatabaseOptions } from './config/database.config';
import { WishesModule } from './wishes/wishes.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        buildDatabaseOptions(configService),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    TasksModule,
    FinanceModule,
    FocusModule,
    AdminModule,
    CaloriesModule,
    HabitsModule,
    WishesModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
