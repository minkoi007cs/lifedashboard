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

## Finance module

- Daily Entry uses one shared description for the whole day.
- Money input is compacted into one area with `Income` and `Expense` tabs.
- Income is tracked as two simple values: `Income Check` before tax and `Income Cash` already received.
- The app no longer calculates commission or uses pay-period entry flows.
- Previous `Service Sales` values are treated as `Income Check`; previous `Cash Tips` values are treated as `Income Cash`.
- Tax is estimated only from check income at 15%.
- Expense entries created from the Daily Entry form reuse the shared daily description.
- Finance Dashboard has drill-down KPI boxes for check income, cash income, total income, expenses, taxes, and balance/shortfall.
- Each dashboard KPI remembers its selected period in local browser storage.
- Finance report charts support independent remembered periods for month, rolling duration, year, and all-time views.
- Report charts show income, expenses, tax, and balance together instead of income-only snapshots.
- Finance report charts show day-by-day rows for shorter periods and week-by-week rows for yearly/all-time periods.
- Finance money display uses US-style grouping with two decimals and a trailing dollar sign, for example `1,000.00$`.

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
