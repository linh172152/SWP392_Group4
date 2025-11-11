# Software Design Specification (SDS)
# EVSwap Battery Management System

---

## 1. GIỚI THIỆU

### 1.1 Mục đích tài liệu
Tài liệu này mô tả thiết kế chi tiết của hệ thống EVSwap Battery Management System, bao gồm kiến trúc hệ thống, thiết kế database, API specification và giao diện người dùng.

### 1.2 Phạm vi hệ thống
**Tên hệ thống**: EVSwap - Battery Management System  
**Loại hệ thống**: Web Application  
**Mục tiêu**: Quản lý mạng lưới trạm thay pin xe điện

### 1.3 Đối tượng sử dụng
- **Admin**: Quản trị viên hệ thống
- **Driver**: Tài xế xe điện
- **Staff**: Nhân viên trạm

---

## 2. TỔNG QUAN KIẾN TRÚC

### 2.1 Kiến trúc tổng thể
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│                 │    │                 │    │                 │
│ React + TS      │◄──►│ Node.js + TS    │◄──►│ PostgreSQL      │
│ Vite + Tailwind │    │ Express + Prisma│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2.2 Technology Stack

#### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Shadcn/UI
- **State Management**: React Context
- **Routing**: React Router v6

#### Backend  
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Zod

#### Database
- **Primary**: PostgreSQL
- **File Storage**: Cloudinary
- **Payment**: VNPay Integration

---

## 3. THIẾT KẾ KIẾN TRÚC

### 3.1 Layered Architecture

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│        (React Components)               │
├─────────────────────────────────────────┤
│            Service Layer                │
│         (API Services)                  │
├─────────────────────────────────────────┤
│           Business Layer                │
│        (Controllers)                    │
├─────────────────────────────────────────┤
│           Data Access Layer             │
│        (Prisma ORM)                     │
├─────────────────────────────────────────┤
│            Database Layer               │
│        (PostgreSQL)                     │
└─────────────────────────────────────────┘
```

### 3.2 Module Structure

#### Frontend Modules
```
src/
├── components/
│   ├── admin/              # Admin interface
│   ├── driver/             # Driver interface  
│   ├── staff/              # Staff interface
│   └── ui/                 # Shared UI components
├── services/               # API client services
├── contexts/               # React contexts
├── hooks/                  # Custom hooks
└── utils/                  # Utility functions
```

#### Backend Modules
```
src/
├── controllers/            # Request handlers
├── routes/                 # API routes
├── services/               # Business logic
├── middlewares/            # Middleware functions
├── validators/             # Input validation
└── utils/                  # Helper functions
```

---

## 4. THIẾT KẾ DATABASE

### 4.1 Entity Relationship Diagram

```
Users (1) ──── (N) Bookings (1) ──── (1) Transactions
  │                  │
  │                  │
  └── (N) Staff ──── (1) Stations (1) ──── (N) Batteries
           │                │
           └── (N) StaffSchedules    └── (N) BatteryTransfers

