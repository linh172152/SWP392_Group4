# 🚀 EV Battery Swap Station Management System

Hệ thống quản lý trạm đổi pin xe điện toàn diện, được phát triển bởi **SWP392 Group 4** tại FPT University.

## 📊 Overview

Hệ thống hỗ trợ quản lý trạm đổi pin, đặt lịch, thanh toán, và vận hành cho 3 nhóm người dùng:

- **👑 Admin** - Quản lý hệ thống (users, stations, staff, pricing, packages)
- **👨‍💼 Staff** - Vận hành trạm (batteries, bookings, schedules)
- **🚗 Driver** - Người dùng cuối (vehicles, bookings, wallet, subscriptions)

## 🏗️ Technology Stack

### Backend:

- Node.js 20+ + Express.js + TypeScript
- PostgreSQL + Prisma ORM
- JWT Authentication (Access + Refresh tokens)
- VNPay Payment Gateway
- Socket.IO (Real-time notifications)
- Track-Asia Maps API
- Cloudinary (File upload)

### Frontend:

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router + React Hook Form

## 🚀 Quick Start

### Prerequisites:

- Node.js 20+
- PostgreSQL 14+
- npm 10+

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
- **Swagger Docs:** http://localhost:3000/api-docs
- **Health Check:** http://localhost:3000/health

## 📋 Key Features

- ✅ **Authentication** - JWT với auto-refresh token
- ✅ **Payment System** - Wallet-based + VNPay integration
- ✅ **Booking System** - Scheduled & Instant bookings với auto-cancel
- ✅ **Battery Management** - Inventory, status tracking, auto-assignment
- ✅ **Subscription Packages** - Service packages với proportional refund
- ✅ **Real-time Notifications** - Socket.IO notifications
- ✅ **Maps Integration** - Track-Asia API (directions, distance)
- ✅ **Background Jobs** - Auto-cancel bookings, reminders

## 📁 Project Structure

```
SWP392_Group4/
├── backend/          # Backend API (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   └── ...
│   └── prisma/      # Database schema & migrations
│
├── frontend/        # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── ...
│   └── ...
│
├── README.md                    # This file
└── PROJECT_DOCUMENTATION.md    # Complete documentation
```

## 🔧 Environment Variables

### Backend (.env):

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."
VNPAY_TMN_CODE="..."
VNPAY_HASH_SECRET="..."
TRACKASIA_ACCESS_TOKEN="..."
CLOUDINARY_CLOUD_NAME="..."
```

### Frontend (.env hoặc Vercel):

```env
VITE_API_URL=https://ev-battery-backend.onrender.com/api
```

Xem `backend/env.example` để biết đầy đủ các biến môi trường.

## 🚀 Deployment

### Backend (Render):

- Build: `npm install && npm run build`
- Start: `npm start`
- Set `NPM_CONFIG_PRODUCTION=false`

### Frontend (Vercel):

- Build: `npm run build`
- Output: `dist`
- Set `VITE_API_URL`

### Production URLs:

- **Backend:** https://ev-battery-backend.onrender.com
- **Frontend:** https://swp392-ev.vercel.app

## 📚 Documentation

- **📖 Complete Documentation:** [`PROJECT_DOCUMENTATION.md`](./PROJECT_DOCUMENTATION.md) - Chi tiết đầy đủ về flows, business logic, và API
- **🔧 Backend README:** [`backend/README.md`](./backend/README.md) - Backend setup và API docs
- **🎨 Frontend README:** [`frontend/README.md`](./frontend/README.md) - Frontend setup và components

## 🧪 Testing

- **Swagger UI:** http://localhost:3000/api-docs
- **Health Check:** http://localhost:3000/health

## 👥 Team

**SWP392 Group 4** - FPT University

## 📄 License

This project is part of **SWP392 - Software Engineering Project** at **FPT University**.

---

**📝 Last Updated:** November 2025  
**✅ Status:** Production Ready  
**📊 Total Endpoints:** ~125 API endpoints
