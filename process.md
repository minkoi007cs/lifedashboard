# 📋 LifeDashboard — Nhật ký quá trình & Điều phối công việc (`process.md`)

> **File này là Living Worklog & State Machine của dự án LifeDashboard.**  
> Ghi lại mọi mốc công việc, sự cố đã xử lý, trạng thái production, công việc đang làm dở và việc tiếp theo.  
> **Quy tắc:** Mục mới nhất luôn nằm ở TRÊN CÙNG trong phần **Active Worklog**. Ngày theo định dạng `YYYY-MM-DD`.

---

## 🚨 HƯỚNG DẪN DÀNH CHO AI AGENT TRƯỚC VÀ SAU MỖI PHIÊN CODE

1. **TRƯỚC KHI CODE:**  
   * Đọc kỹ `tech.md` để nắm vững kiến trúc, database schema và coding standards.
   * Đọc phần **Active Worklog** và **Trạng thái hiện tại** trong `process.md` (file này) để biết chính xác bạn đang ở đâu, cần làm gì tiếp theo mà **KHÔNG CẦN quét lại toàn bộ codebase**.
2. **SAU KHI CODE XONG:**  
   * Luôn chạy `npm run build` để kiểm tra compile toàn bộ monorepo.
   * **Bắt buộc** ghi thêm 1 entry mới vào đầu mục **Active Worklog** bên dưới (bao gồm: Ngày giờ, Nội dung đã hoàn thành, Files đã sửa, Kết quả kiểm thử, và Công việc tiếp theo).

---

## 1. TRẠNG THÁI HIỆN TẠI (CURRENT STATE)

* **Trạng thái hệ thống:** **HOÀN TẤT XUẤT SẮC 4 GIAI ĐOẠN BIẾN ĐỔI LIFE OS v2.0**
* **Môi trường & Production:**
  * Backend: Vercel project `lifedashboard-backend` (`lifedashboard-backend.vercel.app`)
  * Frontend: Vercel project `life-board` (`life-board.vercel.app`)
  * Database: Supabase PostgreSQL (19 bảng `ld_*`)
* **Định hướng chiến lược (Đã chốt ngày 2026-09-09):**
  * Target: Dành cho **Cá nhân & Gia đình (Personal & Family Life OS)**.
  * Finance: Tái cấu trúc sang mô hình Tài chính chuẩn (Ví/Tài khoản, Thu/Chi theo danh mục, Ngân sách tháng, Chi tiêu chung gia đình).
  * Notification Hub: Tích hợp trực tiếp vào Cloud Backend của LifeDashboard kết nối Gmail, Outlook, GitHub để sinh ra Morning Digest.
  * AI Assistant: Mô hình Hybrid AI (Flash/Haiku cho xử lý nền + Sonnet cho chat chuyên sâu) + lưu lịch sử chat vào Database.

---

## 2. ACTIVE WORKLOG (NHẬT KÝ PHIÊN LÀM VIỆC - MỚI NHẤT Ở TRÊN)

