import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthService } from '../src/auth/auth.service';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';

describe('Auth and profile (e2e)', () => {
  let app: INestApplication<App>;
  let usersService: UsersService;
  let authService: AuthService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';
    process.env.GOOGLE_CALLBACK_URL =
      'http://localhost:3000/api/v1/auth/google/callback';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    delete process.env.DATABASE_URL;
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_DATABASE;
    delete process.env.DB_SSL;
    delete process.env.DB_SYNCHRONIZE;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    usersService = app.get(UsersService);
    authService = app.get(AuthService);
  });

  afterAll(async () => {
    delete process.env.NODE_ENV;
    delete process.env.JWT_SECRET;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_CALLBACK_URL;
    delete process.env.FRONTEND_URL;
    if (app) {
      await app.close();
    }
  });

  it('rejects profile requests without a JWT', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/profile').expect(401);
  });

  it('returns the persisted user profile for authenticated requests', async () => {
    const user = await usersService.create({
      email: 'profile@example.com',
      name: 'Profile User',
      role: 'admin',
      avatarUrl: 'https://avatar.example.com/profile.png',
    });
    const accessToken = authService.generateToken(user);

    const response = await request(app.getHttpServer())
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: user.id,
      email: 'profile@example.com',
      name: 'Profile User',
      role: 'admin',
      avatarUrl: 'https://avatar.example.com/profile.png',
    });
  });
});
