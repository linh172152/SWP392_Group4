# ⚙️ EV Battery Swap Station – Requirements (Web-only MVP Version)

## 🎭 ROLES & PERMISSIONS

### 1. **EV Driver**
- Người dùng cuối sử dụng dịch vụ đổi pin.
- Quyền: Đăng ký, quản lý phương tiện, đặt lịch, thanh toán, xem lịch sử, gửi hỗ trợ.

### 2. **BSS Staff**
- Nhân viên vận hành tại trạm.
- Quyền: Quản lý pin tại trạm, xử lý booking, xác nhận đổi pin, cập nhật trạng thái pin, ghi nhận giao dịch.

### 3. **Admin**
- Quản trị hệ thống.
- Quyền: Quản lý user, trạm, pin, gói thuê, báo cáo, và phân quyền.

---

## 📋 CHỨC NĂNG CHÍNH

### 🚗 **EV DRIVER**

#### **a. Tài khoản & phương tiện**
- [ ] Đăng ký/Đăng nhập/Đăng xuất (JWT)
- [ ] Quản lý hồ sơ cá nhân (tên, email, phone, avatar)
- [ ] CRUD phương tiện:
  - `license_plate` (duy nhất - biển số xe)
  - `vehicle_type` (`motorbike` / `car`)
  - `make`, `model`, `year` (optional - for better UX)
  - `battery_model` (loại pin tương thích)

#### **b. Đặt lịch & tra cứu trạm**
- [ ] Tra cứu trạm có pin tương thích
  - Filter theo khoảng cách, loại pin
  - Xem số lượng pin đầy có sẵn
- [ ] Đặt lịch đổi pin
  - Chọn trạm, thời gian
  - Chọn xe (với battery_model)
  - Sinh `booking_code` tự động
- [ ] Xem danh sách booking của mình
  - `pending`, `confirmed`, `completed`, `cancelled`
- [ ] Hủy booking (nếu chưa check-in)

#### **c. Thanh toán & gói dịch vụ**
- [ ] Mỗi người dùng chỉ có **1 gói thuê pin đang hoạt động**
- [ ] Khi vượt quota → hệ thống tự động tính phí theo lượt
- [ ] Xem danh sách gói dịch vụ có sẵn
- [ ] Đăng ký gói dịch vụ
- [ ] Thanh toán online (mock VNPay/Momo) hoặc "đã trả tại trạm"
- [ ] Xem lịch sử giao dịch đổi pin
- [ ] Xem hóa đơn/invoice

#### **d. Hỗ trợ dịch vụ**
- [ ] Tạo support ticket
  - Vấn đề pin
  - Vấn đề trạm
  - Vấn đề thanh toán
- [ ] Theo dõi trạng thái ticket
- [ ] Xem lịch sử ticket của mình

#### **e. Đánh giá dịch vụ**
- [ ] Đánh giá trạm sau khi đổi pin (rating 1-5 sao)
- [ ] Viết comment/feedback về trạm
- [ ] Xem đánh giá của người dùng khác về trạm
- [ ] Xem lịch sử đánh giá của mình

---

### 🔋 **BSS STAFF**

#### **a. Quản lý tồn kho pin**
- [ ] Xem danh sách pin tại trạm của mình
  - Hiển thị: `battery_code`, `model`, `status`, `current_charge`, `capacity_kwh`
  - Filter theo trạng thái, loại pin
  - Hiển thị % pin hiện tại (để biết pin nào gần đầy)
- [ ] Phân loại pin theo trạng thái:
  - `full` (100%) - Pin đầy, sẵn sàng đổi
  - `charging` (1-99%) - Đang sạc (hiển thị % để dự đoán thời gian)
  - `in_use` - Đang được sử dụng bởi tài xế
  - `maintenance` - Đang bảo dưỡng
  - `damaged` - Hỏng, cần thay thế
- [ ] Cập nhật trạng thái pin
- [ ] Cập nhật % pin hiện tại (manual hoặc auto từ charging system)
- [ ] Dự đoán thời gian sạc đầy (based on current_charge)
- [ ] Ghi nhận pin về trạm sau khi đổi

