# Frontend

React + Vite client cho LifeDashboard.

## Env Files

- `.env`: local only, bị ignore khỏi git
- `.env.sample`: template local/dev
- `.env.production.sample`: template deploy cloud

Biến đang dùng:

- `VITE_API_URL`

## Local Development

1. Copy `.env.sample` thành `.env`
2. Chạy:

```bash
npm run dev
```

App mặc định chạy ở `http://localhost:5173`.

## Production

- `VITE_API_URL` phải trỏ tới public backend URL
- URL này phải khớp với `FRONTEND_URL` và `GOOGLE_CALLBACK_URL` phía backend

## Validation

```bash
npm run build
```
