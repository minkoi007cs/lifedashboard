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
  FinanceShare,
  PayPeriod,
} from '../finance/finance.entity';
import { Habit, HabitLog } from '../habits/habit.entity';
import { AppNotification } from '../notifications/notification.entity';
import { Task, TaskParticipant } from '../tasks/task.entity';
import { User } from '../users/user.entity';
import {
  WishComment,
  WishEntry,
  WishResponse,
  WishShare,
} from '../wishes/wish.entity';

export const typeOrmEntities = [
  User,
  Task,
  TaskParticipant,
  FinanceSale,
  FinanceExpense,
  PayPeriod,
  FinanceShare,
  FocusSession,
  FoodEntry,
  WeightLog,
  DietPlan,
  FoodDatabase,
  Habit,
  HabitLog,
  WishEntry,
  WishResponse,
  WishShare,
  WishComment,
  AppNotification,
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

// Pool config for Supabase/serverless (DATABASE_URL path).
// max:1 — one connection per warm serverless instance is sufficient.
// connectionTimeoutMillis — fail fast at 5 s instead of hanging to Vercel's 10 s hard limit.
// idleTimeoutMillis — release the connection after 10 s of inactivity between requests.
// allowExitOnIdle — lets the Node.js process exit cleanly when idle (important for serverless).
const SERVERLESS_POOL = {
  max: 1,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 10_000,
  allowExitOnIdle: true,
};

// Pool config for local / DB_HOST path.
const LOCAL_POOL = {
  max: 10,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
};

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

  // Hard guard — synchronize on production runs dozens of information_schema queries
  // on every cold start, causing 504 FUNCTION_INVOCATION_TIMEOUT on Vercel.
  if (shouldSynchronize && isProduction) {
    throw new Error(
      'DB_SYNCHRONIZE=true is forbidden in production. ' +
        'Schema sync on cold start causes 504 timeouts and can alter/drop live columns. ' +
        'Set DB_SYNCHRONIZE=false in your Vercel environment variables.',
    );
  }

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entityPrefix: 'ld_',
      entities: typeOrmEntities,
      synchronize: shouldSynchronize,
      ssl: getBooleanConfig(configService, 'DB_SSL', isProduction)
        ? { rejectUnauthorized: false }
        : undefined,
      extra: SERVERLESS_POOL,
      // Serverless retry budget: 2 retries × (5 s connect + 1 s delay) = 12 s worst-case,
      // well within the 20 s maxDuration. Default is 10 retries × 3 s = 30 s → 504.
      retryAttempts: 2,
      retryDelay: 1_000,
      verboseRetryLog: true,
      // ENOTFOUND = wrong hostname in DATABASE_URL — retrying is pointless, fail immediately.
      toRetry: (err: Error) =>
        !err.message?.includes('ENOTFOUND') &&
        !err.message?.includes('password authentication failed'),
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
      entityPrefix: 'ld_',
      entities: typeOrmEntities,
      synchronize: shouldSynchronize,
      ssl: getBooleanConfig(configService, 'DB_SSL', isProduction)
        ? { rejectUnauthorized: false }
        : undefined,
      extra: LOCAL_POOL,
      retryAttempts: 5,
      retryDelay: 2_000,
    };
  }

  if (isTest) {
    const testDbUrl =
      configService.get<string>('DATABASE_URL_TEST') ??
      configService.get<string>('DATABASE_URL') ??
      'postgresql://postgres:postgres@localhost:5432/lifedashboard_test';
    return {
      type: 'postgres',
      url: testDbUrl,
      entityPrefix: 'ld_',
      entities: typeOrmEntities,
      synchronize: true,
      dropSchema: true,
      ssl: getBooleanConfig(configService, 'DB_SSL', false)
        ? { rejectUnauthorized: false }
        : undefined,
    };
  }

  throw new Error(
    'PostgreSQL configuration is required. Set DATABASE_URL for cloud or DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE for local development.',
  );
}