#### **b. Giao dịch đổi pin**
- [ ] Xem danh sách booking tại trạm
  - Booking hôm nay, sắp tới
- [ ] Check-in tài xế
  - Nhập/scan `booking_code`
  - Xác nhận thông tin xe và tài xế
- [ ] Thực hiện đổi pin:
  1. Chọn pin cũ (pin người dùng trả lại) → Cập nhật status `charging`
  2. Chọn pin mới (pin đầy tại trạm) → Gán cho xe, status `in_use`
  3. Hệ thống tự động tạo `Transaction` với `old_battery_id`, `new_battery_id`
- [ ] Xác nhận thanh toán tại chỗ (nếu vượt quota)
- [ ] Xuất hóa đơn cho tài xế

---

### 👔 **ADMIN**

#### **a. Quản lý trạm (Station Management)**
- [ ] CRUD trạm đổi pin
  - `name`, `address`, `latitude`, `longitude`
  - `capacity` (số lượng pin tối đa)
  - `supported_models` (loại pin hỗ trợ - JSON array)
  - `status` (`active`, `maintenance`, `closed`)
- [ ] Xem tình trạng trạm
  - Số pin: full / charging / in_use / maintenance
  - Số booking hôm nay
  - Doanh thu
- [ ] Phân công staff cho trạm

#### **b. Quản lý pin (Battery Coordination)**
- [ ] Xem toàn bộ pin trong hệ thống
  - Filter theo trạm, trạng thái, model
- [ ] Thêm pin mới vào hệ thống
- [ ] Điều phối pin giữa các trạm
  - Chuyển pin từ trạm A → trạm B (thay đổi `station_id`)
  - Ghi nhận lịch sử di chuyển
- [ ] Ghi nhận pin lỗi/bảo dưỡng
  - Đánh dấu `damaged` hoặc `maintenance`

#### **c. Quản lý người dùng & Gói dịch vụ**
- [ ] Quản lý users
  - CRUD user (Driver, Staff, Admin)
  - Khóa/Mở khóa tài khoản
  - Phân quyền (assign role)
- [ ] Quản lý gói thuê pin (Service Packages)
  - CRUD gói dịch vụ
  - `name`, `price`, `swap_limit` (số lượt đổi)
  - `duration_days` (thời hạn)
  - `battery_models` (áp dụng cho loại pin nào)
- [ ] Xem subscription của users
  - User nào đang dùng gói nào
  - Còn bao nhiêu lượt (`remaining_swaps`)
  - Hết hạn khi nào (`end_date`)

#### **d. Báo cáo & Thống kê**
- [ ] Dashboard tổng quan
  - Tổng số trạm, pin, users
  - Doanh thu hôm nay/tháng này
  - Số giao dịch hôm nay
- [ ] Báo cáo doanh thu
  - Theo ngày/tuần/tháng
  - Theo trạm
  - Theo gói dịch vụ
- [ ] Báo cáo số lượt đổi pin
  - Tần suất đổi pin theo trạm
  - Giờ cao điểm (peak hours)
- [ ] Báo cáo tồn kho pin
  - Tình trạng pin theo trạm
  - Pin cần bảo dưỡng/thay thế
- [ ] **AI Suggestions** (UI only - Phase 1, Backend Phase 2/3)
  - Frontend: Mock data với UI đẹp
  - Backend: Implement sau khi có đủ data
  - Dự báo nhu cầu sử dụng
  - Gợi ý nâng cấp hạ tầng
  - Đề xuất số lượng pin cần mua thêm

#### **e. Xử lý Support Tickets**
- [ ] Xem tất cả support tickets
- [ ] Phân công ticket cho staff
- [ ] Trả lời/Xử lý ticket
- [ ] Đóng ticket khi hoàn thành

---

## 🗄️ DATABASE MODELS (Đơn giản hóa cho MVP)

