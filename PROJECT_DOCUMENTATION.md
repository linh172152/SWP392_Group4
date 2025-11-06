# EV Battery Swap Station Management System – Backend Documentation

## Project Overview

- **Purpose**: Manage EV battery swap stations, bookings, pricing, and support operations for drivers, staff, and admins.
- **Architecture**: Node.js + Express (TypeScript) REST API, Prisma ORM, PostgreSQL, Socket.IO for real-time events.
- **Environments**: Local development (`docker-compose` or local Postgres) and Render Cloud (production). `.env` controls database and integration keys.
- **Key Principles**: Wallet-first billing, subscription perks handled separately, no promotions or cash payments in scope, auditability of every financial event.

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
  - Manage vehicles, search stations, book swaps (scheduled/instant), track wallet balance & history.
  - Subscriptions (fixed-term service packages) grant perks like bundled swaps but **swap completion still charges wallet using `BatteryPricing`**; subscription benefits are accounted when calculating the amount but funds settle via wallet.
- **Staff Console**:
  - Handle on-site bookings: PIN verification, swap completion, wallet deduction, issue resolution.
  - Inventory oversight for station batteries, including SoH insight and transfer requests.
- **Admin Console**:
  - CRUD for stations, staff, users, `BatteryPricing`, `TopUpPackage`, and service packages.
  - Demand forecasting, dashboard reports, battery transfer approvals, support ticket workflow.
- **Wallet & Transactions**: Ledger of wallet credits/debits, swap payment settlement, VNPay top-ups. No cash handling, no promotion codes.
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
- Driver: `/api/driver/*` for vehicles, bookings, transactions, wallet, subscriptions.
- Staff: `/api/staff/batteries`, `/api/staff/bookings`, `/api/staff/transactions` (no cash endpoints).
- Admin:
  - `/api/admin/users`, `/stations`, `/staff`.
  - `/api/admin/pricing` (`BatteryPricing`), `/topup-packages`.
  - `/api/admin/dashboard` (reports & metrics including SoH aggregates).
  - `/api/admin/battery-transfers` (create/list/detail transfers).
  - `/api/admin/support` (ticket assignment, replies, status updates).
  - `/api/admin/forecast/bookings` (7-day booking forecast from recent history).
- Shared: `/api/support`, `/api/ratings`, `/api/maps`.
- Public packages: `/api/packages` (active service packages).

## Key Flows

- **Subscription Purchase**: Driver selects package → `subscribeToPackage` validates availability → wallet charged or VNPay payment recorded → `UserSubscription` created. Booking execution still consults subscription benefits but charges wallet based on active `BatteryPricing` (no cash).
- **Wallet Funding**: VNPay transaction → callback updates `Wallet` balance, logs `Payment` record, notifies driver.
- **Booking Lifecycle**: Creation (with subscription flag) → staff check-in → swap completion triggers `Transaction` + wallet deduction → notifications/receipts dispatched.
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
- Wallet Integrity: All wallet mutations must create a `Payment` or transaction log entry; no direct balance edits.

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

