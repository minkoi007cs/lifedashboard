# Backend

NestJS API cho LifeDashboard.

## Env Files

- `.env`: local only, bị ignore khỏi git
- `.env.sample`: template local/dev
- `.env.production.sample`: template deploy cloud

Biến được hỗ trợ:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`
- `DB_SSL`
- `DB_SYNCHRONIZE`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `FRONTEND_URL`

## Local Development

1. Copy `.env.sample` thành `.env`
2. Chạy PostgreSQL local
3. Chạy:

```bash
npm run dev
```

API chạy tại `http://localhost:3000`.

Swagger:

```text
http://localhost:3000/api/v1/docs
```

## Production

- Subapage/managed PostgreSQL dùng `DATABASE_URL` dạng connection string
- Set `DB_SSL=true`
- Set `DB_SYNCHRONIZE=false`
- Set `FRONTEND_URL` đúng domain frontend public
- Set `GOOGLE_CALLBACK_URL` đúng domain backend public

## Validation

```bash
npm run build
npm run test
npm run test:e2e
```