### **User**
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String   // hashed
  full_name     String
  phone         String?
  avatar        String?
  role          Role     @default(DRIVER)
  status        UserStatus @default(ACTIVE)
  station_id    String?  // for STAFF only
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  
  // Relations
  vehicles      Vehicle[]
  bookings      Booking[]
  transactions  Transaction[]
  subscriptions UserSubscription[]
  tickets       SupportTicket[]
  ratings       StationRating[]
  station       Station? @relation(fields: [station_id], references: [id])
}

enum Role {
  DRIVER
  STAFF
  ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  BANNED
}
```

### **Vehicle**
```prisma
model Vehicle {
  id              String   @id @default(uuid())
  user_id         String
  license_plate   String   @unique
  vehicle_type    VehicleType
  
  // Vehicle details (for better UX)
  make            String?      // "Tesla", "BYD", "VinFast"
  model           String?      // "Model 3", "Tang EV"
  year            Int?         // 2023
  
  // Battery
  battery_model   String       // "Standard_75kWh", "LongRange_100kWh"
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  // Relations
  user            User @relation(fields: [user_id], references: [id])
  bookings        Booking[]
  transactions    Transaction[]
}

enum VehicleType {
  motorbike
  car
}
```

### **Station**
```prisma
model Station {
  id                  String   @id @default(uuid())
  name                String
  address             String
  latitude            Decimal
  longitude           Decimal
  capacity            Int      // số lượng pin tối đa
  supported_models    Json     // ["model_A", "model_B"]
  operating_hours     String?  // "06:00-22:00"
  status              StationStatus @default(active)
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  
  // Relations
  batteries           Battery[]
  bookings            Booking[]
  transactions        Transaction[]
  ratings             StationRating[]
  staff               User[]
}

enum StationStatus {
  active
  maintenance
  closed
}
```

### **Battery**
```prisma
model Battery {
  id              String   @id @default(uuid())
  battery_code    String   @unique
  model           String           // "Standard_75kWh", "LongRange_100kWh"
  station_id      String
  
  // Status & Charge
  status          BatteryStatus @default(full)
  current_charge  Int      @default(100)  // 0-100% - CRITICAL for operations
  
  // Specifications
  capacity_kwh    Decimal
  voltage         Decimal?
  
  // Timestamps
  last_charged_at DateTime?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  // Relations
  station                 Station @relation(fields: [station_id], references: [id])
  transactions_as_old     Transaction[] @relation("OldBattery")
  transactions_as_new     Transaction[] @relation("NewBattery")
}

enum BatteryStatus {
  full          // 100% - Sẵn sàng đổi
  charging      // 1-99% - Đang sạc
  in_use        // Đang được sử dụng bởi tài xế
  maintenance   // Bảo dưỡng
  damaged       // Hỏng
}
```

### **Booking**
```prisma
model Booking {
  id                      String   @id @default(uuid())
  booking_code            String   @unique // "BSS20240101ABC"
  user_id                 String
  vehicle_id              String
  station_id              String
  battery_model           String
  scheduled_at            DateTime
  status                  BookingStatus @default(pending)
  checked_in_at           DateTime?
  checked_in_by_staff_id  String?
  notes                   String?
  created_at              DateTime @default(now())
  
  // Relations
  user            User @relation(fields: [user_id], references: [id])
  vehicle         Vehicle @relation(fields: [vehicle_id], references: [id])
  station         Station @relation(fields: [station_id], references: [id])
  transaction     Transaction?
}

enum BookingStatus {
  pending
  confirmed
  completed
  cancelled
}
```

### **Transaction**
```prisma
model Transaction {
  id                  String   @id @default(uuid())
  transaction_code    String   @unique
  booking_id          String?  @unique
  user_id             String
  vehicle_id          String
  station_id          String
  old_battery_id      String?  // pin người dùng trả lại
  new_battery_id      String   // pin mới giao cho user
  swap_at             DateTime @default(now())
  staff_id            String   // staff xử lý
  payment_status      PaymentStatus @default(pending)
  amount              Decimal
  notes               String?
  created_at          DateTime @default(now())
  
  // Relations
  booking         Booking? @relation(fields: [booking_id], references: [id])
  user            User @relation(fields: [user_id], references: [id])
  vehicle         Vehicle @relation(fields: [vehicle_id], references: [id])
  station         Station @relation(fields: [station_id], references: [id])
  old_battery     Battery? @relation("OldBattery", fields: [old_battery_id], references: [id])
  new_battery     Battery @relation("NewBattery", fields: [new_battery_id], references: [id])
  payment         Payment?
  rating          StationRating?
}