ServicePackages (1) ──── (N) UserPackages (N) ──── (1) Users
TopUpPackages (1) ──── (N) TopUpTransactions (N) ──── (1) Users
SupportTickets (N) ──── (1) Users
```

### 4.2 Core Tables

#### Users Table
```sql
CREATE TABLE users (
  user_id         UUID PRIMARY KEY,
  email           VARCHAR UNIQUE NOT NULL,
  password_hash   VARCHAR NOT NULL,
  full_name       VARCHAR NOT NULL,
  phone           VARCHAR,
  role            ENUM('ADMIN', 'STAFF', 'DRIVER'),
  status          ENUM('ACTIVE', 'INACTIVE'),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

#### Stations Table
```sql
CREATE TABLE stations (
  station_id      UUID PRIMARY KEY,
  name            VARCHAR NOT NULL,
  address         TEXT NOT NULL,
  latitude        DECIMAL(10,8),
  longitude       DECIMAL(11,8),
  capacity        INTEGER NOT NULL,
  status          ENUM('ACTIVE', 'CLOSED', 'MAINTENANCE'),
  operating_hours VARCHAR DEFAULT '24/7',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

#### Batteries Table
```sql
CREATE TABLE batteries (
  battery_id      UUID PRIMARY KEY,
  station_id      UUID REFERENCES stations(station_id),
  model           VARCHAR NOT NULL,
  status          ENUM('FULL', 'CHARGING', 'IN_USE', 'MAINTENANCE', 'DAMAGED'),
  soh_percentage  DECIMAL(5,2), -- State of Health
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

#### Bookings Table  
```sql
CREATE TABLE bookings (
  booking_id      UUID PRIMARY KEY,
  user_id         UUID REFERENCES users(user_id),
  station_id      UUID REFERENCES stations(station_id),
  battery_model   VARCHAR NOT NULL,
  booking_time    TIMESTAMP NOT NULL,
  status          ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'),
  total_amount    DECIMAL(10,2),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

### 4.3 Business Rules

#### Booking Rules
- Một user chỉ có thể có 1 booking PENDING/CONFIRMED tại 1 thời điểm
- Booking phải được tạo ít nhất 15 phút trước thời gian thực hiện
- Auto-cancel booking sau 30 phút nếu không check-in

#### Battery Rules
- Pin FULL mới có thể được sử dụng cho booking
- Pin DAMAGED/MAINTENANCE không thể sử dụng
- Mỗi trạm phải có ít nhất 2 pin FULL để hoạt động

---

## 5. API SPECIFICATION

### 5.1 Authentication APIs

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "User Name",
  "phone": "0901234567"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "role": "DRIVER"
  },
  "token": "jwt_token"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com", 
  "password": "password123"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt_token"
  }
}
```

### 5.2 Station Management APIs

```http
GET /api/admin/stations
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "station_id": "uuid",
      "name": "Station Name",
      "address": "Station Address",
      "status": "ACTIVE",
      "capacity": 20,
      "available_batteries": 15,
      "coordinates": {
        "lat": 10.762622,
        "lng": 106.660172
      }
    }
  ]
}
```

```http
POST /api/admin/stations
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Station",
  "address": "123 Main St",
  "latitude": 10.762622,
  "longitude": 106.660172,
  "capacity": 20,
  "operating_hours": "24/7"
}

Response: 201 Created
{
  "success": true,
  "data": { ... }
}
```

### 5.3 Booking APIs

```http
POST /api/driver/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "station_id": "uuid",
  "battery_model": "VF8_BATTERY",
  "booking_time": "2025-11-11T10:00:00Z",
  "payment_method": "WALLET"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "booking_id": "uuid",
    "status": "PENDING",
    "total_amount": 50000
  }
}
```

### 5.4 Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

---

## 6. THIẾT KẾ GIAO DIỆN

### 6.1 Design System

#### Color Palette
```css
:root {
  --primary: #8B5CF6;         /* Purple */
  --primary-dark: #7C3AED;    /* Darker purple */
  --success: #10B981;         /* Green */
  --warning: #F59E0B;         /* Amber */
  --error: #EF4444;           /* Red */
  --neutral-50: #F9FAFB;      /* Light gray */
  --neutral-900: #111827;     /* Dark gray */
}
```

#### Typography Scale
```css
.text-xs { font-size: 0.75rem; }    /* 12px */
.text-sm { font-size: 0.875rem; }   /* 14px */
.text-base { font-size: 1rem; }     /* 16px */
.text-lg { font-size: 1.125rem; }   /* 18px */
.text-xl { font-size: 1.25rem; }    /* 20px */
.text-2xl { font-size: 1.5rem; }    /* 24px */
.text-3xl { font-size: 1.875rem; }  /* 30px */
```

### 6.2 Component Architecture

#### Atomic Design Structure
```
ui/
├── atoms/
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Badge.tsx
├── molecules/
│   ├── SearchBar.tsx
│   ├── StatusCard.tsx
│   └── FilterDropdown.tsx
├── organisms/
│   ├── StationList.tsx
│   ├── BookingForm.tsx
│   └── Dashboard.tsx
└── templates/
    ├── AdminLayout.tsx
    ├── DriverLayout.tsx
    └── StaffLayout.tsx
```

### 6.3 Responsive Breakpoints

```css
/* Mobile First Approach */
.container {
  width: 100%;
  padding: 1rem;
}

/* Tablet: 768px+ */
@media (min-width: 768px) {
  .container {
    max-width: 768px;
    margin: 0 auto;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    padding: 2rem;
  }
}
```

---

## 7. SECURITY DESIGN

### 7.1 Authentication & Authorization

#### JWT Token Structure
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": "uuid",
    "email": "user@example.com",
    "role": "ADMIN",
    "iat": 1699776000,
    "exp": 1699862400
  }
}
```

#### Role-Based Access Control
```typescript
enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF', 
  DRIVER = 'DRIVER'
}

