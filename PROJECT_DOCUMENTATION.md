# 📚 EV Battery Swap Station Management System - Complete Documentation

## 📊 Project Overview

**EV Battery Swap Station Management System** là hệ thống quản lý trạm đổi pin xe điện toàn diện, được phát triển bởi **SWP392 Group 4** tại FPT University. Hệ thống hỗ trợ quản lý trạm đổi pin, đặt lịch, thanh toán, và vận hành cho 3 nhóm người dùng: **Driver**, **Staff**, và **Admin**.

### 🎯 Mục tiêu chính:

- Quản lý trạm đổi pin xe điện hiệu quả
- Hỗ trợ người dùng tìm kiếm và đặt lịch đổi pin
- Quản lý nhân viên và vận hành trạm
- Theo dõi và báo cáo hoạt động hệ thống
- Tích hợp thanh toán VNPay cho nạp tiền ví

---

## 🏗️ Technology Stack

### Backend:
- **Node.js 20+** + **Express.js** - Server framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication (Access + Refresh tokens)
- **VNPay** - Payment gateway (sandbox/production)
- **Track-Asia** - Maps API (directions, distance, duration)
- **Cloudinary** - File upload (avatars, station images)
- **Socket.IO** - Real-time notifications
- **Node-cron** - Background jobs (auto-cancel bookings, reminders)
- **Bcrypt** - Password hashing
- **Joi** - Request validation

### Frontend:
- **React 18** + **TypeScript** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library (Radix UI)
- **React Router** - Navigation
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Lucide React** - Icons
- **Recharts** - Charts & graphs

---

## 📁 Project Structure

```
SWP392_Group4/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── controllers/        # API controllers (27 files)
│   │   ├── services/           # Business logic (8 files)
│   │   ├── routes/             # API routes (34 files)
│   │   ├── middlewares/        # Express middlewares (3 files)
│   │   ├── utils/              # Utility functions (4 files)
│   │   ├── validators/         # Request validators (3 files)
│   │   ├── config/             # Configuration (vnpay.config.ts)
│   │   └── server.ts            # Main server file
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   ├── migrations/         # Database migrations
│   │   └── seed.ts             # Database seeding
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                    # Environment variables
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/         # React components (98 files)
│   │   │   ├── admin/          # Admin dashboard components
│   │   │   ├── driver/         # Driver interface components
│   │   │   ├── staff/           # Staff interface components
│   │   │   ├── ui/              # Reusable UI components (shadcn/ui)
│   │   │   └── figma/           # Figma design components
│   │   ├── services/           # API service layer (23 files)
│   │   ├── config/             # Configuration (api.ts)
│   │   ├── contexts/           # React contexts
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Utility functions
│   │   ├── styles/              # CSS styles
│   │   └── scripts/             # Build scripts
│   ├── public/                  # Static assets
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── vercel.json              # Vercel deployment config
│
├── README.md                    # Main project README
├── PROJECT_DOCUMENTATION.md     # This file
└── .gitignore
```

---

## 🚀 Quick Start

### Prerequisites:
- **Node.js** 20+
- **PostgreSQL** 14+
- **npm** 10+
- **Git**

### Backend Setup:

```bash
cd backend
npm install
cp env.example .env
# Configure .env with your credentials
npx prisma db push
npx prisma generate
npx prisma db seed
npm run dev
```

### Frontend Setup:

```bash
cd frontend
npm install
npm run dev
```

### Access URLs:
- **Backend API:** http://localhost:3000
- **Frontend App:** http://localhost:5173
- **API Health:** http://localhost:3000/health
- **Swagger Docs:** http://localhost:3000/api-docs

---

## 🔐 Authentication & Authorization

### User Roles:
- **👑 Admin** - System management (users, stations, staff, pricing, packages)
- **👨‍💼 Staff** - Station operations (batteries, bookings, schedules)
- **🚗 Driver** - End users (vehicles, bookings, wallet, subscriptions)

