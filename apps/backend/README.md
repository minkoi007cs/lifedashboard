# Backend

NestJS API cho LifeDashboard.

## Env Files

- `.env`: local only, bá»‹ ignore khá»i git
- `.env.sample`: template local/dev
- `.env.production.sample`: template deploy cloud

Biáº¿n Ä‘Æ°á»£c há»— trá»£:

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

## Custom modules

This backend now includes additional product modules beyond the Nest starter template:

- `tasks`: supports personal tasks and shared plan participants.
- `wishes`: personal wishlist entries, sharing, responses, and plan creation from confirmed activity wishes.
- `notifications`: lightweight unread notification feed for social wishlist actions.
- `users/search`: name and email search for sharing wishes with registered users.
- `wishes/comments`: persistent comment thread on each shared wish.

## Wishlist flow

- Create a wish with `type`, `title`, `description`, and `timeTag`.
- Share a wish with selected users in the system.
- Recipients can confirm, decline, or comment.
- Confirmed activity wishes can be converted into shared task plans with explicit start and end times.
- Notifications are created when wishes are shared, answered, updated, or converted into plans.

## Validation and tests

- Wishlist business rules are covered by backend e2e tests.
- The shared plan flow is verified for visibility across owner and participants.
- Comments remain open after plan creation, while new responses are blocked.

## Local Development

1. Copy `.env.sample` thÃ nh `.env`
2. Cháº¡y PostgreSQL local
3. Cháº¡y:

```bash
npm run dev
```

API cháº¡y táº¡i `http://localhost:3000`.

Swagger:

```text
http://localhost:3000/api/v1/docs
```

## Production

- Subapage/managed PostgreSQL dÃ¹ng `DATABASE_URL` dáº¡ng connection string
- Set `DB_SSL=true`
- Set `DB_SYNCHRONIZE=false`
- Set `FRONTEND_URL` Ä‘Ãºng domain frontend public
- Set `GOOGLE_CALLBACK_URL` Ä‘Ãºng domain backend public

## Validation

```bash
npm run build
npm run test
npm run test:e2e
```
