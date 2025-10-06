# EV Battery Swap Station - Backend API

Backend API cho hệ thống quản lý trạm đổi pin xe điện.

## 🛠️ Tech Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL 15 (with PostGIS)
- **ORM**: Prisma
- **Cache**: Redis
- **Authentication**: JWT
- **Validation**: Zod

## 📁 Cấu trúc Project

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.ts      # Prisma setup
│   │   ├── redis.ts         # Redis connection
│   │   ├── logger.ts        # Winston logger
│   │   └── env.ts           # Environment variables
│   ├── controllers/         # Route handlers
│   │   └── auth.controller.ts
│   ├── middlewares/         # Express middlewares
│   │   ├── auth.middleware.ts
│   │   ├── authorize.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── routes/              # API routes
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── station.routes.ts
│   │   ├── battery.routes.ts
│   │   └── booking.routes.ts
│   ├── services/            # Business logic (TODO)
│   ├── utils/               # Helper functions
│   │   ├── errors.ts
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── response.ts
│   │   └── booking-code.ts
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
├── prisma/
│   └── schema.prisma        # Database schema
├── package.json
├── tsconfig.json
└── .env.example
```

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env và điền thông tin:
# - DATABASE_URL: PostgreSQL connection string
# - JWT_SECRET: Secret key cho JWT (min 32 chars)
# - JWT_REFRESH_SECRET: Secret key cho refresh token (min 32 chars)
```

### 3. Setup Database

Đảm bảo PostgreSQL đã chạy, sau đó:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

### 4. Start Development Server

```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:5000`

## 📚 API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Đăng ký tài khoản | ❌ |
| POST | `/login` | Đăng nhập | ❌ |
| POST | `/refresh` | Refresh access token | ❌ |
| POST | `/logout` | Đăng xuất | ❌ |

### Users (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/me` | Lấy thông tin user hiện tại | ✅ | All |
| GET | `/` | Lấy danh sách users | ✅ | ADMIN |

### Stations (`/api/v1/stations`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/` | Lấy danh sách trạm | ❌ | Public |
| GET | `/:id` | Lấy thông tin trạm | ❌ | Public |
| POST | `/` | Tạo trạm mới | ✅ | ADMIN |
| PUT | `/:id` | Cập nhật trạm | ✅ | ADMIN, STAFF |

### Batteries (`/api/v1/batteries`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/` | Lấy danh sách pin | ✅ | STAFF, ADMIN |
| GET | `/:id` | Lấy thông tin pin | ✅ | STAFF, ADMIN |
| POST | `/` | Thêm pin mới | ✅ | ADMIN |

### Bookings (`/api/v1/bookings`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/my-bookings` | Lấy bookings của user | ✅ | DRIVER |
| POST | `/` | Tạo booking mới | ✅ | DRIVER |
| PUT | `/:id/cancel` | Hủy booking | ✅ | DRIVER |
| POST | `/:id/checkin` | Check-in booking | ✅ | STAFF |
| GET | `/` | Lấy tất cả bookings | ✅ | STAFF, ADMIN |

## 🔒 Authentication

API sử dụng JWT Bearer token authentication.

### Request Header:
```
Authorization: Bearer <access_token>
```

### Example Login Flow:

1. **Register/Login** → Nhận `accessToken` và `refreshToken`
2. **API Requests** → Gửi kèm `Authorization: Bearer <accessToken>`
3. **Token expired** → Gọi `/auth/refresh` với `refreshToken`

## 🗃️ Database Schema

Xem chi tiết trong `prisma/schema.prisma`

**Main Models:**
- `User` - Người dùng (Driver, Staff, Admin)
- `Vehicle` - Xe điện
- `Station` - Trạm đổi pin
- `Battery` - Pin (theo dõi SoH, status)
- `Booking` - Đặt lịch đổi pin
- `Transaction` - Giao dịch đổi pin
- `Payment` - Thanh toán
- `ServicePackage` - Gói dịch vụ
- `UserSubscription` - Đăng ký gói
- `SupportTicket` - Hỗ trợ khách hàng

## 📝 Development Scripts

```bash
# Development với hot-reload
npm run dev

# Build production
npm run build

# Start production
npm start

# Database commands
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open Prisma Studio GUI

# Code quality
npm run lint               # Check linting
npm run lint:fix           # Fix linting issues
npm run format             # Format code with Prettier

# Testing (TODO)
npm test                   # Run tests
npm run test:watch         # Watch mode
```

## 🔧 Environment Variables

Xem đầy đủ trong `.env.example`

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT secret key (min 32 chars)
- `JWT_REFRESH_SECRET` - Refresh token secret (min 32 chars)

**Optional:**
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `GOOGLE_MAPS_API_KEY` - Google Maps API
- `VNPAY_*`, `MOMO_*` - Payment gateway credentials

## 🐛 Troubleshooting

### Prisma Generate Error
```bash
npx prisma generate --schema=./prisma/schema.prisma
```

### Database Connection Error
- Kiểm tra PostgreSQL đã chạy chưa
- Kiểm tra `DATABASE_URL` trong `.env`
- Test connection: `psql -U postgres -d ev_battery_swap`

### TypeScript Errors
```bash
# Rebuild
rm -rf dist node_modules
npm install
npm run build
```

## 📖 Next Steps

1. ✅ Hoàn thiện các controllers còn thiếu
2. ✅ Thêm business logic vào services
3. ✅ Implement Socket.io cho real-time updates
4. ✅ Thêm pagination, filtering cho các list APIs
5. ✅ Viết tests (Jest + Supertest)
6. ✅ Setup CI/CD
7. ✅ Thêm API documentation (Swagger)

## 👥 Team

SWP392 Group 4

## 📄 License

MIT