### Authentication Flow:
1. **Registration/Login:** Email + Password → Access Token + Refresh Token
2. **Token Storage:** 
   - Access Token → localStorage (15 minutes expiry)
   - Refresh Token → localStorage + httpOnly cookie (7 days expiry)
3. **Auto-Refresh:** Frontend tự động refresh token khi sắp hết hạn (2 phút trước)
4. **401 Handling:** Retry request với token mới, nếu fail → redirect to login

### Security Features:
- JWT tokens với expiration
- Refresh token rotation
- Password hashing với bcrypt
- Rate limiting trên auth endpoints
- CORS configuration
- Helmet security headers

---

## 💰 Payment System

### Wallet System:
- **Wallet-based ONLY** - Users phải nạp tiền vào ví trước khi đặt lịch
- **TopUp Packages** - Gói nạp tiền với bonus (ví dụ: Nạp 200K nhận 200K, Nạp 500K nhận 550K)
- **Auto-payment** - Tự động trừ tiền từ ví khi hoàn thành đổi pin
- **Insufficient Funds** - Báo lỗi nếu số dư < giá tiền (phải nạp thêm)

### VNPay Integration:
- **Sandbox/Production** - Hỗ trợ cả 2 môi trường
- **Hosted Checkout** - Redirect user đến VNPay để thanh toán
- **Return URL** - Xử lý kết quả thanh toán sau khi user quay lại
- **Signature Verification** - HMAC SHA512 với URL encoding
- **Payment Status** - pending → completed/failed

### Subscription Packages:
- **Service Packages** - Gói dịch vụ đổi pin (unlimited hoặc limited swaps)
- **Proportional Refund** - Hoàn tiền theo tỷ lệ khi hủy gói
- **Cancellation Fee** - Phí hủy 3%
- **Minimum Refund** - Tối thiểu 10,000 VND

---

## 📋 Booking System

### Booking Types:
1. **Scheduled Booking** - Đặt lịch trước (30 phút - 12 giờ)
2. **Instant Booking** - Đặt ngay (15 phút reservation)

### Booking Flow:
1. **Driver tạo booking** → Status: `pending`
2. **Staff xác nhận** (phone verification) → Status: `confirmed`
3. **Staff hoàn thành** (nhập battery codes) → Status: `completed`
4. **Auto-cancel** nếu quá thời gian → Status: `cancelled`

### Booking Features:
- **Auto-cancel expired bookings** - Tự động hủy booking quá hạn
- **Reminders** - Thông báo 30 phút & 10 phút trước giờ hẹn
- **Cancellation Fee** - Phí 20K nếu hủy < 15 phút trước giờ hẹn
- **Battery Locking** - Tự động giữ pin cho booking (status: `reserved`)

### Staff Operations:
- **Phone Verification** - Xác nhận bằng số điện thoại (không cần PIN)
- **Auto-fill Old Battery** - Tự động lấy mã pin cũ từ vehicle
- **Dropdown New Battery** - Dropdown danh sách pin mới (compatible, full, available)
- **Battery Status Update** - Cập nhật status pin sau khi đổi (old → charging/damaged/maintenance, new → in_use)

---

## 🔋 Battery Management

### Battery Status:
- **full** - Pin đầy, sẵn sàng đổi (current_charge = 100%)
- **charging** - Đang sạc
- **in_use** - Đang được sử dụng trên xe
- **reserved** - Đã được giữ cho booking
- **damaged** - Pin hỏng
- **maintenance** - Đang bảo trì

### Battery Operations:
- **Capacity Warning** - Cảnh báo nếu capacity >= 90%, từ chối nếu >= 100%
- **Battery Inventory** - Quản lý theo model (available, charging, total)
- **Status Management** - full → charging → in_use
- **Damaged Battery** - Không cho sạc nếu damaged/maintenance
- **Battery History** - Lịch sử sử dụng pin
- **Battery Transfer** - Chuyển pin giữa các trạm

