# EV Battery Swap Station Management System – Backend Documentation

## Project Overview

- **Purpose**: Manage EV battery swap stations, bookings, pricing, staff shifts, and support operations for drivers, staff, and admins.
- **Architecture**: Node.js + Express (TypeScript) REST API, Prisma ORM, PostgreSQL, Socket.IO for real-time events.
- **Environments**: Local development (`docker-compose` or local Postgres) and Render Cloud (production). `.env` controls database and integration keys.
- **Key Principles**: Wallet-ledger integrity with subscription-first swap settlement (wallet charges only when swaps are exhausted or not covered), no promotions or cash payments in scope, auditability of every financial event.

## Technical Stack

- **Runtime**: Node.js 18, Express 4, TypeScript.
- **Database**: PostgreSQL with Prisma Client & Prisma Migrate.
- **Auth**: JWT access + refresh tokens, typed middleware to inject `req.user`.
- **Payments**: VNPay gateway for external transactions; internal wallet ledger for swap charges, refunds, and package purchases.
- **Real-time**: Socket.IO for in-app notifications (booking reminders, ticket updates, wallet events).
- **Infrastructure**: Render app for production API + Postgres; optional Track-Asia API integration for mapping/ETA (keys stored in `.env`).
- **Tooling**: ESLint (basic TypeScript rules), npm scripts (`dev`, `build`, `start`, `lint`, `prisma:*`).

## Domain Modules & Responsibilities

- **Auth & Users**: Registration/login, token refresh, role-based guard (`authenticateToken`, `authorizeRole`).
- **Driver Experience**:
  - Manage vehicles, search stations, book swaps (scheduled/instant), track wallet balance & history (`/api/driver/...`).
  - Booking engine immediately **reserves a concrete battery** (`batteries.status = reserved`) and locks the funding source: subscription swap or wallet hold.
  - Cancellation policy: nếu driver hủy/no-show, pin được trả lại nhưng lượt/tiền đã trừ **không tự hoàn**, chỉ admin mới hoàn lại ví thủ công.
  - Pricing preview trả về thông tin `hold_summary` (pin, subscription, ví) để frontend thể hiện rõ.
  - Subscriptions vẫn là ưu tiên số 1: swap trừ `remaining_swaps` (hoặc unlimited). Ví chỉ bị trừ khi không có gói bao phủ.
- **Staff Console**:
  - Handle on-site bookings: xác minh qua SĐT, hoàn tất swap **tiêu thụ hold** (đổi pin mới sang `in_use`, pin cũ về `charging`/`maintenance`), không nhập PIN.
  - Giao dịch hoàn tất chỉ đánh dấu payment `reserved → completed`; không trừ ví/gói lần nữa.
  - Manage personal schedules (`/api/staff/schedules`) và cập nhật ca trực.
  - Inventory oversight cho pin trạm, bao gồm SoH và điều phối transfer.
-- **Admin Console**:
  - CRUD for stations, staff, users, station batteries, `BatteryPricing`, `TopUpPackage`, and service packages.
  - Staff scheduling management (`/api/admin/staff-schedules`) with overlap detection and station assignment.
  - Demand forecasting, dashboard reports, battery transfer approvals, support ticket workflow.
- **Wallet & Transactions**: Ledger của các khoản nạp/rút, swap settlement (ví chỉ bị trừ khi gói không cover), VNPay top-up, **wallet hold** khi đặt booking và forfeited nếu hủy muộn. Không xử lý tiền mặt/promotion.
- **Support & Notifications**: Ticket submission, assignment, replies, status transitions; real-time notification dispatch.
- **Battery Lifecycle**: SoH metrics (`health_percentage`, `cycle_count`), capacity warnings, transfer logs, demand forecasting feed.

## Database Highlights

- Prisma schema anchored in `prisma/schema.prisma`; each migration stored in `prisma/migrations/*`.
- Notable models:
  - `Battery`: tracks station assignment, status, SoH fields.
  - `BatteryTransferLog`: records movement with `transfer_status` and audit metadata.
  - `UserSubscription`: subscription ownership per driver.
  - `Wallet` & `Payment`: reconciles top-ups, swap settlements, subscription charges.
- Enum `PaymentMethod` limited to `wallet` and `vnpay` in active flows. `cash`, `momo`, `credit_card` remain for legacy compatibility but unused.
- Manual SQL scripts are stored when automatic migrations are blocked (e.g., Render shadow DB restrictions).

## API Surface (High Level)

- `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`.
- Driver: `/api/driver/vehicles`, `/api/driver/stations`, `/api/driver/bookings`, `/api/driver/wallet`, `/api/driver/transactions`, `/api/driver/subscriptions`, `/api/driver/notifications`.
- Staff: `/api/staff/bookings`, `/api/staff/batteries`, `/api/staff/schedules`.
-- Admin:
  - `/api/admin/users`, `/stations`, `/staff`, `/batteries`.
  - `/api/admin/pricing` (`BatteryPricing`), `/topup-packages`, `/staff-schedules`.
  - `/api/admin/dashboard` (reports & metrics including SoH aggregates).
  - `/api/admin/battery-transfers` (create/list/detail transfers).
  - `/api/admin/support` (ticket assignment, replies, status updates).
  - `/api/admin/forecast/bookings` (7-day booking forecast from recent history).