// Permission Matrix
const PERMISSIONS = {
  [UserRole.ADMIN]: ['*'], // Full access
  [UserRole.STAFF]: [
    'stations:read',
    'bookings:read',
    'bookings:update',
    'batteries:read',
    'batteries:update'
  ],
  [UserRole.DRIVER]: [
    'stations:read',
    'bookings:create',
    'bookings:read:own',
    'profile:read:own',
    'profile:update:own'
  ]
};
```

### 7.2 Data Validation

#### Input Validation Schema
```typescript
// Registration Schema
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d)/),
  full_name: z.string().min(2).max(50),
  phone: z.string().regex(/^[0-9]{10,11}$/).optional()
});

// Station Creation Schema
const StationSchema = z.object({
  name: z.string().min(3).max(100),
  address: z.string().min(10).max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacity: z.number().int().min(1).max(100)
});
```

---

## 8. PERFORMANCE & SCALABILITY

### 8.1 Database Optimization

#### Indexes
```sql
-- Optimized queries
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_batteries_station_status ON batteries(station_id, status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_stations_coordinates ON stations(latitude, longitude);
```

#### Query Optimization
```sql
-- Efficient station search with available batteries
SELECT s.*, 
       COUNT(b.battery_id) as available_count
FROM stations s
LEFT JOIN batteries b ON s.station_id = b.station_id 
                      AND b.status = 'FULL'
WHERE s.status = 'ACTIVE'
  AND ST_DWithin(
    ST_Point(s.longitude, s.latitude)::geography,
    ST_Point($longitude, $latitude)::geography,
    $radius_meters
  )
GROUP BY s.station_id
HAVING COUNT(b.battery_id) > 0
ORDER BY ST_Distance(
  ST_Point(s.longitude, s.latitude)::geography,
  ST_Point($longitude, $latitude)::geography
);
```

### 8.2 Caching Strategy

#### Redis Caching
```typescript
// Station cache (5 minutes)
const getCachedStations = async (params: StationQuery) => {
  const cacheKey = `stations:${JSON.stringify(params)}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const stations = await prisma.station.findMany(params);
  await redis.setex(cacheKey, 300, JSON.stringify(stations));
  
  return stations;
};
```

---

## 9. TESTING STRATEGY

### 9.1 Testing Pyramid

```
        /\
       /  \
      / UI \ 
     /Tests \
    /__________\
   /            \
  / Integration  \
 /    Tests       \
/____________________\
/                    \
/    Unit Tests       \
/____________________/
```

### 9.2 Test Cases

#### Unit Tests Example
```typescript
describe('BookingService', () => {
  it('should create booking with valid data', async () => {
    const bookingData = {
      user_id: 'user-uuid',
      station_id: 'station-uuid',
      battery_model: 'VF8_BATTERY',
      booking_time: new Date()
    };
    
    const result = await BookingService.createBooking(bookingData);
    
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('PENDING');
  });
});
```

#### Integration Tests
```typescript
describe('POST /api/driver/bookings', () => {
  it('should create booking with authentication', async () => {
    const response = await request(app)
      .post('/api/driver/bookings')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        station_id: stationId,
        battery_model: 'VF8_BATTERY',
        booking_time: futureTime
      });
      
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

---

## 10. DEPLOYMENT ARCHITECTURE

### 10.1 Production Environment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Servers   │    │   Database      │
│     (Nginx)     │───►│   (Node.js)     │───►│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────►│   Static CDN    │              │
                        │  (Cloudinary)   │              │
                        └─────────────────┘              │
                                                        │
                        ┌─────────────────┐              │
                        │   Redis Cache   │◄─────────────┘
                        └─────────────────┘
```

### 10.2 Docker Configuration

#### Dockerfile (Backend)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://backend:5000
      
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/evswap
    depends_on:
      - db
      
  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=evswap
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

---

## 11. MONITORING & MAINTENANCE

### 11.1 Health Checks

```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    external_apis: await checkExternalAPIs()
  };
  
  const isHealthy = Object.values(checks).every(Boolean);
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks
  });
});
```

### 11.2 Logging Strategy

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## 12. PHỤ LỤC

### 12.1 Glossary
- **SoH**: State of Health - Tình trạng sức khỏe pin
- **CRUD**: Create, Read, Update, Delete operations
- **JWT**: JSON Web Token
- **ORM**: Object-Relational Mapping
- **CDN**: Content Delivery Network

### 12.2 References
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Documentation](https://expressjs.com/)

---

**Document Version**: 1.0  
**Last Updated**: November 11, 2025  
**Approved By**: Development Team  
**Next Review**: December 11, 2025