# LifeDashboard — Nhật ký quá trình (process log)

> File này ghi lại tất cả những gì đã làm trên dự án: kiến trúc, mốc công việc,
> sự cố đã xử lý, trạng thái production, việc còn nợ và roadmap.
> Mới nhất ở trên cùng trong mỗi mục. Ngày theo định dạng YYYY-MM-DD.

---

## 1. Tổng quan dự án

**LifeDashboard** — app quản lý cuộc sống cá nhân (tài chính, calo/ăn uống, task,
thói quen, focus/pomodoro, wishlist) + **AI Assistant**. App private cho user và vài
người bạn, đang hoàn thiện để tiến tới public + trả phí.

**Monorepo (npm workspaces + Turbo):**
- `apps/backend` — NestJS 11 + TypeORM + PostgreSQL (Supabase) + Google OAuth/JWT + Swagger. Prefix API `api/v1`. Entity dùng prefix bảng `ld_`.
- `apps/frontend` — React 19 + Vite + Tailwind 4 + TanStack Query + Zustand + React Router 7.
- `packages/shared` (`@life-dashboard/shared`) — type dùng chung 2 tầng (nguồn type duy nhất sau chuẩn hóa).

**Convention:** camelCase toàn bộ ở API boundary (sau chuẩn hóa). Type request/response
đặt ở `packages/shared`, cả 2 tầng import — không nhân bản.

---

## 2. Môi trường & Deploy

**Vercel** (team `team_gdfTsbe7HlR4ubjw26KK1Fc4`), auto-deploy từ branch **`main`**:
- Backend: project **`lifedashboard-backend`** (`prj_QuJrkFMLZNpIvXZz1HSEK9HgZDAD`) → `lifedashboard-backend.vercel.app`.
- Frontend: project **`life-board`** (`prj_ZJDVpoIFY6uj2sBc6RQIj7m7AKAq`).

**Database:** Supabase project ref `dbzujfyfvxtewfhllice`. Schema 19 bảng `ld_*` đã tạo
bằng script `schema:sync` (dev dùng `DB_SYNCHRONIZE`, prod dùng schema đã sync + `DB_SYNCHRONIZE=false`).

