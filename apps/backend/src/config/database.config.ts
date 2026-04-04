import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  FoodDatabase,
  FoodEntry,
  WeightLog,
  DietPlan,
} from '../calories/calories.entity';
import { FocusSession } from '../focus/focus.entity';
import {
  FinanceExpense,
  FinanceSale,
  PayPeriod,
} from '../finance/finance.entity';
import { Habit, HabitLog } from '../habits/habit.entity';
import { Task } from '../tasks/task.entity';
import { User } from '../users/user.entity';

export const typeOrmEntities = [
  User,
  Task,
  FinanceSale,
  FinanceExpense,
  PayPeriod,
  FocusSession,
  FoodEntry,
  WeightLog,
  DietPlan,
  FoodDatabase,
  Habit,
  HabitLog,
];

function getRequiredConfig(configService: ConfigService, key: string): string {
  const value = configService.get<string>(key)?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getBooleanConfig(
  configService: ConfigService,
  key: string,
  defaultValue: boolean,
): boolean {
  const value = configService.get<string>(key);

  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
}

export function buildDatabaseOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const isProduction = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';
  const databaseUrl = configService.get<string>('DATABASE_URL')?.trim();
  const shouldSynchronize = getBooleanConfig(
    configService,
    'DB_SYNCHRONIZE',
    !isProduction,
  );

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: typeOrmEntities,
      synchronize: shouldSynchronize,
      ssl: getBooleanConfig(configService, 'DB_SSL', isProduction)
        ? { rejectUnauthorized: false }
        : undefined,
    };
  }

  const dbHost = configService.get<string>('DB_HOST')?.trim();
  if (dbHost) {
    return {
      type: 'postgres',
      host: dbHost,
      port: Number(getRequiredConfig(configService, 'DB_PORT')),
      username: getRequiredConfig(configService, 'DB_USERNAME'),
      password: getRequiredConfig(configService, 'DB_PASSWORD'),
      database: getRequiredConfig(configService, 'DB_DATABASE'),
      entities: typeOrmEntities,
      synchronize: shouldSynchronize,
      ssl: getBooleanConfig(configService, 'DB_SSL', isProduction)
        ? { rejectUnauthorized: false }
        : undefined,
    };
  }

  if (isTest) {
    return {
      type: 'better-sqlite3',
      database: ':memory:',
      entities: typeOrmEntities,
      synchronize: true,
    };
  }

  throw new Error(
    'PostgreSQL configuration is required. Set DATABASE_URL for cloud or DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE for local development.',
  );
}
