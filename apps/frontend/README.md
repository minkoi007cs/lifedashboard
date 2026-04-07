# Frontend

React + Vite client cho LifeDashboard.

## Product pages

This frontend now includes the following application areas:

- Dashboard
- Tasks
- Habits
- Finance
- Calories
- Wishlist

## Contextual help

- Every page now has contextual English help content.
- Help opens in a right-side panel from a small help icon placed next to the sidebar settings control.
- The login page has its own help trigger in the auth card.
- Help content is stored as separate HTML files inside `src/help/`.
- The `/focus` route intentionally reuses dashboard help because it currently points to the dashboard page.

## Wishlist module

The wishlist page provides:

- `My Wishlist`: create, edit, delete, share, and review responses.
- `Friends' Wishes`: respond to shared wishes with confirm, decline, or comment.
- Shared activity planning: confirmed activity wishes can become shared task calendar entries with start and end times.
- Persistent wish comment threads for ongoing discussion even after a plan is created.
- Clickable unread notifications surfaced from backend social actions.

## Env Files

- `.env`: local only, bá»‹ ignore khá»i git
- `.env.sample`: template local/dev
- `.env.production.sample`: template deploy cloud

Biáº¿n Ä‘ang dÃ¹ng:

- `VITE_API_URL`

## Local Development

1. Copy `.env.sample` thÃ nh `.env`
2. Cháº¡y:

```bash
npm run dev
```

App máº·c Ä‘á»‹nh cháº¡y á»Ÿ `http://localhost:5173`.

## Production

- `VITE_API_URL` pháº£i trá» tá»›i public backend URL
- URL nÃ y pháº£i khá»›p vá»›i `FRONTEND_URL` vÃ  `GOOGLE_CALLBACK_URL` phÃ­a backend

## Validation

```bash
npm run build
```