enum PaymentStatus {
  pending
  completed
  failed
}
```

### **Payment**
```prisma
model Payment {
  id                  String   @id @default(uuid())
  transaction_id      String?  @unique
  subscription_id     String?
  user_id             String
  amount              Decimal
  payment_method      PaymentMethod
  payment_status      PaymentStatus @default(pending)
  payment_gateway_ref String?  // VNPay/Momo transaction ID
  paid_at             DateTime?
  created_at          DateTime @default(now())
  
  // Relations
  transaction     Transaction? @relation(fields: [transaction_id], references: [id])
  subscription    UserSubscription? @relation(fields: [subscription_id], references: [id])
}

enum PaymentMethod {
  cash
  vnpay
  momo
  credit_card
}
```

### **ServicePackage**
```prisma
model ServicePackage {
  id              String   @id @default(uuid())
  name            String
  description     String
  price           Decimal
  swap_limit      Int?     // null = unlimited
  duration_days   Int      // thời hạn (ngày)
  battery_models  Json     // ["model_A", "model_B"]
  is_active       Boolean  @default(true)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  // Relations
  subscriptions   UserSubscription[]
}
```

### **UserSubscription**
```prisma
model UserSubscription {
  id                String   @id @default(uuid())
  user_id           String
  package_id        String
  start_date        DateTime
  end_date          DateTime
  remaining_swaps   Int?     // null nếu unlimited
  status            SubscriptionStatus @default(active)
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  // Relations
  user      User @relation(fields: [user_id], references: [id])
  package   ServicePackage @relation(fields: [package_id], references: [id])
  payments  Payment[]
}

enum SubscriptionStatus {
  active
  expired
  cancelled
}
```

### **SupportTicket**
```prisma
model SupportTicket {
  id                  String   @id @default(uuid())
  ticket_number       String   @unique // "TKT20240101001"
  user_id             String
  category            TicketCategory
  subject             String
  description         String
  priority            Priority @default(medium)
  status              TicketStatus @default(open)
  assigned_to_staff_id String?
  resolved_at         DateTime?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  
  // Relations
  user        User @relation(fields: [user_id], references: [id])
  replies     TicketReply[]
}

enum TicketCategory {
  battery_issue
  station_issue
  payment_issue
  service_complaint
  other
}

enum Priority {
  low
  medium
  high
  urgent
}

enum TicketStatus {
  open
  in_progress
  resolved
  closed
}
```

### **TicketReply**
```prisma
model TicketReply {
  id          String   @id @default(uuid())
  ticket_id   String
  user_id     String
  message     String
  created_at  DateTime @default(now())
  
  // Relations
  ticket      SupportTicket @relation(fields: [ticket_id], references: [id])
}
```

### **StationRating**
```prisma
model StationRating {
  id              String   @id @default(uuid())
  user_id         String
  station_id      String
  transaction_id  String   @unique  // Chỉ rate sau khi có transaction
  rating          Int      // 1-5 sao
  comment         String?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  // Relations
  user            User @relation(fields: [user_id], references: [id])
  station         Station @relation(fields: [station_id], references: [id])
  transaction     Transaction @relation(fields: [transaction_id], references: [id])
}
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### **Authentication:**
- JWT-based authentication
- Access token (15 minutes expiry)
- Refresh token (7 days expiry)

### **Authorization Matrix:**

