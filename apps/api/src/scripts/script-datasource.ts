import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { typeOrmEntities } from '../config/database.config';

// Dùng chung cho db:seed / db:clean. Bắt buộc DB_SCRIPT_CONFIRM=yes để tránh chạy nhầm DB.
export async function openScriptDataSource(name: string): Promise<DataSource> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error('DATABASE_URL is required');
  console.log(`[${name}] target: ${url.replace(/:([^@:]+)@/, ':***@')}`);
  if (process.env.DB_SCRIPT_CONFIRM !== 'yes') {
    console.error(
      `[${name}] ABORTED — set DB_SCRIPT_CONFIRM=yes to confirm this target.`,
    );
    process.exit(1);
  }
  const ds = new DataSource({
    type: 'postgres',
    url,
    entities: typeOrmEntities,
    entityPrefix: 'ld_',
    ssl:
      process.env.DB_SSL !== 'false'
        ? { rejectUnauthorized: false }
        : undefined,
    extra: { max: 1, connectionTimeoutMillis: 15_000 },
  });
  return ds.initialize();
}