- Shared: `/api/support`, `/api/ratings`, `/api/maps`.
- Public routes: `/api/packages` (active service packages), `/api/pricing` (read-only `BatteryPricing`), `/api/stations/public` (public station directory & nearby search).

## Key Flows

- **Subscription Purchase**: Driver mua gói → `subscribeToPackage` trừ ví (hoặc ghi nhận VNPay) → tạo `UserSubscription`. Swap completion trừ gói trước, nếu hết lượt mới quay về ví.
- **Subscription Cancellation**: `cancelSubscription` kiểm tra gói chưa dùng và không bị giữ ở booking nào, sau đó hoàn tiền về ví (`Payment` mới `PACKAGE_REFUND`) và cập nhật trạng thái `cancelled`.
- **Wallet Funding**: VNPay transaction → callback updates `Wallet` balance, logs `Payment` record, notifies driver.
- **Booking Lifecycle**:
  1. Driver đặt (scheduled/instant) → hệ thống chọn pin khả dụng, chuyển `status = reserved`, lock subscription/ ví.
  2. Cancel/manual hoặc cron auto-cancel (quá hạn) → gọi `releaseBookingHold` để trả pin và chuyển payment hold sang `forfeited`.
  3. Staff complete → xác định pin cũ, chuyển pin mới `in_use`, `vehicle.current_battery_id` cập nhật, payment `reserved → completed`, ghi `battery_history`.
- **Auto-cancel**: Cron 5 phút kiểm tra booking pending/instant quá thời gian, auto release pin và giữ tiền như chính sách.
- **Battery Transfer**: Admin triggers transfer → validations (station capacity, battery status) → log inserted with `transfer_status` → station inventory updated → SoH recalculated in reports.
- **Support Ticket**: Driver submits ticket → admin assigns staff → replies preserved in `TicketReply` → status updates broadcast via Socket.IO.
- **Reporting**: `report.controller` aggregates bookings, revenue, battery SoH metrics, low-health alerts.

## Environment & Setup

1. Copy `backend/env.example` to `.env` and configure:
   - `DATABASE_URL` (local or Render), `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`.
   - `VNPAY_*` credentials, optional `TRACKASIA_API_KEY`.
2. Install dependencies: `npm install`.
3. Database:
   - Local: `npx prisma migrate dev` (or `deploy` for production). For Render, prefer manual SQL if migrations fail due to shadow DB.
   - Seed (local only): `npm run seed` with `FORCE_SEED=true` if necessary.
4. Run dev server: `npm run dev`. Build for prod: `npm run build` then `npm run start`.
5. Linting: `npm run lint` (uses `.eslintrc.cjs`).

## Operations & Monitoring

- Cron jobs (every 5 min) auto-cancel expired bookings and send reminders.
- Socket.IO namespace ensures notifications propagate to connected clients.
- Healthcheck: `GET /health` returns status, uptime, environment.
- Logging: Morgan (combined), plus structured error handling through `CustomError` + `asyncHandler` wrappers.

## Data Maintenance Guidelines

- SoH Fields: `health_percentage` (DECIMAL 5,2) and `cycle_count` populate during battery creation and periodic audits. For legacy data, run manual SQL updates (see migration notes).
- Transfer Status: Always set `transfer_status` when creating `BatteryTransferLog` to reflect workflow (`pending` → `in_transit` → `completed`/`cancelled`).
- Wallet Integrity: All wallet mutations must create a `Payment` or transaction log entry; no direct balance edits. Subscription swap usage is tracked on `UserSubscription` and mirrored in the transaction metadata.
- Staff Schedule Data: `StaffSchedule` records shift date/time, station, and status; seed script populates demo shifts. Use admin endpoints for CRUD to avoid overlap.

## Known Gaps & Follow-up Work

- Automated test suite (Jest) removed per scope; recommend reinstating API test coverage later.
- Documentation & ERD syncing with future frontend changes.
- Advanced forecasting still placeholder (moving average). Potential upgrade: integrate ML service or richer analytics.

## Appendix

- **Scripts**:
  - `npm run dev` – ts-node-dev with hot reload.
  - `npm run build` – TypeScript compilation.
  - `npm run start` – run compiled server.
  - `npm run lint` – ESLint check.
  - `prisma migrate deploy` – apply SQL migrations (production safe).
- **Post-Migration Manual SQL** (Render): Append missing enum values, add SoH columns, and populate data using provided SQL scripts.
- **Support Contacts**: Update `.env` email addresses and notification hooks when deploying to production.