| Chức năng               | Driver    | Staff              | Admin     |
|------------------------|-----------|-------------------|-----------|
| **Account Management** |
| Register/Login         | ✅        | ✅                | ✅        |
| View own profile       | ✅        | ✅                | ✅        |
| Edit own profile       | ✅        | ✅                | ✅        |
| **Vehicle Management** |
| CRUD own vehicles      | ✅        | ❌                | ✅        |
| **Station**            |
| View stations          | ✅        | ✅                | ✅        |
| CRUD stations          | ❌        | ❌                | ✅        |
| **Battery**            |
| View batteries         | ❌        | ✅ (own station)  | ✅ (all)  |
| Update battery status  | ❌        | ✅                | ✅        |
| Coordinate batteries   | ❌        | ❌                | ✅        |
| **Booking**            |
| Create booking         | ✅        | ❌                | ✅        |
| View bookings          | ✅ (own)  | ✅ (station)      | ✅ (all)  |
| Cancel booking         | ✅ (own)  | ❌                | ✅        |
| Check-in booking       | ❌        | ✅                | ✅        |
| **Transaction**        |
| View transactions      | ✅ (own)  | ✅ (station)      | ✅ (all)  |
| Create transaction     | ❌        | ✅                | ✅        |
| **Payment**            |
| Make payment           | ✅        | ❌                | ✅        |
| View payments          | ✅ (own)  | ❌                | ✅ (all)  |
| **Service Package**    |
| View packages          | ✅        | ✅                | ✅        |
| Subscribe to package   | ✅        | ❌                | ✅        |
| CRUD packages          | ❌        | ❌                | ✅        |
| **Support Ticket**     |
| Create ticket          | ✅        | ❌                | ✅        |
| View tickets           | ✅ (own)  | ✅ (assigned)     | ✅ (all)  |
| Assign/resolve tickets | ❌        | ✅                | ✅        |
| **Station Rating**     |
| Rate station           | ✅        | ❌                | ❌        |
| View ratings           | ✅        | ✅                | ✅        |
| Edit/Delete own rating | ✅        | ❌                | ❌        |
| **Reports**            |
| View reports           | ❌        | ❌                | ✅        |
| **User Management**    |
| Manage users           | ❌        | ❌                | ✅        |

---

## 🚀 API ENDPOINTS (ƯU TIÊN MVP)

