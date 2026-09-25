/**
 * Standalone schema sync script — creates/updates all ld_* tables via TypeORM synchronize().
 *
 * SAFE: adds tables/columns that don't exist; does NOT drop tables or existing columns.
 * NOT SAFE: will add new columns from entity changes (could affect live data if misused).
 *
 * Usage (must set env vars explicitly — no .env auto-load):
 *   SCHEMA_SYNC_CONFIRM=yes \
 *   DATABASE_URL="postgresql://..." \
 *   DB_SSL=true \
 *   npm run schema:sync --workspace apps/backend
 *
 * Or with a .env file:
 *   source apps/backend/.env && SCHEMA_SYNC_CONFIRM=yes npm run schema:sync --workspace apps/backend
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { typeOrmEntities } from '../config/database.config';

function redactUrl(url: string): string {
  // Hide password between : and @ to avoid logging credentials
  return url.replace(/:([^@:]+)@/, ':***@');
}

function banner(msg: string): void {
  const line = '─'.repeat(60);
  console.log(`\n${line}`);
  console.log(`  ${msg}`);
  console.log(`${line}\n`);
}

async function run(): Promise<void> {
  banner('LifeDashboard — schema:sync');

  const confirm = process.env.SCHEMA_SYNC_CONFIRM;
  const databaseUrl = process.env.DATABASE_URL?.trim();
  // Default DB_SSL=true — safer for cloud DBs; explicitly set DB_SSL=false for local plain Postgres
  const sslEnabled = process.env.DB_SSL !== 'false';

  console.log('What this script does:');
  console.log('  • Connects to DATABASE_URL');
  console.log('  • Runs TypeORM synchronize() — CREATE TABLE IF NOT EXISTS for every entity');
  console.log('  • Adds new columns from entity definitions if they are missing');
  console.log('  • Does NOT drop tables, drop columns, or alter existing data');
  console.log('');
  console.log('When to use:');
  console.log('  • First-time Supabase setup (fresh DB, no tables yet)');
  console.log('  • After adding new entity columns in dev (non-production)');
  console.log('');

  // ── Safety gate ──────────────────────────────────────────────────────────
  if (confirm !== 'yes') {
    console.error('ABORTED — safety gate not satisfied.\n');
    console.error('Set SCHEMA_SYNC_CONFIRM=yes to confirm you intend to modify the schema:\n');
    console.error(
      '  SCHEMA_SYNC_CONFIRM=yes DATABASE_URL="postgresql://..." \\',
    );
    console.error(
      '    npm run schema:sync --workspace apps/backend\n',
    );
    console.error(
      `  SCHEMA_SYNC_CONFIRM is currently: ${JSON.stringify(confirm ?? '(not set)')}\n`,
    );
    process.exit(1);
  }

  if (!databaseUrl) {
    console.error('ABORTED — DATABASE_URL is required but not set.\n');
    console.error(
      'Export it in your shell or prefix the command:\n',
    );
    console.error(
      '  DATABASE_URL="postgresql://postgres.[ref]:[pass]@[host]:5432/postgres" ...\n',
    );
    process.exit(1);
  }

  // ── Pre-flight summary ───────────────────────────────────────────────────
  console.log(`Target:   ${redactUrl(databaseUrl)}`);
  console.log(`SSL:      ${sslEnabled}`);
  console.log(`Entities: ${typeOrmEntities.length} (table prefix: ld_)\n`);

  // ── Connect + synchronize ────────────────────────────────────────────────
  const dataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: typeOrmEntities,
    entityPrefix: 'ld_',
    synchronize: false, // we call it manually below for explicit control
    ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
    // Log every CREATE TABLE / ALTER TABLE so the output shows exactly what changed.
    // 'schema' = DDL statements; 'error' = connection/query errors.
    logging: ['schema', 'error'],
    extra: {
      max: 1,
      connectionTimeoutMillis: 15_000,
    },
  });

  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('Connected.\n');

    console.log('Running synchronize() — DDL output below:');
    console.log('─'.repeat(60));
    await dataSource.synchronize();
    console.log('─'.repeat(60));

    console.log('\nDone. All ld_* tables created/verified successfully.');
    console.log('You can now deploy the app with DB_SYNCHRONIZE=false.\n');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\nFAILED: ${msg}`);
    console.error('');
    if (msg.includes('ENOTFOUND')) {
      console.error(
        'Hint: DNS resolution failed — the hostname in DATABASE_URL is wrong.',
      );
      console.error(
        '      Use the Session-mode pooler URL from Supabase → Settings → Database.',
      );
    } else if (msg.includes('password authentication failed')) {
      console.error('Hint: Wrong password in DATABASE_URL. Check the Supabase project password.');
    } else if (msg.includes('connection timeout')) {
      console.error(
        'Hint: Connection timed out. Verify Supabase is reachable and DB_SSL=true.',
      );
    }
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

run();
