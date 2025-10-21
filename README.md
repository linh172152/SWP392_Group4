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
- **Google OAuth** - Social login
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
- **ServicePackage** - Subscription plans
- **UserSubscription** - User subscriptions
- **SupportTicket** - Customer support
- **TicketReply** - Support responses
- **StationRating** - Station reviews
- **BatteryTransferLog** - Battery transfers

---

## 🔌 **API ENDPOINTS**

### **Authentication:**

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - User profile
- `POST /api/auth/refresh` - Refresh token

### **Google OAuth:**

- `GET /api/google/auth` - Google login
- `GET /api/auth/google/callback` - OAuth callback

### **Payment (VNPay):**

- `POST /api/payments/vnpay/create` - Create payment
- `GET /api/payments/vnpay/return` - Payment return
- `POST /api/payments/vnpay/ipn` - Payment notification

### **Driver APIs:**

- `GET /api/driver/vehicles` - User vehicles
- `GET /api/driver/stations` - Nearby stations
- `GET /api/driver/bookings` - User bookings
- `GET /api/driver/transactions` - Payment history

### **Staff APIs:**

- `GET /api/staff/batteries` - Station batteries
- `GET /api/staff/bookings` - Station bookings
- `PUT /api/staff/bookings/:id/confirm` - Confirm booking

### **Admin APIs:**

- `GET /api/admin/users` - All users
- `GET /api/admin/stations` - All stations
- `GET /api/admin/reports` - System reports

### **Test APIs:**

- `POST /api/test/email` - Test email service
- `GET /api/test/maps` - Test maps service
- `GET /api/test/cloudinary` - Test file upload

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

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# VNPay
VNPAY_TMN_CODE=your-tmn-code
VNPAY_HASH_SECRET=your-hash-secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Maps
TRACKASIA_ACCESS_TOKEN=your-trackasia-token

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 📈 **FEATURES**

### **✅ Completed:**

- 🔐 **Authentication System** - JWT + Google OAuth
- 💳 **Payment Integration** - VNPay Sandbox
- 📧 **Email Service** - Gmail SMTP
- 🗺️ **Maps Integration** - Track-Asia API
- ☁️ **File Upload** - Cloudinary
- 🗄️ **Database** - PostgreSQL + Prisma
- 🎨 **Frontend** - React + TypeScript + Tailwind

### **🚧 In Progress:**

- 🚗 **Driver APIs** - Vehicle & Booking management
- 👨‍💼 **Staff APIs** - Battery & Station operations
- 👑 **Admin APIs** - User & System management
- 🌐 **Public APIs** - Station discovery

---

## 📋 **ROADMAP**

### **Phase 1: Core Driver Features (Week 1-2)**

- Vehicle Management APIs
- Station Discovery APIs
- Basic Booking APIs

### **Phase 2: Staff Operations (Week 3-4)**

- Battery Management APIs
- Booking Processing APIs
- Station Operations APIs

### **Phase 3: Admin Dashboard (Week 5-6)**

- User Management APIs
- Station Management APIs
- System Reports APIs

### **Phase 4: Public Features (Week 7-8)**

- Public Station APIs
- Support System APIs
- Integration Testing

---

## 🧪 **TESTING**

### **Backend Testing:**

```bash
# Test all APIs
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/auth/register
curl http://localhost:3000/api/test/email
curl http://localhost:3000/api/test/maps
curl http://localhost:3000/api/test/cloudinary
```

### **Frontend Testing:**

```bash
# Start frontend
npm run dev
# Open http://localhost:5173
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

**📝 Last Updated:** October 22, 2024  
**👨‍💻 Maintainer:** Development Team  
**🏢 Organization:** FPT University - SWP392 Group 4