### **1. Authentication** (Priority: HIGH)
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
```

### **2. Users** (Priority: HIGH)
```
GET    /api/v1/users/me
PUT    /api/v1/users/me
GET    /api/v1/users           (Admin only)
POST   /api/v1/users           (Admin - create staff/admin)
PUT    /api/v1/users/:id       (Admin only)
DELETE /api/v1/users/:id       (Admin only)
PUT    /api/v1/users/:id/status (Admin - ban/unban)
```

### **3. Vehicles** (Priority: HIGH)
```
GET    /api/v1/vehicles
POST   /api/v1/vehicles
GET    /api/v1/vehicles/:id
PUT    /api/v1/vehicles/:id
DELETE /api/v1/vehicles/:id
```

### **4. Stations** (Priority: HIGH)
```
GET    /api/v1/stations
GET    /api/v1/stations/:id
GET    /api/v1/stations/nearby?lat=&lng=&battery_model=
POST   /api/v1/stations        (Admin)
PUT    /api/v1/stations/:id    (Admin)
DELETE /api/v1/stations/:id    (Admin)
GET    /api/v1/stations/:id/stats (Admin - doanh thu, số pin)
```

### **5. Batteries** (Priority: HIGH)
```
GET    /api/v1/batteries?station_id=&status=&model=
GET    /api/v1/batteries/:id
POST   /api/v1/batteries       (Admin)
PUT    /api/v1/batteries/:id/status (Staff, Admin)
PUT    /api/v1/batteries/:id/transfer (Admin - điều phối)
```

### **6. Bookings** (Priority: HIGH)
```
GET    /api/v1/bookings
POST   /api/v1/bookings        (Driver)
GET    /api/v1/bookings/:id
PUT    /api/v1/bookings/:id/cancel (Driver)
POST   /api/v1/bookings/:id/checkin (Staff - check-in)
```

### **7. Transactions** (Priority: HIGH)
```
GET    /api/v1/transactions
POST   /api/v1/transactions    (Staff - perform swap)
GET    /api/v1/transactions/:id
```

### **8. Payments** (Priority: MEDIUM)
```
POST   /api/v1/payments/create
GET    /api/v1/payments/callback (VNPay/Momo webhook)
GET    /api/v1/payments
GET    /api/v1/payments/:id
```

### **9. Service Packages** (Priority: MEDIUM)
```
GET    /api/v1/packages
GET    /api/v1/packages/:id
POST   /api/v1/packages        (Admin)
PUT    /api/v1/packages/:id    (Admin)
DELETE /api/v1/packages/:id    (Admin)
```

### **10. Subscriptions** (Priority: MEDIUM)
```
GET    /api/v1/subscriptions
POST   /api/v1/subscriptions   (Driver - subscribe)
GET    /api/v1/subscriptions/:id
PUT    /api/v1/subscriptions/:id/cancel
```

### **11. Support Tickets** (Priority: LOW)
```
GET    /api/v1/tickets
POST   /api/v1/tickets         (Driver)
GET    /api/v1/tickets/:id
PUT    /api/v1/tickets/:id/assign (Admin)
PUT    /api/v1/tickets/:id/resolve (Staff, Admin)
POST   /api/v1/tickets/:id/replies
```

### **12. Station Ratings** (Priority: MEDIUM)
```
POST   /api/v1/ratings         (Driver - rate after swap)
GET    /api/v1/ratings?station_id=&user_id=
GET    /api/v1/ratings/:id
PUT    /api/v1/ratings/:id     (Driver - edit own rating)
DELETE /api/v1/ratings/:id     (Driver - delete own rating)
GET    /api/v1/stations/:id/ratings (View all ratings for station)
GET    /api/v1/stations/:id/rating-summary (Average rating + count)
```

### **13. Reports** (Priority: LOW - Admin only)
```
GET    /api/v1/reports/overview
GET    /api/v1/reports/revenue?from=&to=&station_id=
GET    /api/v1/reports/swaps?from=&to=
GET    /api/v1/reports/batteries?station_id=
GET    /api/v1/reports/peak-hours?from=&to=
```

---

## 📆 ROADMAP TRIỂN KHAI

### **Phase 1: MVP (Web-only)** - 6-8 tuần
**Mục tiêu:** Đặt lịch – Đổi pin – Thanh toán cơ bản

| Week | Task |
|------|------|
| 1-2  | Setup project, Database schema, Auth (JWT) |
| 3    | User & Vehicle management |
| 4    | Station & Battery management |
| 5    | Booking flow |
| 6    | Transaction (Swap process) |
| 7    | Payment & Subscription |
| 8    | Testing & Bug fixes |

**Deliverables:**
- ✅ Driver: Đăng ký, đặt lịch, thanh toán, rating
- ✅ Staff: Quản lý pin (với % charge), xử lý đổi pin
- ✅ Admin: CRUD trạm, pin, user, gói dịch vụ
- ✅ Báo cáo cơ bản (doanh thu, số lượt đổi)
- ✅ Rating system (đánh giá dịch vụ)

---

### **Phase 2: Dashboard & Reports** - 2-3 tuần
**Mục tiêu:** Nâng cao quản trị, báo cáo chi tiết

- Dashboard admin với charts
- Báo cáo doanh thu theo trạm/tháng
- Báo cáo giờ cao điểm
- Tối ưu UI/UX
- Support ticket system

---

### **Phase 3: Mở rộng (Optional)** - Future
**Mục tiêng:** Tích hợp IoT, AI, Automation

- IoT sensors tự động cập nhật trạng thái pin
- QR code scanning cho booking
- AI dự báo nhu cầu sử dụng
- Kiosk tự động
- Mobile app (Flutter)

---

## ✅ BUSINESS LOGIC QUAN TRỌNG

### **1. Quy tắc Subscription**
```typescript
// Mỗi user chỉ có 1 subscription ACTIVE
// Khi đổi pin:
if (user.activeSubscription && user.activeSubscription.remaining_swaps > 0) {
  // Trừ 1 lượt
  user.activeSubscription.remaining_swaps -= 1;
  transaction.amount = 0; // Miễn phí
} else {
  // Tính phí theo lượt
  transaction.amount = SWAP_PRICE;
}
```

### **2. Quy tắc Booking**
```typescript
// Chỉ cho phép booking nếu trạm có pin tương thích
const availableBatteries = await Battery.count({
  station_id: booking.station_id,
  model: booking.battery_model,
  status: 'full'
});

