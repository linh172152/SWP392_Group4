# 🚀 EV Battery Swap Station - Backend API

## 📋 **Quick Start**

### **Development**

```bash
npm install
npm run dev
```

### **Production**

```bash
npm install
npm run build
npm start
```

### **Docker**

```bash
docker build -t ev-battery-swap-backend .
docker-compose up -d
```

## 🔗 **API Endpoints**

- **Health Check**: `GET /health`
- **Authentication**: `/api/auth/*`
- **Driver APIs**: `/api/driver/*`
- **Staff APIs**: `/api/staff/*`
- **Admin APIs**: `/api/admin/*`
- **Public APIs**: `/api/stations/public/*`
- **Support**: `/api/support/*`

## 🗄️ **Database**

```bash
npx prisma migrate deploy
npx prisma db seed
```

## 🔧 **Environment Variables**

Copy `env.example` to `.env` and configure:

- Database URL
- JWT secrets
- API keys (Google, VNPay, Track-Asia, Cloudinary)
- Email configuration

## 📊 **Status**

✅ **Production Ready** - 78 API endpoints implemented