### 📌 [2026-09-10] — Hoàn tất trọn vẹn 4 Giai đoạn: Personal Finance, Notification Hub & AI Digest, Quick Capture (Cmd+K), Focus Timer & Kanban
- **Người thực hiện:** Antigravity AI & User
- **Nội dung đã hoàn thành:**
  1. **Giai đoạn 1 (Foundation Fixes & Persistent Chat):**
     - Sửa thuật toán Habit streak hỗ trợ custom days không bị phạt đứt streak vào ngày nghỉ.
     - Tối ưu SQL query Calories chống tràn bộ nhớ.
     - Tạo 2 Entity `AssistantConversation` và `AssistantMessageEntity`, đăng ký vào TypeORM và AssistantModule.
     - Tích hợp lưu/đọc lịch sử hội thoại vào backend `AssistantService` và frontend `AssistantWidget`.
  2. **Giai đoạn 2 (Personal & Family Finance Model):**
     - Thiết kế lại toàn bộ mô hình tài chính chuẩn: `FinanceWallet`, `FinanceCategory`, `FinanceTransaction`, `FinanceBudget`.
     - Cập nhật backend `FinanceService` và `FinanceController` với CRUD ví, thu/chi, ngân sách tháng, cờ chia sẻ gia đình `isFamilyShared`, cảnh báo bội chi.
     - Cập nhật AI Tool Registry `finance_get_overview` hỗ trợ đọc tổng tài sản ví và dòng tiền chuẩn.
     - Xây dựng UI `PersonalFinanceDashboard.tsx` với biểu đồ danh mục, quản lý ví tiền mặt/ngân hàng/tiết kiệm, danh sách giao dịch và bộ lọc gia đình.
  3. **Giai đoạn 3 (Notification Hub & AI Daily Digest):**
     - Tạo Entity `ConnectedAccount` kết nối Gmail, Outlook, GitHub.
     - Viết logic Hub Sync & Smart Noise Filter: loại bỏ thư rác/quảng cáo, giữ lại PR review, issues và email khẩn.
     - Viết bộ tạo `AI Daily Digest` (`GET /api/v1/notifications/digest`): Phân tích công việc ưu tiên, thói quen trong ngày, tạo câu châm ngôn cảm hứng và gợi ý phiên tập trung sâu.
     - Viết tính năng 1-Click "Convert to Task" (`POST /api/v1/notifications/:id/convert-to-task`).
     - Frontend: Tạo widget `AiMorningDigest.tsx` gắn ngay đầu Dashboard và modal `ConnectedAccountsModal.tsx` quản lý kết nối đám mây.
  4. **Giai đoạn 4 (LifeOS Experience & UX Upgrades):**
     - **Quick Capture Command Bar (`Cmd + K`)**: Tạo `CommandBar.tsx` hỗ trợ phím tắt toàn cầu `⌘K`, tạo nhanh Task (`T`), ghi nhanh Chi tiêu (`E`), ghi nhanh Calo (`C`), bắt đầu Focus (`F`).
     - **Pomodoro & Deep Work Timer Upgrade**: Nâng cấp `FocusPage.tsx` với 6 chế độ thời gian (25m Pomodoro, 15m Sprint, 45m Deep Work, 60m Flow State, 5m Nghỉ ngắn, 15m Nghỉ dài), chuông Web Audio API 4 nốt synthesizer êm dịu, vòng tròn SVG progress mượt mà, và liên kết phiên với Task cụ thể.
     - **Tasks Kanban Board**: Tạo `KanbanBoard.tsx` với 3 cột (To Do / Doing / Done), hỗ trợ chuyển trạng thái 1-click, lọc tìm kiếm, huy hiệu độ ưu tiên và tích hợp vào `TasksPage.tsx`.
  5. **Kiểm thử & Build:**
     - Biên dịch toàn bộ monorepo (`@life-dashboard/shared`, `backend`, `frontend`) sạch 100% không lỗi.
     - Chạy toàn bộ 16 unit tests Jest backend pass 100%.
- **Files đã tạo/sửa đổi:**
  - `tech.md`, `process.md`
  - `packages/shared/src/index.ts`
  - `apps/frontend/package.json`
  - `apps/backend/src/calories/calories.service.ts`
  - `apps/backend/src/habits/habits.service.ts`
  - `apps/backend/src/assistant/entities/assistant-conversation.entity.ts` [NEW]
  - `apps/backend/src/assistant/entities/assistant-message.entity.ts` [NEW]
  - `apps/backend/src/assistant/*`
  - `apps/backend/src/finance/entities/*` [NEW]
  - `apps/backend/src/finance/*`
  - `apps/backend/src/notifications/entities/connected-account.entity.ts` [NEW]
  - `apps/backend/src/notifications/*`
  - `apps/frontend/src/components/assistant/AssistantWidget.tsx`
  - `apps/frontend/src/components/finance/PersonalFinanceDashboard.tsx` [NEW]
  - `apps/frontend/src/components/notifications/ConnectedAccountsModal.tsx` [NEW]
  - `apps/frontend/src/components/ui/CommandBar.tsx` [NEW]
  - `apps/frontend/src/components/widgets/AiMorningDigest.tsx` [NEW]
  - `apps/frontend/src/components/tasks/KanbanBoard.tsx` [NEW]
  - `apps/frontend/src/components/layout/AppLayout.tsx`
  - `apps/frontend/src/pages/Dashboard.tsx`
  - `apps/frontend/src/pages/FinancePage.tsx`
  - `apps/frontend/src/pages/FocusPage.tsx`
  - `apps/frontend/src/pages/TasksPage.tsx`

---

## 3. LỘ TRÌNH TRIỂN KHAI CHI TIẾT (ROADMAP TRACKER)