if (availableBatteries === 0) {
  throw new Error('Không có pin sẵn có tại trạm này');
}
```

### **3. Quy tắc Swap Transaction**
```typescript
// Khi staff thực hiện đổi pin:
// 1. Cập nhật pin cũ
await Battery.update(old_battery_id, { 
  status: 'charging',
  assigned_to: null 
});

// 2. Cập nhật pin mới
await Battery.update(new_battery_id, { 
  status: 'in_use',
  assigned_to: vehicle_id 
});

// 3. Tạo transaction
await Transaction.create({
  old_battery_id,
  new_battery_id,
  user_id,
  vehicle_id,
  station_id,
  staff_id,
  swap_at: new Date()
});

// 4. Update booking status
await Booking.update(booking_id, { 
  status: 'completed',
  checked_in_at: new Date()
});
```

### **4. Quy tắc Battery Charging & Status Update**
```typescript
// Staff cập nhật % pin (manual hoặc từ charging system)
async function updateBatteryCharge(battery_id: string, charge: number) {
  // Validate
  if (charge < 0 || charge > 100) {
    throw new Error('Invalid charge percentage');
  }
  
  // Auto-determine status based on charge
  let status: BatteryStatus;
  if (charge === 100) {
    status = 'full';
  } else if (charge > 0 && charge < 100) {
    status = 'charging';
  }
  
  await Battery.update(battery_id, {
    current_charge: charge,
    status: status,
    last_charged_at: new Date(),
    updated_at: new Date()
  });
}

// Dự đoán thời gian sạc đầy
function estimateChargeTime(current_charge: number): number {
  const remainingPercent = 100 - current_charge;
  const minutesPerPercent = 0.8; // Giả sử 0.8 phút cho mỗi 1%
  return Math.ceil(remainingPercent * minutesPerPercent);
}

// Example:
// Pin đang 45% → Còn 55% → ~44 phút nữa đầy
// Pin đang 95% → Còn 5% → ~4 phút nữa đầy
```

### **5. Quy tắc Rating System**
```typescript
// Driver chỉ có thể rate sau khi hoàn thành transaction
async function createRating(data: {
  user_id: string;
  station_id: string;
  transaction_id: string;
  rating: number;
  comment?: string;
}) {
  // Validate rating
  if (data.rating < 1 || data.rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  
  // Check transaction exists và thuộc về user
  const transaction = await Transaction.findUnique({
    where: { id: data.transaction_id },
    include: { rating: true }
  });
  
  if (!transaction) {
    throw new Error('Transaction not found');
  }
  
  if (transaction.user_id !== data.user_id) {
    throw new Error('Unauthorized');
  }
  
  // Check đã rate chưa
  if (transaction.rating) {
    throw new Error('Already rated this transaction');
  }
  
  // Check transaction đã completed
  if (transaction.payment_status !== 'completed') {
    throw new Error('Can only rate completed transactions');
  }
  
  // Create rating
  await StationRating.create(data);
  
  // Update station average rating (optional)
  await updateStationAverageRating(data.station_id);
}

// Tính average rating cho station
async function updateStationAverageRating(station_id: string) {
  const ratings = await StationRating.findMany({
    where: { station_id }
  });
  
  const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  const totalRatings = ratings.length;
  
  // Store in Station or cache
  return { avgRating: avgRating.toFixed(1), totalRatings };
}
```

---

## 🎯 SUCCESS METRICS (MVP)

- **Functional:** Tất cả 3 roles có thể thực hiện workflow cơ bản
- **Performance:** API response < 500ms
- **Reliability:** Uptime > 99%
- **Security:** JWT auth, password hashing, SQL injection prevention
- **Testing:** Unit test coverage > 70%

---

**Phiên bản này đã được tối ưu cho MVP, loại bỏ complexity không cần thiết, tập trung vào core features!**
