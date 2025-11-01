# 🚀 EV Battery Swap Station Management System

## 📊 **PROJECT OVERVIEW**

**EV Battery Swap Station Management System** là hệ thống quản lý trạm đổi pin xe điện toàn diện, được thiết kế để phục vụ nhu cầu di chuyển bền vững tại Việt Nam.

### **🎯 Mục tiêu:**

- Quản lý trạm đổi pin xe điện hiệu quả
- Hỗ trợ người dùng tìm kiếm và đặt lịch đổi pin
- Quản lý nhân viên và vận hành trạm
- Theo dõi và báo cáo hoạt động hệ thống

---

## 🏗️ **TECHNOLOGY STACK**

### **Backend:**

- **Node.js** + **Express.js** - Server framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Google OAuth** - Social login
- **VNPay** - Payment gateway
- **Gmail SMTP** - Email service
- **Track-Asia** - Maps API
- **Cloudinary** - File upload

### **Frontend:**

- **React** + **TypeScript** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client

---

## 📁 **PROJECT STRUCTURE**

```
SWP392_Group4/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middlewares/     # Express middlewares
│   │   ├── utils/           # Utility functions
│   │   └── config/          # Configuration
│   ├── prisma/              # Database schema & migrations
│   ├── package.json
│   └── .env                 # Environment variables
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── admin/       # Admin dashboard
│   │   │   ├── driver/      # Driver interface
│   │   │   ├── staff/       # Staff interface
│   │   │   └── ui/          # Reusable UI components
│   │   ├── contexts/        # React contexts
│   │   └── styles/          # CSS styles
│   ├── package.json
│   └── vite.config.ts
└── README.md               # This file
```

---

## 🚀 **QUICK START**

### **Prerequisites:**

- Node.js 18+
- PostgreSQL 14+
- Git

### **Backend Setup:**

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

### **Frontend Setup:**

```bash
cd frontend
npm install
npm run dev
```

### **Access URLs:**

- **Backend API:** http://localhost:3000
- **Frontend App:** http://localhost:5173
- **API Health:** http://localhost:3000/health

---

## 🔐 **AUTHENTICATION & AUTHORIZATION**

### **User Roles:**

- **👑 Admin** - System management
- **👨‍💼 Staff** - Station operations
- **🚗 Driver** - End users

### **Authentication Methods:**

- **Email/Password** - Traditional login
- **JWT Tokens** - Access & Refresh tokens

---

## 📊 **DATABASE SCHEMA**

### **Core Models:**

- **User** - User accounts & profiles
- **Station** - Battery swap stations
- **Vehicle** - User vehicles
- **Battery** - Battery inventory
- **Booking** - Swap appointments
- **Transaction** - Payment records
- **Payment** - Payment details
- **Wallet** - User wallet balance
- **BatteryPricing** - Battery pricing by model
- **TopUpPackage** - Top-up packages with bonus
- **Notification** - In-app notifications
- **SupportTicket** - Customer support
- **TicketReply** - Support responses
- **StationRating** - Station reviews

---

## 🔌 **API ENDPOINTS**

### **Authentication:**

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - User profile
- `POST /api/auth/refresh` - Refresh token

### **Payment (Wallet):**

- `GET /api/driver/wallet/balance` - Get wallet balance
- `GET /api/driver/wallet/transactions` - Get transaction history
- `POST /api/driver/wallet/topup` - Top-up wallet (VNPay)

### **Payment (VNPay):**

- `POST /api/payments/vnpay/create` - Create payment
- `GET /api/payments/vnpay/return` - Payment return
- `POST /api/payments/vnpay/ipn` - Payment notification

### **Driver APIs:**

- `GET /api/driver/vehicles` - User vehicles (CRUD)
- `GET /api/driver/stations/nearby` - Nearby stations
- `GET /api/driver/stations/:id` - Station details
- `GET /api/driver/bookings` - User bookings (CRUD)
- `POST /api/driver/bookings/instant` - Instant booking
- `PUT /api/driver/bookings/:id/cancel` - Cancel booking
- `GET /api/driver/wallet/*` - Wallet management
- `GET /api/driver/notifications` - Notifications

### **Staff APIs:**

- `GET /api/staff/batteries` - Station batteries (CRUD)
- `POST /api/staff/batteries` - Add new battery
- `PUT /api/staff/batteries/:id` - Update battery status
- `GET /api/staff/bookings` - Station bookings
- `POST /api/staff/bookings/:id/confirm` - Confirm booking (phone verify)
- `POST /api/staff/bookings/:id/complete` - Complete booking (battery code)

### **Admin APIs:**

- `GET /api/admin/users` - All users (CRUD)
- `GET /api/admin/stations` - All stations (CRUD)
- `GET /api/admin/staff` - All staff (CRUD)
- `GET /api/admin/pricing` - Battery pricing (CRUD)
- `GET /api/admin/topup-packages` - Top-up packages (CRUD)
- `GET /api/admin/dashboard/stats` - Dashboard statistics

### **Public APIs:**

- `GET /api/stations/public` - Public stations
- `GET /api/stations/public/nearby` - Nearby public stations
- `GET /api/stations/public/:id` - Public station details

