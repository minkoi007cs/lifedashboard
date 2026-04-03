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
import { User } from './users/user.entity';
import { Task } from './tasks/task.entity';
import { FinanceSale, FinanceExpense, PayPeriod } from './finance/finance.entity';
import { FocusSession } from './focus/focus.entity';
import { AdminModule } from './admin/admin.module';
import { CaloriesModule } from './calories/calories.module';
import { FoodEntry, WeightLog, DietPlan, FoodDatabase } from './calories/calories.entity';
import { HabitsModule } from './habits/habits.module';
import { Habit, HabitLog } from './habits/habit.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const dbHost = configService.get<string>('DB_HOST');
        const dbUrl = configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL;
        const usePostgres = !!dbHost || !!dbUrl;

        if (usePostgres) {
          if (dbUrl) {
            return {
              type: 'postgres' as const,
              url: dbUrl,
              entities: [User, Task, FinanceSale, FinanceExpense, PayPeriod, FocusSession, FoodEntry, WeightLog, DietPlan, FoodDatabase, Habit, HabitLog],
              synchronize: true,
              ssl: isProduction ? { rejectUnauthorized: false } : undefined,
            };
          }
          return {
            type: 'postgres' as const,
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: configService.get<number>('DB_PORT', 5432),
            username: configService.get<string>('DB_USERNAME', 'postgres'),
            password: configService.get<string>('DB_PASSWORD', 'postgres'),
            database: configService.get<string>('DB_DATABASE', 'lifedashboard'),
            entities: [User, Task, FinanceSale, FinanceExpense, PayPeriod, FocusSession, FoodEntry, WeightLog, DietPlan, FoodDatabase, Habit, HabitLog],
            synchronize: true,
          };
        }

        if (isProduction) {
          // On Vercel serverless, SQLite is NOT supported (no writable filesystem).
          // DATABASE_URL MUST be set in Vercel environment variables!
          throw new Error(
            '[CONFIG ERROR] Production mode detected but DATABASE_URL is not set! ' +
            'Please add DATABASE_URL in your Vercel project environment variables.',
          );
        }

        // Local dev fallback: SQLite (no Docker required)
        return {
          type: 'better-sqlite3' as const,
          database: './lifedashboard-dev.sqlite',
          entities: [User, Task, FinanceSale, FinanceExpense, PayPeriod, FocusSession, FoodEntry, WeightLog, DietPlan, FoodDatabase, Habit, HabitLog],
          synchronize: true,
        };
      },
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
