import { ConfigService } from '@nestjs/config';
import { buildDatabaseOptions } from './database.config';

describe('buildDatabaseOptions', () => {
  const createConfigService = (values: Record<string, string | undefined>) =>
    ({
      get: (key: string) => values[key],
    }) as unknown as ConfigService;

  it('uses postgres DATABASE_URL in production with ssl enabled by default', () => {
    const options = buildDatabaseOptions(
      createConfigService({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://user:pass@host:5432/db',
        JWT_SECRET: 'secret',
      }),
    );

    expect(options).toMatchObject({
      type: 'postgres',
      url: 'postgres://user:pass@host:5432/db',
      synchronize: false,
      ssl: { rejectUnauthorized: false },
    });
  });

  it('uses host-based postgres config when DATABASE_URL is absent', () => {
    const options = buildDatabaseOptions(
      createConfigService({
        NODE_ENV: 'development',
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_USERNAME: 'postgres',
        DB_PASSWORD: 'postgres',
        DB_DATABASE: 'lifedashboard',
      }),
    );

    expect(options).toMatchObject({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'lifedashboard',
      synchronize: true,
    });
  });

  it('uses in-memory sqlite only for tests', () => {
    const options = buildDatabaseOptions(
      createConfigService({
        NODE_ENV: 'test',
      }),
    );

    expect(options).toMatchObject({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: true,
    });
  });

  it('throws outside test when postgres config is missing', () => {
    expect(() =>
      buildDatabaseOptions(
        createConfigService({
          NODE_ENV: 'development',
        }),
      ),
    ).toThrow(
      'PostgreSQL configuration is required. Set DATABASE_URL for cloud or DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE for local development.',
    );
  });
});