### **Maps APIs:**

- `GET /api/maps/directions` - Get route directions
- `GET /api/maps/distance` - Get distance & duration
- `POST /api/maps/calculate-distance` - Calculate distance

---

## 🛠️ **DEVELOPMENT**

### **Backend Development:**

```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npx prisma studio    # Database GUI
```

### **Frontend Development:**

```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### **Database Management:**

```bash
npx prisma db push           # Push schema changes
npx prisma db seed           # Seed database
npx prisma generate          # Generate Prisma client
npx prisma migrate dev       # Create migration
```

---

## 🔧 **ENVIRONMENT VARIABLES**

### **Backend (.env):**

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

# Maps
TRACKASIA_ACCESS_TOKEN=your-trackasia-token

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 📈 **FEATURES**

### **✅ Completed (100%):**

- 🔐 **Authentication System** - JWT (Access + Refresh tokens)
- 💳 **Payment System** - Wallet + VNPay integration
- 💰 **Wallet System** - Top-up packages with bonus
- 📊 **Pricing System** - Battery pricing by model
- 📧 **Notification System** - In-app notifications (Socket.IO)
- 🗺️ **Maps Integration** - Track-Asia API (directions, distance)
- ☁️ **File Upload** - Cloudinary (avatars, station images)
- 🗄️ **Database** - PostgreSQL + Prisma
- 🎨 **Frontend** - React + TypeScript + Tailwind
- 🚗 **Driver APIs** - Vehicle & Booking management (100%)
- 👨‍💼 **Staff APIs** - Battery & Station operations (100%)
- 👑 **Admin APIs** - User & System management (100%)
- 🌐 **Public APIs** - Station discovery (100%)
- ⏰ **Background Jobs** - Auto-cancel bookings, reminders

---

## 📋 **KEY FEATURES**

### **🔐 Authentication & Authorization:**

- Email/Password login (NO Google OAuth)
- JWT Access + Refresh tokens
- Role-based access (DRIVER, STAFF, ADMIN)
- Token blacklist for logout

### **💰 Payment System:**

- **Wallet-based** - Users top up wallet
- **TopUp Packages** - Bonus on top-up (e.g., Nạp 1M nhận 1.05M)
- **Battery Pricing** - Dynamic pricing by battery model
- **VNPay Integration** - Secure payment gateway
- **NO Cash Payment** - Wallet only

### **📋 Booking System:**

- **Scheduled Booking** - 30 min - 12 hours ahead
- **Instant Booking** - 15-minute reservation
- **Auto-cancel** - Expired bookings cancelled automatically
- **Reminders** - 30 min & 10 min before scheduled time
- **Cancellation Fee** - 20k if cancelled < 15 min before

### **🔋 Battery Management:**

- **Capacity Warning** - >= 90% warning, >= 100% reject
- **Battery Inventory** - Format by model (available, charging, total)
- **Status Management** - full → charging → in_use
- **Damaged Battery** - No charging if damaged/maintenance

### **👨‍💼 Staff Operations:**

- **Phone Verification** - No PIN code required
- **Battery Code** - Use battery code (not UUID)
- **Auto-assign** - System assigns oldest full battery
- **Complete Pending** - Can complete pending bookings if user arrives early

---

## 🧪 **TESTING**

### **Swagger Documentation:**

- **Swagger UI:** `http://localhost:3000/api-docs`
- All endpoints documented with examples
- Test endpoints directly from Swagger UI

### **Health Check:**

```bash
curl http://localhost:3000/health
```

### **API Testing:**

```bash
# Authentication
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User","phone":"0901234567"}'

# Public Stations
curl http://localhost:3000/api/stations/public
```

---

## 🚀 **DEPLOYMENT**

### **Backend Deployment:**

1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy to hosting platform (Railway, Heroku, etc.)

### **Frontend Deployment:**

1. Build production bundle
2. Deploy to hosting platform (Vercel, Netlify, etc.)
3. Configure environment variables

---

## 👥 **TEAM**

- **Backend Development:** Node.js + TypeScript + Prisma
- **Frontend Development:** React + TypeScript + Tailwind
- **Database Design:** PostgreSQL + Prisma ORM
- **API Integration:** Google OAuth + VNPay + Gmail + Track-Asia + Cloudinary

---

## 📄 **LICENSE**

This project is part of SWP392 - Software Engineering Project at FPT University.

---

## 📞 **SUPPORT**

For technical support or questions:

- **Email:** [Your Email]
- **GitHub Issues:** [Repository Issues]
- **Documentation:** [Project Wiki]

---

---

## 📚 **DOCUMENTATION**

- **Main Documentation:** `PROJECT_DOCUMENTATION.md` - Complete project documentation with all flows, business logic, and API details
- **Backend README:** `backend/README.md` - Backend setup and API documentation
- **Frontend README:** `frontend/README.md` - Frontend setup and component documentation

---

**📝 Last Updated:** 2024  
**✅ Status:** Production Ready - 100% Complete  
**👨‍💻 Maintainer:** Development Team  
**🏢 Organization:** FPT University - SWP392 Group 4