### Battery Display:
- **Driver Booking History** - Hiển thị mã pin hiện tại của vehicle
- **Staff Booking List** - Hiển thị mã pin cũ và mới cho completed transactions
- **Staff Swap Modal** - Auto-fill old battery code, dropdown new battery code

---

## 📊 Pricing System

### Battery Pricing:
- **Dynamic Pricing** - Giá theo model pin (ví dụ: Tesla Model 3 Battery = 100K, BYD Battery = 80K)
- **Admin Management** - Admin có thể CRUD pricing cho từng model
- **Public API** - Driver có thể xem pricing trước khi đặt

### TopUp Packages:
- **Bonus System** - Gói nạp tiền có bonus (ví dụ: 200K → 200K, 500K → 550K)
- **Active/Inactive** - Admin có thể bật/tắt gói
- **Admin Management** - CRUD top-up packages

---

## 🔔 Notification System

### Notification Types:
- **Booking Reminders** - 30 phút & 10 phút trước giờ hẹn
- **Payment Success** - Thông báo thanh toán thành công
- **Booking Status** - Cập nhật trạng thái booking
- **System Notifications** - Thông báo hệ thống

### Notification Delivery:
- **Socket.IO** - Real-time notifications
- **In-app Notifications** - Hiển thị trong app
- **Mark as Read** - Đánh dấu đã đọc
- **Mark All Read** - Đánh dấu tất cả đã đọc

---

## 🗺️ Maps Integration

### Track-Asia API:
- **Directions** - Lấy chỉ đường từ điểm A đến điểm B
- **Distance & Duration** - Tính khoảng cách và thời gian (road distance)
- **Straight-line Distance** - Tính khoảng cách đường thẳng (Haversine formula)

### Features:
- **Nearby Stations** - Tìm trạm gần nhất
- **Route Planning** - Lập kế hoạch đường đi
- **Distance Calculation** - Tính toán khoảng cách

---

## 📡 API Endpoints

### Authentication:
- `POST /api/auth/register` - Đăng ký user
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Lấy thông tin user
- `POST /api/auth/refresh` - Refresh access token
- `PUT /api/auth/profile` - Cập nhật profile
- `POST /api/auth/change-password` - Đổi mật khẩu
- `POST /api/auth/upload-avatar` - Upload avatar

### Driver APIs:
- `GET /api/driver/vehicles` - Danh sách xe (CRUD)
- `GET /api/driver/stations/nearby` - Trạm gần nhất
- `GET /api/driver/stations/:id` - Chi tiết trạm
- `GET /api/driver/bookings` - Danh sách booking (CRUD)
- `POST /api/driver/bookings` - Tạo booking
- `POST /api/driver/bookings/instant` - Đặt ngay
- `PUT /api/driver/bookings/:id/cancel` - Hủy booking
- `GET /api/driver/wallet/balance` - Số dư ví
- `GET /api/driver/wallet/transactions` - Lịch sử giao dịch
- `POST /api/driver/wallet/topup` - Nạp tiền (VNPay)
- `GET /api/driver/subscriptions` - Danh sách gói đã đăng ký
- `POST /api/driver/subscriptions/packages/:id/subscribe` - Đăng ký gói
- `PUT /api/driver/subscriptions/:id/cancel` - Hủy gói (proportional refund)
- `GET /api/driver/notifications` - Thông báo
- `PUT /api/driver/notifications/:id/read` - Đánh dấu đã đọc
- `PUT /api/driver/notifications/read-all` - Đánh dấu tất cả đã đọc
- `GET /api/driver/transactions` - Lịch sử giao dịch đổi pin

