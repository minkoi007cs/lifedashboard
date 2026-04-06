import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AppNotification } from '../src/notifications/notification.entity';
import { Task, TaskParticipant } from '../src/tasks/task.entity';
import { User } from '../src/users/user.entity';
import { WishComment, WishEntry, WishResponse, WishShare } from '../src/wishes/wish.entity';

describe('Wishlist module (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let wishRepository: Repository<WishEntry>;
  let wishShareRepository: Repository<WishShare>;
  let wishResponseRepository: Repository<WishResponse>;
  let wishCommentRepository: Repository<WishComment>;
  let taskRepository: Repository<Task>;
  let taskParticipantRepository: Repository<TaskParticipant>;
  let notificationRepository: Repository<AppNotification>;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/api/v1/auth/google/callback';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    delete process.env.DATABASE_URL;
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_DATABASE;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    dataSource = app.get(DataSource);
    wishRepository = dataSource.getRepository(WishEntry);
    wishShareRepository = dataSource.getRepository(WishShare);
    wishResponseRepository = dataSource.getRepository(WishResponse);
    wishCommentRepository = dataSource.getRepository(WishComment);
    taskRepository = dataSource.getRepository(Task);
    taskParticipantRepository = dataSource.getRepository(TaskParticipant);
    notificationRepository = dataSource.getRepository(AppNotification);
    userRepository = dataSource.getRepository(User);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    delete process.env.NODE_ENV;
    delete process.env.JWT_SECRET;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_CALLBACK_URL;
    delete process.env.FRONTEND_URL;
  });

  async function devLogin(email: string) {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/dev-login')
      .send({ email })
      .expect(201);

    return response.body as { accessToken: string; user: User };
  }

  async function createSharedWish(ownerToken: string, recipientIds: string[]) {
    const wishResponse = await request(app.getHttpServer())
      .post('/api/v1/wishes')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Sunset picnic',
        type: 'activity',
        timeTag: 'soon',
        description: 'Bring snacks',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/wishes/${wishResponse.body.id}/share`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userIds: recipientIds })
      .expect(201);

    return wishResponse.body.id as string;
  }

  it('prevents unsharing a user who already responded', async () => {
    const owner = await devLogin('owner-unshare@test.local');
    const friend = await devLogin('friend-unshare@test.local');

    const wishId = await createSharedWish(owner.accessToken, [friend.user.id]);

    await request(app.getHttpServer())
      .post(`/api/v1/wishes/${wishId}/respond`)
      .set('Authorization', `Bearer ${friend.accessToken}`)
      .send({ status: 'declined' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/wishes/${wishId}/share`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ userIds: [] })
      .expect(400);
  });

  it('stores only one response row per user and allows updating before plan creation', async () => {
    const owner = await devLogin('owner-response@test.local');
    const friend = await devLogin('friend-response@test.local');

    const wishId = await createSharedWish(owner.accessToken, [friend.user.id]);

    await request(app.getHttpServer())
      .post(`/api/v1/wishes/${wishId}/respond`)
      .set('Authorization', `Bearer ${friend.accessToken}`)
      .send({ status: 'confirmed', addToPlan: true, comment: 'I am in' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/wishes/${wishId}/respond`)
      .set('Authorization', `Bearer ${friend.accessToken}`)
      .send({ status: 'commented', comment: 'Actually let us keep it flexible' })
      .expect(201);

    const responses = await wishResponseRepository.find({ where: { wishId } });
    expect(responses).toHaveLength(1);
    expect(responses[0].status).toBe('commented');
    expect(responses[0].addToPlan).toBe(false);
  });

  it('rejects addToPlan on item wishes', async () => {
    const owner = await devLogin('owner-item@test.local');
    const friend = await devLogin('friend-item@test.local');

    const createWishResponse = await request(app.getHttpServer())
      .post('/api/v1/wishes')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'New headphones',
        type: 'item',
        timeTag: 'soon',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/wishes/${createWishResponse.body.id}/share`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ userIds: [friend.user.id] })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/wishes/${createWishResponse.body.id}/respond`)
      .set('Authorization', `Bearer ${friend.accessToken}`)
      .send({ status: 'confirmed', addToPlan: true })
      .expect(400);
  });

  it('blocks new responses after plan creation but still allows thread comments', async () => {
    const owner = await devLogin('owner-plan@test.local');
    const friend = await devLogin('friend-plan@test.local');
    const lateFriend = await devLogin('late-plan@test.local');

    const wishId = await createSharedWish(owner.accessToken, [friend.user.id, lateFriend.user.id]);

    await request(app.getHttpServer())
      .post(`/api/v1/wishes/${wishId}/respond`)
      .set('Authorization', `Bearer ${friend.accessToken}`)
      .send({ status: 'confirmed', addToPlan: true })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/wishes/${wishId}/create-plan`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ startDate: '2026-04-06T18:00:00.000Z', endDate: '2026-04-06T20:00:00.000Z' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/wishes/${wishId}/respond`)
      .set('Authorization', `Bearer ${lateFriend.accessToken}`)
      .send({ status: 'confirmed', addToPlan: true })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/v1/wishes/${wishId}/comments`)
      .set('Authorization', `Bearer ${lateFriend.accessToken}`)
      .send({ comment: 'Tell me how it goes' })
      .expect(201);

    const comments = await wishCommentRepository.find({ where: { wishId } });
    expect(comments).toHaveLength(1);
  });

  it('creates shared task plans visible to owner and confirmed participants', async () => {
    const owner = await devLogin('owner-visibility@test.local');
    const friend = await devLogin('friend-visibility@test.local');

    const wishId = await createSharedWish(owner.accessToken, [friend.user.id]);

    await request(app.getHttpServer())
      .post(`/api/v1/wishes/${wishId}/respond`)
      .set('Authorization', `Bearer ${friend.accessToken}`)
      .send({ status: 'confirmed', addToPlan: true })
      .expect(201);

    const createPlanResponse = await request(app.getHttpServer())
      .post(`/api/v1/wishes/${wishId}/create-plan`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ startDate: '2026-04-06T18:00:00.000Z', endDate: '2026-04-06T20:00:00.000Z' })
      .expect(201);

    const ownerTasksResponse = await request(app.getHttpServer())
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    const friendTasksResponse = await request(app.getHttpServer())
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${friend.accessToken}`)
      .expect(200);

    expect(ownerTasksResponse.body.some((task: Task) => task.id === createPlanResponse.body.planTaskId)).toBe(true);
    expect(friendTasksResponse.body.some((task: Task) => task.id === createPlanResponse.body.planTaskId)).toBe(true);
  });

  it('returns unread notifications for share, response, comment, and plan creation', async () => {
    const owner = await devLogin('owner-notifications@test.local');
    const friend = await devLogin('friend-notifications@test.local');

    const wishId = await createSharedWish(owner.accessToken, [friend.user.id]);

    await request(app.getHttpServer())
      .post(`/api/v1/wishes/${wishId}/respond`)
      .set('Authorization', `Bearer ${friend.accessToken}`)
      .send({ status: 'confirmed', addToPlan: true })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/wishes/${wishId}/comments`)
      .set('Authorization', `Bearer ${friend.accessToken}`)
      .send({ comment: 'I can bring drinks' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/wishes/${wishId}/create-plan`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ startDate: '2026-04-06T18:00:00.000Z', endDate: '2026-04-06T20:00:00.000Z' })
      .expect(201);

    const ownerNotifications = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    const friendNotifications = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${friend.accessToken}`)
      .expect(200);

    expect(ownerNotifications.body.unreadCount).toBeGreaterThanOrEqual(2);
    expect(friendNotifications.body.unreadCount).toBeGreaterThanOrEqual(2);
  });
});