**Env quan trọng (backend, set trên Vercel — Production scope):**
`DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `GOOGLE_CALLBACK_URL`,
`FRONTEND_URL`, `ANTHROPIC_API_KEY`, `DEV_LOGIN_ENABLED` (không set/false ở prod).

**Bài học env:** biến env chỉ vào runtime của deploy **tạo SAU khi set**; phải đúng
**project** + tick **Production**. Set nhầm project/scope là lỗi phổ biến nhất.

---

## 3. Lịch sử công việc (mốc chính)

### 2026-07 — Chuẩn bị public + AI

- **Phase 1 — Ổn định (commit `bbca9ee`):** validation input (finance/calories/focus DTO thật, receiptImage limit, habit target_count), sửa bug hiển thị FE (HabitsWidget, FocusPage, bỏ hardcode 84%, Toast, onError).
- **Production hardening (`275ab69`):** khóa dev-login sau flag `DEV_LOGIN_ENABLED`, thêm helmet + throttler + CORS multi-origin, admin RolesGuard + AdminService, TypeORM fast-fail retry + serverless pool, bootstrap timeout, `vercel.json` maxDuration, script `schema:sync`.
- **Phase 4 — AI Assistant (`7791f09`):** endpoint `POST /api/v1/assistant/chat` (Bearer JWT), Claude API + tool-use qua `@anthropic-ai/sdk`, model **`claude-sonnet-5`**. Tool READ chạy ngay; tool MUTATE trả `pending_confirmation`, thực thi khi user confirm (round-trip 2). `userId` luôn từ JWT. Thiếu `ANTHROPIC_API_KEY` → reply graceful, không crash. Widget chat nổi (`AssistantWidget`) trên mọi trang đã login.
- **Mở rộng tool (`0e46d7b`):** registry lên **18 tool** — finance ×4, calories ×3, tasks ×3, habits ×3, focus ×2, wishlist ×3.
- **Chuẩn hóa `packages/shared` A+B (`3b65e3e`):**
  - *Phase A:* đưa type domain (finance, calories, tasks, focus, wishlist) vào shared làm nguồn duy nhất; FE import thay vì tự định nghĩa (finance trước lặp inline 3 lần). Xóa dead/wrong exports.
  - *Phase B:* habits về **camelCase** ở API boundary qua `@Column({ name: 'snake_case' })` — **không migration DB**. Fix bug `HabitModal` edit (đọc `frequencyType` từ payload snake → luôn undefined).
- **Prompt hội thoại ấm áp (`0d3bbf3`):** agent chào hỏi tự nhiên, trả lời theo ngôn ngữ user, chỉ gọi tool khi thật sự cần.

---

## 4. Kiến trúc AI Assistant

- **Endpoint:** `POST /api/v1/assistant/chat` (Bearer JWT).
- **Contract (types ở `packages/shared`):** `ChatRequest { messages, confirmedActions? }`, `ChatResponse { reply, actions }`, `AssistantMessage`, `AssistantAction { id, toolName, description, status, result?, params?, errorMessage? }`, `ConfirmedAction`.
- **Luồng MUTATE (2 round-trip):** turn 1 Claude gọi tool → intercept → trả `pending_confirmation` (kèm `params`, `description`) → FE hiện thẻ Confirm/Cancel → turn 2 gửi lại history + `confirmedActions` → thực thi → `done`.
- **Bảo mật:** `userId` từ JWT, tool không nhận userId từ input.
- **Model:** `claude-sonnet-5` (đổi từ opus để tiết kiệm chi phí).

---

## 5. Sự cố đã xử lý

1. **504 login prod:** `DATABASE_URL` sai → sửa → DB connect OK.
2. **500 `relation ld_users does not exist`:** DB Supabase rỗng → chạy `schema:sync` tạo 19 bảng.
3. **Deploy FAIL `TS2307 Cannot find module '@life-dashboard/shared'`** (cả backend `8c92bf1` lẫn frontend `5ea391c`): nguyên nhân — package chưa khai báo `@life-dashboard/shared` là dependency nên turbo không build `shared` trước. Fix: thêm dep vào `apps/backend/package.json` và `apps/frontend/package.json`. **Đây là lý do widget chat không hiện lúc đầu** (frontend prod fail deploy, kẹt bản cũ).
4. **Assistant báo "ANTHROPIC_API_KEY not configured":** key chưa nằm đúng Production env của project backend (không phải lỗi code — `configService.get` đọc chuẩn). Fix bằng set đúng project + scope Production + redeploy.

---

## 6. Việc còn nợ / rủi ro

- 🔴 **Rotate secrets đã lộ:** DB password Supabase + `ANTHROPIC_API_KEY` (từng dán trong chat).
- 🔴 **Response DTO / `ClassSerializerInterceptor`:** backend hiện trả entity thô (lộ `userId`, thừa field).
- 🟠 **Throttler in-memory** → cần Redis (Upstash) cho serverless.
- 🟠 **Error monitoring** (Sentry) + structured logging.
- 🟡 **Bundle FE ~1MB** — cần code-split theo route.
- `packages/shared` còn thiếu vài type (wishlist feed: `FeedWish`/`WishlistUser`…, focus request `CreateFocusPayload`) — FE đang giữ local.

---

## 7. Roadmap đề xuất (ưu tiên)

- **P0 (trước public/trả phí):** rotate secrets · response DTO · throttler Redis · error monitoring.
- **P1 (nâng chất AI):** **streaming SSE** (đang làm) · render kết quả đẹp · lưu lịch sử chat · prompt caching · guardrail chi phí (fallback haiku).
- **P2 (UX polish):** code-split bundle · loading skeleton + empty state · mobile → PWA · onboarding.
- **P3 (feature sâu):** finance (budget, giao dịch định kỳ, export) · calories (barcode, meal template, streak) · nhắc nhở + digest tuần bằng AI.
- **Trả phí:** Stripe · export/xóa tài khoản · privacy policy + terms · analytics.

---

## 8. Tiến độ P1 — nâng chất AI (đang chạy)

- ✅ **Prompt hội thoại ấm áp** (`0d3bbf3`) — agent chào hỏi tự nhiên, theo ngôn ngữ user.
- ✅ **Streaming SSE** (`2b504ce` BE + `e96f1e9` FE) — endpoint `POST /assistant/chat/stream` additive (endpoint JSON cũ nguyên vẹn); `AssistantWidget` dùng `fetch`+`ReadableStream`, chữ hiện dần, typing indicator, AbortController. *Caveat: Vercel Node serverless có thể buffer → chưa chắc hiện dần từng chữ trên prod; muốn stream thật cần chuyển Edge Runtime (follow-up).*
- ✅ **Prompt caching** (`2da90ac`) — cache prefix ổn định (tools + system prompt) qua `cache_control: ephemeral`; phần này gửi lại mỗi vòng tool-use nên tiết kiệm ~90% chi phí input của nó (cache read ~10% giá gốc). Log debug `cache_read/write_input_tokens` để nghiệm thu.
- ⏳ **Còn lại P1:** render kết quả tool đẹp (markdown, thẻ) — FRONTEND (đang chờ, worker rate-limited); lưu lịch sử chat; guardrail chi phí sâu hơn (fallback `claude-haiku-4-5` rẻ ~3×, đổi qua env — KHÔNG đổi model giữa hội thoại vì vỡ cache).

## Ghi chú model & chi phí (Claude API)
- Model hiện tại: `claude-sonnet-5` ($3/$15 per MTok; intro $2/$10 tới 2026-08-31). `claude-haiku-4-5` = $1/$5, rẻ ~3× — cân nhắc cho tác vụ nhẹ.
- Prompt caching: ngưỡng tối thiểu ~1–2k token cho Sonnet-tier; hòa vốn từ request thứ 2. Đổi model giữa hội thoại làm mất cache.
