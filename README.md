# LifeDashboard

Monorepo gồm:

- `apps/backend`: NestJS API, PostgreSQL, Google OAuth, deploy serverless/Vercel hoặc container
- `apps/frontend`: React + Vite client
- `packages/shared`: shared types

## Environment Files

Mỗi app có 2 loại file:

- `.env`: dùng local, đã bị ignore khỏi git
- `.env.sample`: template commit lên repo

Các file hiện có:

- `apps/backend/.env.sample`
- `apps/backend/.env.production.sample`
- `apps/frontend/.env.sample`
- `apps/frontend/.env.production.sample`

## Local Setup

1. Cài dependency:

```bash
npm install
```

2. Điền giá trị local vào:

- `apps/backend/.env`
- `apps/frontend/.env`

3. Chạy PostgreSQL local bằng Docker:

```bash
docker compose up -d db
```

4. Chạy backend và frontend:

```bash
npm run dev --workspace apps/backend
npm run dev --workspace apps/frontend
```

## Deploy Variables

Backend dùng các biến:

- `DATABASE_URL`
- `DB_SSL`
- `DB_SYNCHRONIZE`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `FRONTEND_URL`

Frontend dùng:

- `VITE_API_URL`

## Notes

- Subapage/managed PostgreSQL nên dùng `DATABASE_URL` dạng connection string.
- Bộ `DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE` chỉ giữ cho local Docker/dev.
- `DB_SYNCHRONIZE=false` cho production.
- `GOOGLE_CALLBACK_URL` phải trỏ đúng domain backend public.
- `FRONTEND_URL` phải khớp domain frontend để OAuth redirect và CORS hoạt động đúng.