### Staff APIs:
- `GET /api/staff/batteries` - Danh sách pin tại trạm (CRUD)
- `POST /api/staff/batteries` - Thêm pin mới
- `PUT /api/staff/batteries/:id` - Cập nhật pin
- `DELETE /api/staff/batteries/:id` - Xóa pin
- `GET /api/staff/bookings` - Danh sách booking tại trạm
- `GET /api/staff/bookings/:id` - Chi tiết booking
- `GET /api/staff/bookings/:id/available-batteries` - Danh sách pin có sẵn để đổi
- `POST /api/staff/bookings/:id/confirm` - Xác nhận booking (phone verify)
- `POST /api/staff/bookings/:id/complete` - Hoàn thành booking (battery codes)
- `PUT /api/staff/bookings/:id/cancel` - Hủy booking
- `GET /api/staff/schedules` - Lịch làm việc
- `PUT /api/staff/schedules/:id/status` - Cập nhật trạng thái lịch

### Admin APIs:
- `GET /api/admin/users` - Danh sách users (CRUD)
- `GET /api/admin/stations` - Danh sách trạm (CRUD + image upload)
- `GET /api/admin/staff` - Danh sách nhân viên (CRUD)
- `GET /api/admin/batteries` - Danh sách pin (CRUD)
- `GET /api/admin/pricing` - Danh sách pricing (CRUD)
- `GET /api/admin/topup-packages` - Danh sách gói nạp tiền (CRUD)
- `GET /api/admin/packages` - Danh sách gói dịch vụ (CRUD)
- `GET /api/admin/dashboard/stats` - Thống kê dashboard
- `GET /api/admin/dashboard/batteries` - Thống kê pin
- `GET /api/admin/support` - Quản lý support tickets
- `GET /api/admin/staff-schedules` - Quản lý lịch làm việc
- `GET /api/admin/battery-transfers` - Quản lý chuyển pin

### Payment APIs:
- `POST /api/payments/vnpay/create` - Tạo payment URL
- `GET /api/payments/vnpay/return` - Xử lý return từ VNPay

### Public APIs:
- `GET /api/stations/public` - Danh sách trạm công khai
- `GET /api/stations/public/nearby` - Trạm gần nhất
- `GET /api/stations/public/:id` - Chi tiết trạm công khai
- `GET /api/pricing` - Danh sách pricing công khai

### Maps APIs:
- `GET /api/maps/directions` - Lấy chỉ đường (Track-Asia)
- `GET /api/maps/distance` - Tính khoảng cách & thời gian (road distance)
- `POST /api/maps/calculate-distance` - Tính khoảng cách đường thẳng (Haversine)

---

## 🔧 Environment Variables

### Backend (.env):

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ev_battery_swap"

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# VNPay
VNPAY_TMN_CODE=your-tmn-code
VNPAY_HASH_SECRET=your-hash-secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://your-backend-url.com/api/payments/vnpay/return

# Maps
TRACKASIA_ACCESS_TOKEN=your-trackasia-token

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend (.env hoặc Vercel Environment Variables):

```env
VITE_API_URL=https://ev-battery-backend.onrender.com/api
```

---

## 🧪 Testing

### Swagger Documentation:
- **Swagger UI:** `http://localhost:3000/api-docs`
- Tất cả endpoints được document với examples
- Test endpoints trực tiếp từ Swagger UI

### Health Check:
```bash
curl http://localhost:3000/health
```

### API Testing Examples:
```bash
# Authentication
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User","phone":"0901234567"}'

# Public Stations
curl http://localhost:3000/api/stations/public
```

---

## 🚀 Deployment

### Backend Deployment (Render):
1. Connect GitHub repository
2. Set environment variables trong Render dashboard
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Set `NPM_CONFIG_PRODUCTION=false` để install devDependencies

### Frontend Deployment (Vercel):
1. Connect GitHub repository
2. Set environment variable: `VITE_API_URL=https://ev-battery-backend.onrender.com/api`
3. Build command: `npm run build`
4. Output directory: `dist`

