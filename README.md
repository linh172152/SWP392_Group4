# EV Battery Swap Station Management System

Hệ thống quản lý trạm đổi pin xe điện - Web Application

## 📁 Cấu trúc Monorepo

```
SWP392_Group4/
├── frontend/          # React + Vite + TypeScript
│   ├── src/
│   └── package.json
├── backend/           # Express + TypeScript + Prisma
│   ├── src/
│   ├── prisma/
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
npm install
cp env.example .env     # Điền thông tin database, JWT secrets
npm run prisma:migrate  # Setup database
npm run dev            # Start backend: http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev            # Start frontend: http://localhost:3000
```

## 🛠️ Tech Stack

### Frontend

- React 18 + TypeScript
- Vite
- Ant Design / Material-UI

### Backend

- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT Authentication
- Redis (optional)

## 👥 Roles

- **Driver**: Đặt lịch, thanh toán, xem lịch sử
- **Staff**: Quản lý tồn kho pin, xử lý đổi pin
- **Admin**: Quản lý trạm, user, báo cáo, AI insights

## 📚 Documentation

- [Backend API](./backend/README.md)
- [Frontend](./frontend/README.md)

## 👨‍💻 Team

SWP392 Group 4 - FPT University