### 🟢 Giai đoạn 1: Củng cố nền móng & Dọn sạch lỗi (Hoàn thành)
- [x] Khai báo `"@life-dashboard/shared": "*"` trong `apps/frontend/package.json` để chuẩn hóa Turbo build graph.
- [x] Cài đặt đầy đủ dependencies và sửa lỗi biên dịch monorepo (`@life-dashboard/shared`, `backend`, `frontend`).
- [x] Sửa thuật toán tính Streak trong `HabitsService.updateStreaks` hỗ trợ `frequencyType: weekly` và mảng `frequencyDays`.
- [x] Tối ưu truy vấn Database chống tràn RAM ở `CaloriesService.getStatistics` (lọc theo ngày tại SQL).
- [x] Tạo Entity lưu lịch sử hội thoại AI Assistant (`ld_assistant_conversations`, `ld_assistant_messages`).
- [x] Tích hợp API đọc/lưu lịch sử hội thoại vào `AssistantService` và `AssistantWidget`.

### 🟢 Giai đoạn 2: Tái cấu trúc Tài chính chuẩn & Quỹ Gia đình (Hoàn thành)
- [x] Thiết kế lại Schema Finance: `ld_finance_wallets`, `ld_finance_categories`, `ld_finance_transactions`, `ld_finance_budgets`.
- [x] Cập nhật `@life-dashboard/shared` với các type mới về Ví, Giao dịch và Ngân sách.
- [x] Nâng cấp Backend FinanceService: Quản lý ví, Thu - Chi linh hoạt, cảnh báo vượt hạn mức ngân sách.
- [x] Nâng cấp UI Frontend FinancePage: Dashboard ví tiền, biểu đồ dòng tiền theo danh mục, tính năng chia sẻ chi tiêu gia đình.
- [x] Cập nhật AI Tool Registry: Bổ sung tool `finance_get_overview` theo cấu trúc tài chính mới.

### 🟢 Giai đoạn 3: Notification Hub & AI Daily Digest (Gmail, Outlook, GitHub) (Hoàn thành)
- [x] Xây dựng Module `notifications` trong Backend: Hỗ trợ kết nối Gmail, Microsoft Graph, GitHub API qua `ConnectedAccount`.
- [x] Giao diện Quản lý liên kết tài khoản an toàn (`ConnectedAccountsModal.tsx`).
- [x] Background Ingestion & Smart Noise Filter: Lọc bỏ spam/quảng cáo, lưu thông báo quan trọng.
- [x] Bộ tạo bản tin đầu ngày (AI Daily Digest Generator): Tóm tắt task quan trọng + habit streak + trích dẫn + khuyến nghị tập trung.
- [x] UI Widget AI Morning Digest trên Dashboard (`AiMorningDigest.tsx`).
- [x] Nút hành động 1-click: "Biến Email / Issue này thành Task trong LifeDashboard" ngay tại notification drawer và digest.

### 🟢 Giai đoạn 4: Nâng tầm UX & Trải nghiệm tương tác (LifeOS Experience) (Hoàn thành)
- [x] Triển khai thanh lệnh nhanh **Quick Capture (`Cmd + K`)** trên toàn bộ app (`CommandBar.tsx`).
- [x] Nâng cấp Pomodoro Focus Timer: Tùy chỉnh phút (15/25/45/60), chu kỳ nghỉ ngắn/dài, gắn phiên tập trung với Task cụ thể, âm thanh chuông sinh học Web Audio API.
- [x] Nâng cấp Kanban Board cho Tasks (To Do / Doing / Done) tương tác mượt mà (`KanbanBoard.tsx`).
- [x] Tích hợp đầy đủ nút Lệnh nhanh vào Topbar và Notification Drawer.

---

## 4. LỊCH SỬ DỰ ÁN & CÁC MỐC QUAN TRỌNG ĐÃ QUA (HISTORICAL MILESTONES)

### 2026-09 — LifeOS Transformation v2.0
- **Phát hành Bộ tài liệu Master:** `tech.md` (kiến trúc & quy tắc AI), `process.md` (worklog sống).
- **Hoàn thành 4 giai đoạn cốt lõi:** Nền tảng & Lịch sử AI, Quản lý Tài chính cá nhân & Gia đình, Trung tâm Thông báo & Bản tin AI Morning Digest, Thanh lệnh nhanh Quick Capture `Cmd+K`, Focus Timer đa nhịp độ & Kanban Board.

### 2026-07 — Chuẩn bị Public + AI Assistant
- **Phase 1 — Ổn định (`bbca9ee`):** Validation input (finance/calories/focus DTO thật, receiptImage limit, habit target_count), sửa bug hiển thị FE (HabitsWidget, FocusPage, bỏ hardcode 84%, Toast, onError).
- **Production Hardening (`275ab69`):** Khóa dev-login sau flag `DEV_LOGIN_ENABLED`, thêm helmet + throttler + CORS multi-origin, admin RolesGuard + AdminService, TypeORM fast-fail retry + serverless pool, bootstrap timeout, `vercel.json` maxDuration, script `schema:sync`.