### Production URLs:
- **Backend:** https://ev-battery-backend.onrender.com
- **Frontend:** https://swp392-ev.vercel.app

---

## 📈 Key Features Summary

### ✅ Completed Features:

1. **🔐 Authentication System**
   - JWT Access + Refresh tokens
   - Auto-refresh token khi sắp hết hạn
   - Role-based access control (DRIVER, STAFF, ADMIN)

2. **💰 Payment System**
   - Wallet-based payment
   - VNPay integration (sandbox/production)
   - Top-up packages với bonus
   - Subscription packages với proportional refund

3. **📋 Booking System**
   - Scheduled & Instant bookings
   - Auto-cancel expired bookings
   - Booking reminders
   - Battery locking

4. **🔋 Battery Management**
   - Battery inventory by model
   - Status management (full, charging, in_use, reserved, damaged, maintenance)
   - Auto-fill old battery code trong staff modal
   - Dropdown new battery code (compatible, full, available)

5. **👨‍💼 Staff Operations**
   - Phone verification (không cần PIN)
   - Complete booking với battery codes
   - Battery status update sau khi đổi

6. **📊 Admin Dashboard**
   - User management
   - Station management
   - Staff management
   - Battery management
   - Pricing management
   - Package management
   - Dashboard statistics

7. **🔔 Notification System**
   - Real-time notifications với Socket.IO
   - Booking reminders
   - Payment notifications

8. **🗺️ Maps Integration**
   - Track-Asia API integration
   - Directions, distance, duration
   - Nearby stations

9. **☁️ File Upload**
   - Cloudinary integration
   - Avatar upload
   - Station image upload

10. **⏰ Background Jobs**
    - Auto-cancel expired bookings
    - Booking reminders (30 min & 10 min before)

---

## 🔄 Recent Updates (2025)

### Token Refresh Flow:
- ✅ Backend trả `refreshToken` trong response body (login/register)
- ✅ Frontend lưu `refreshToken` vào localStorage
- ✅ Auto-refresh token khi sắp hết hạn (2 phút trước)
- ✅ Retry với token mới khi nhận 401

### Battery Swap Modal:
- ✅ Auto-fill old battery code từ vehicle
- ✅ Dropdown new battery code (compatible, full, available)
- ✅ Display battery codes trong booking history và transaction list

### Subscription Cancellation:
- ✅ Proportional refund (theo tỷ lệ sử dụng)
- ✅ Cancellation fee 3%
- ✅ Minimum refund 10,000 VND

### Booking Management:
- ✅ Auto-refresh mỗi 30 giây trong staff console
- ✅ Sort by created_at desc để hiển thị booking mới nhất
- ✅ Display current battery code trong driver booking history

---

## 📝 Development Commands

### Backend:
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npx prisma studio    # Database GUI
npx prisma db push   # Push schema changes
npx prisma generate  # Generate Prisma client
npx prisma db seed   # Seed database
```

### Frontend:
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## 👥 Team

- **Backend Development:** Node.js + TypeScript + Prisma
- **Frontend Development:** React + TypeScript + Tailwind
- **Database Design:** PostgreSQL + Prisma ORM
- **API Integration:** VNPay + Track-Asia + Cloudinary + Socket.IO

---

## 📄 License

This project is part of **SWP392 - Software Engineering Project** at **FPT University**.

---

## 📞 Support

For technical support or questions:
- **Email:** thanhldse170144@fpt.edu.vn
- **GitHub:** [Repository URL]
- **Documentation:** This file

---

**📝 Last Updated:** November 2025  
**✅ Status:** Production Ready - 100% Complete  
**📊 Total Endpoints:** ~125 API endpoints  
**🔧 Code Quality:** Optimized (Prisma singleton, utility functions, parallel queries)  
**👨‍💻 Maintainer:** SWP392 Group 4  
**🏢 Organization:** FPT University - SWP392 Group 4

