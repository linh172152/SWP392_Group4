# 🗄️ EV Battery Swap Station – Database Setup (Complete)

## 💡 Tổng quan

* **Database:** `ev_battery_swap_db`
* **Kiểu DB:** Relational (MySQL / PostgreSQL / SQL Server)
* **ORM khuyến nghị:** Prisma ORM / Entity Framework / Sequelize
* **Tổng số tables:** 12
* **Quan hệ chính:**
  * 1 `User` → n `Vehicle`, n `Booking`, n `Transaction`, n `Rating`
  * 1 `Station` → n `Battery`, n `Booking`, n `Transaction`, n `Rating`
  * 1 `Battery` → có thể thuộc nhiều `Transaction` (as old/new)
  * 1 `ServicePackage` → n `UserSubscription`
  * 1 `Transaction` → 1 `Payment`, 1 `StationRating`
  * 1 `SupportTicket` → n `TicketReply`

---

## 📊 Database Schema

### 🔰 1. **User**

| Field         | Type                               | Constraint                  | Description             |
| ------------- | ---------------------------------- | --------------------------- | ----------------------- |
| user_id       | UUID                               | PK                          | Mã định danh người dùng |
| full_name     | VARCHAR(100)                       | NOT NULL                    | Họ tên                  |
| email         | VARCHAR(100)                       | UNIQUE, NOT NULL            | Email đăng nhập         |
| password_hash | VARCHAR(255)                       | NOT NULL                    | Mật khẩu mã hoá         |
| phone         | VARCHAR(20)                        | NULL                        | Số điện thoại           |
| avatar        | VARCHAR(255)                       | NULL                        | Ảnh đại diện            |
| role          | ENUM('DRIVER','STAFF','ADMIN')     | DEFAULT 'DRIVER', NOT NULL  | Phân quyền              |
| station_id    | UUID                               | FK → `Station(station_id)`  | Với nhân viên (STAFF)   |
| status        | ENUM('ACTIVE','INACTIVE','BANNED') | DEFAULT 'ACTIVE', NOT NULL  | Trạng thái              |
| created_at    | DATETIME                           | DEFAULT CURRENT_TIMESTAMP   |                         |
| updated_at    | DATETIME                           | ON UPDATE CURRENT_TIMESTAMP |                         |

**Relations:**
- `vehicles` → Vehicle[] (1-n)
- `bookings` → Booking[] (1-n)
- `transactions` → Transaction[] (1-n)
- `subscriptions` → UserSubscription[] (1-n)
- `tickets` → SupportTicket[] (1-n)
- `ratings` → StationRating[] (1-n)
- `station` → Station (n-1, for STAFF only)

---

### 🚘 2. **Vehicle**

| Field         | Type                    | Constraint                  | Description           |
| ------------- | ----------------------- | --------------------------- | --------------------- |
| vehicle_id    | UUID                    | PK                          | Mã xe                 |
| user_id       | UUID                    | FK → `User(user_id)`        | Chủ xe                |
| license_plate | VARCHAR(20)             | UNIQUE, NOT NULL            | Biển số xe            |
| vehicle_type  | ENUM('car','motorbike') | NOT NULL                    | Loại phương tiện      |
| make          | VARCHAR(50)             | NULL                        | Hãng sản xuất         |
| model         | VARCHAR(50)             | NULL                        | Mẫu xe                |
| year          | INT                     | NULL                        | Năm sản xuất          |
| battery_model | VARCHAR(50)             | NOT NULL                    | Model pin tương thích |
| created_at    | DATETIME                | DEFAULT CURRENT_TIMESTAMP   |                       |
| updated_at    | DATETIME                | ON UPDATE CURRENT_TIMESTAMP |                       |

**Relations:**
- `user` → User (n-1)
- `bookings` → Booking[] (1-n)
- `transactions` → Transaction[] (1-n)

---

### 🏭 3. **Station**

| Field            | Type                                  | Constraint                  | Description               |
| ---------------- | ------------------------------------- | --------------------------- | ------------------------- |
| station_id       | UUID                                  | PK                          | Mã trạm                   |
| name             | VARCHAR(100)                          | NOT NULL                    | Tên trạm                  |
| address          | VARCHAR(255)                          | NOT NULL                    | Địa chỉ                   |
| latitude         | DECIMAL(10,6)                         | NOT NULL                    | Vị trí GPS                |
| longitude        | DECIMAL(10,6)                         | NOT NULL                    | Vị trí GPS                |
| capacity         | INT                                   | NOT NULL                    | Sức chứa tối đa           |
| supported_models | JSON                                  | NOT NULL                    | Danh sách loại pin hỗ trợ |
| operating_hours  | VARCHAR(50)                           | NULL                        | Giờ hoạt động             |
| status           | ENUM('active','maintenance','closed') | DEFAULT 'active', NOT NULL  |                           |
| created_at       | DATETIME                              | DEFAULT CURRENT_TIMESTAMP   |                           |
| updated_at       | DATETIME                              | ON UPDATE CURRENT_TIMESTAMP |                           |

**Relations:**
- `batteries` → Battery[] (1-n)
- `bookings` → Booking[] (1-n)
- `transactions` → Transaction[] (1-n)
- `ratings` → StationRating[] (1-n)
- `staff` → User[] (1-n, where role='STAFF')

---

### 🔋 4. **Battery**

| Field           | Type                                                     | Constraint                  | Description              |
| --------------- | -------------------------------------------------------- | --------------------------- | ------------------------ |
| battery_id      | UUID                                                     | PK                          | Mã pin                   |
| battery_code    | VARCHAR(50)                                              | UNIQUE, NOT NULL            | Mã định danh pin         |
| station_id      | UUID                                                     | FK → `Station(station_id)`  | Pin đang ở trạm nào      |
| model           | VARCHAR(50)                                              | NOT NULL                    | Model pin                |
| capacity_kwh    | DECIMAL(6,2)                                             | NOT NULL                    | Dung lượng pin           |
| voltage         | DECIMAL(6,2)                                             | NULL                        | Điện áp                  |
| current_charge  | INT                                                      | DEFAULT 100, NOT NULL       | % năng lượng (0-100)     |
| status          | ENUM('full','charging','in_use','maintenance','damaged') | DEFAULT 'full', NOT NULL    | Trạng thái               |
| last_charged_at | DATETIME                                                 | NULL                        | Lần sạc gần nhất         |
| created_at      | DATETIME                                                 | DEFAULT CURRENT_TIMESTAMP   |                          |
| updated_at      | DATETIME                                                 | ON UPDATE CURRENT_TIMESTAMP |                          |

**Relations:**
- `station` → Station (n-1)
- `transactions_as_old` → Transaction[] (1-n)
- `transactions_as_new` → Transaction[] (1-n)

**Constraints:**
```sql
CHECK (current_charge >= 0 AND current_charge <= 100)
```

---

### 📅 5. **Booking**

| Field                  | Type                                                | Constraint                  | Description                      |
| ---------------------- | --------------------------------------------------- | --------------------------- | -------------------------------- |
| booking_id             | UUID                                                | PK                          | Mã booking                       |
| booking_code           | VARCHAR(20)                                         | UNIQUE, NOT NULL            | Mã hiển thị (VD: BSS20250101ABC) |
| user_id                | UUID                                                | FK → `User(user_id)`        | Người đặt                        |
| vehicle_id             | UUID                                                | FK → `Vehicle(vehicle_id)`  | Xe được dùng                     |
| station_id             | UUID                                                | FK → `Station(station_id)`  | Trạm đổi pin                     |
| battery_model          | VARCHAR(50)                                         | NOT NULL                    | Model pin cần đổi                |
| scheduled_at           | DATETIME                                            | NOT NULL                    | Thời gian hẹn                    |
| status                 | ENUM('pending','confirmed','completed','cancelled') | DEFAULT 'pending', NOT NULL |                                  |
| checked_in_at          | DATETIME                                            | NULL                        | Khi tài xế đến trạm              |
| checked_in_by_staff_id | UUID                                                | FK → `User(user_id)`        | Nhân viên xác nhận               |
| notes                  | TEXT                                                | NULL                        |                                  |
| created_at             | DATETIME                                            | DEFAULT CURRENT_TIMESTAMP   |                                  |

**Relations:**
- `user` → User (n-1)
- `vehicle` → Vehicle (n-1)
- `station` → Station (n-1)
- `transaction` → Transaction (1-1, optional)

---

### 🔄 6. **Transaction**

| Field                 | Type                                 | Constraint                         | Description                  |
| --------------------- | ------------------------------------ | ---------------------------------- | ---------------------------- |
| transaction_id        | UUID                                 | PK                                 | Mã giao dịch                 |
| transaction_code      | VARCHAR(30)                          | UNIQUE, NOT NULL                   | Mã định danh                 |
| booking_id            | UUID                                 | FK → `Booking(booking_id)`, UNIQUE | Có thể null                  |
| user_id               | UUID                                 | FK → `User(user_id)`, NOT NULL     |                              |
| vehicle_id            | UUID                                 | FK → `Vehicle(vehicle_id)`         |                              |
| station_id            | UUID                                 | FK → `Station(station_id)`         |                              |
| old_battery_id        | UUID                                 | FK → `Battery(battery_id)`         | Pin cũ (có thể null nếu lần đầu) |
| new_battery_id        | UUID                                 | FK → `Battery(battery_id)`         | Pin mới                      |
| staff_id              | UUID                                 | FK → `User(user_id)`, NOT NULL     | Nhân viên xử lý              |
| swap_at               | DATETIME                             | DEFAULT CURRENT_TIMESTAMP          | Thời gian đổi pin            |
| swap_started_at       | DATETIME                             | NULL                               | Thời điểm bắt đầu swap       |
| swap_completed_at     | DATETIME                             | NULL                               | Thời điểm hoàn thành swap    |
| swap_duration_minutes | INT                                  | NULL                               | Thời gian swap (phút) - KPI  |
| payment_status        | ENUM('pending','completed','failed') | DEFAULT 'pending', NOT NULL        |                              |
| amount                | DECIMAL(10,2)                        | DEFAULT 0, NOT NULL                | Số tiền giao dịch            |
| notes                 | TEXT                                 | NULL                               |                              |
| created_at            | DATETIME                             | DEFAULT CURRENT_TIMESTAMP          |                              |

**Relations:**
- `booking` → Booking (1-1, optional)
- `user` → User (n-1)
- `vehicle` → Vehicle (n-1)
- `station` → Station (n-1)
- `old_battery` → Battery (n-1, optional)
- `new_battery` → Battery (n-1)
- `staff` → User (n-1)
- `payment` → Payment (1-1, optional)
- `rating` → StationRating (1-1, optional)

---

### 💰 7. **Payment**

| Field               | Type                                            | Constraint                               | Description                |
| ------------------- | ----------------------------------------------- | ---------------------------------------- | -------------------------- |
| payment_id          | UUID                                            | PK                                       |                            |
| transaction_id      | UUID                                            | FK → `Transaction(transaction_id)`       | Có thể null                |
| subscription_id     | UUID                                            | FK → `UserSubscription(subscription_id)` | Có thể null                |
| user_id             | UUID                                            | FK → `User(user_id)`, NOT NULL           |                            |
| amount              | DECIMAL(10,2)                                   | NOT NULL                                 |                            |
| payment_method      | ENUM('cash','vnpay','momo','credit_card')       | NOT NULL                                 |                            |
| payment_status      | ENUM('pending','completed','failed','refunded') | DEFAULT 'pending', NOT NULL              |                            |
| payment_gateway_ref | VARCHAR(100)                                    | NULL                                     | Mã giao dịch từ VNPay/Momo |
| paid_at             | DATETIME                                        | NULL                                     |                            |
| created_at          | DATETIME                                        | DEFAULT CURRENT_TIMESTAMP                |                            |

**Relations:**
- `transaction` → Transaction (1-1, optional)
- `subscription` → UserSubscription (n-1, optional)
- `user` → User (n-1)

**Business Logic:**
- Một Payment có thể liên kết với Transaction HOẶC Subscription (không cả hai)

---

### 📦 8. **ServicePackage**

| Field          | Type          | Constraint                  | Description      |
| -------------- | ------------- | --------------------------- | ---------------- |
| package_id     | UUID          | PK                          |                  |
| name           | VARCHAR(100)  | NOT NULL                    | Tên gói          |
| description    | TEXT          | NULL                        |                  |
| price          | DECIMAL(10,2) | NOT NULL                    |                  |
| swap_limit     | INT           | NULL                        | null = unlimited |
| duration_days  | INT           | NOT NULL                    | Thời hạn         |
| battery_models | JSON          | NOT NULL                    | Loại pin áp dụng |
| is_active      | BOOLEAN       | DEFAULT TRUE, NOT NULL      |                  |
| created_at     | DATETIME      | DEFAULT CURRENT_TIMESTAMP   |                  |
| updated_at     | DATETIME      | ON UPDATE CURRENT_TIMESTAMP |                  |

**Relations:**
- `subscriptions` → UserSubscription[] (1-n)

---

### 🧾 9. **UserSubscription**

| Field           | Type                                 | Constraint                         | Description |
| --------------- | ------------------------------------ | ---------------------------------- | ----------- |
| subscription_id | UUID                                 | PK                                 |             |
| user_id         | UUID                                 | FK → `User(user_id)`, NOT NULL     |             |
| package_id      | UUID                                 | FK → `ServicePackage(package_id)`  |             |
| start_date      | DATETIME                             | NOT NULL                           |             |
| end_date        | DATETIME                             | NOT NULL                           |             |
| remaining_swaps | INT                                  | NULL                               |             |
| status          | ENUM('active','expired','cancelled') | DEFAULT 'active', NOT NULL         |             |
| auto_renew      | BOOLEAN                              | DEFAULT FALSE, NOT NULL            |             |
| created_at      | DATETIME                             | DEFAULT CURRENT_TIMESTAMP          |             |
| updated_at      | DATETIME                             | ON UPDATE CURRENT_TIMESTAMP        |             |

**Relations:**
- `user` → User (n-1)
- `package` → ServicePackage (n-1)
- `payments` → Payment[] (1-n)

**Constraints:**
```sql
CHECK (end_date > start_date)
```

**Business Logic:**
- Mỗi User chỉ có 1 subscription với status='active' tại một thời điểm

---

### 🧰 10. **SupportTicket**

| Field                | Type                                                                              | Constraint                  | Description        |
| -------------------- | --------------------------------------------------------------------------------- | --------------------------- | ------------------ |
| ticket_id            | UUID                                                                              | PK                          |                    |
| ticket_number        | VARCHAR(20)                                                                       | UNIQUE, NOT NULL            | VD: TKT20250101001 |
| user_id              | UUID                                                                              | FK → `User(user_id)`        |                    |
| category             | ENUM('battery_issue','station_issue','payment_issue','service_complaint','other') | NOT NULL                    |                    |
| subject              | VARCHAR(100)                                                                      | NOT NULL                    |                    |
| description          | TEXT                                                                              | NOT NULL                    |                    |
| priority             | ENUM('low','medium','high','urgent')                                              | DEFAULT 'medium', NOT NULL  |                    |
| status               | ENUM('open','in_progress','resolved','closed')                                    | DEFAULT 'open', NOT NULL    |                    |
| assigned_to_staff_id | UUID                                                                              | FK → `User(user_id)`        |                    |
| resolved_at          | DATETIME                                                                          | NULL                        |                    |
| created_at           | DATETIME                                                                          | DEFAULT CURRENT_TIMESTAMP   |                    |
| updated_at           | DATETIME                                                                          | ON UPDATE CURRENT_TIMESTAMP |                    |

**Relations:**
- `user` → User (n-1)
- `assigned_to` → User (n-1, optional)
- `replies` → TicketReply[] (1-n)

---

### 💬 11. **TicketReply**

| Field      | Type     | Constraint                         | Description             |
| ---------- | -------- | ---------------------------------- | ----------------------- |
| reply_id   | UUID     | PK                                 |                         |
| ticket_id  | UUID     | FK → `SupportTicket(ticket_id)`    | CRITICAL: CASCADE DELETE|
| user_id    | UUID     | FK → `User(user_id)`, NOT NULL     | Người trả lời           |
| message    | TEXT     | NOT NULL                           |                         |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP          |                         |

**Relations:**
- `ticket` → SupportTicket (n-1)
- `user` → User (n-1)

**Workflow Example:**
```
1. Driver creates ticket
2. Staff replies with TicketReply
3. Driver replies back
4. Multiple TicketReply records for conversation
```

---

### ⭐ 12. **StationRating**

| Field          | Type     | Constraint                         | Description                      |
| -------------- | -------- | ---------------------------------- | -------------------------------- |
| rating_id      | UUID     | PK                                 |                                  |
| user_id        | UUID     | FK → `User(user_id)`, NOT NULL     |                                  |
| station_id     | UUID     | FK → `Station(station_id)`         |                                  |
| transaction_id | UUID     | FK → `Transaction(transaction_id)` | UNIQUE - Một giao dịch chỉ rate 1 lần |
| rating         | INT      | NOT NULL                           | 1-5 sao                          |
| comment        | TEXT     | NULL                               |                                  |
| created_at     | DATETIME | DEFAULT CURRENT_TIMESTAMP          |                                  |
| updated_at     | DATETIME | ON UPDATE CURRENT_TIMESTAMP        |                                  |

**Relations:**
- `user` → User (n-1)
- `station` → Station (n-1)
- `transaction` → Transaction (1-1)

**Constraints:**
```sql
CHECK (rating >= 1 AND rating <= 5)
```

**Business Logic:**
- Driver chỉ có thể rate sau khi transaction hoàn thành (payment_status='completed')
- Mỗi transaction chỉ được rate 1 lần (transaction_id UNIQUE)

---

### 📦 13. **BatteryTransferLog**

| Field            | Type                         | Constraint                         | Description            |
| ---------------- | ---------------------------- | ---------------------------------- | ---------------------- |
| transfer_id      | UUID                         | PK                                 |                        |
| battery_id       | UUID                         | FK → `Battery(battery_id)`         | Pin được điều phối     |
| from_station_id  | UUID                         | FK → `Station(station_id)`         | Trạm nguồn             |
| to_station_id    | UUID                         | FK → `Station(station_id)`         | Trạm đích              |
| transferred_by   | UUID                         | FK → `User(user_id)`, NOT NULL     | Admin thực hiện        |
| reason           | TEXT                         | NULL                               | Lý do điều phối        |
| status           | ENUM('pending','completed')  | DEFAULT 'pending', NOT NULL        | Trạng thái             |
| transferred_at   | DATETIME                     | DEFAULT CURRENT_TIMESTAMP          | Thời gian thực hiện    |
| completed_at     | DATETIME                     | NULL                               | Thời gian hoàn thành   |

**Relations:**
- `battery` → Battery (n-1)
- `from_station` → Station (n-1)
- `to_station` → Station (n-1)
- `transferred_by` → User (n-1)

**Business Logic:**
- Tracking lịch sử điều phối pin giữa các trạm
- Giúp Admin audit trail và phân tích hiệu quả điều phối
- Status 'pending' khi tạo request, 'completed' khi pin đã đến trạm đích

**Use Cases:**
- "Pin này đã từng ở trạm nào?"
- "Trạm A hay chuyển pin cho trạm nào?"
- "Admin nào thực hiện điều phối này?"
- Reports: Số lần điều phối theo trạm, theo tháng

---

## 🔗 Quan hệ tổng hợp (ERD)

```
User ───< Vehicle
    ├───< Booking ──┬─── Station
    ├───< Transaction ┼─── Station
    │                 └─── Battery (old)
    │                 └─── Battery (new)
    ├───< UserSubscription ─── ServicePackage
    ├───< SupportTicket ───< TicketReply
    ├───< StationRating ─── Station
    └───< BatteryTransferLog ─── Battery
                             └─── Station (from)
                             └─── Station (to)

Station ───< Battery ───< BatteryTransferLog
        ├───< Booking
        ├───< Transaction
        └───< StationRating

Transaction ─── Payment
            └─── StationRating (1-1)

SupportTicket ───< TicketReply
```

---

## 🎨 Indexes for Performance

```sql
-- User
CREATE INDEX idx_user_email ON User(email);
CREATE INDEX idx_user_role ON User(role);
CREATE INDEX idx_user_station ON User(station_id) WHERE role='STAFF';

-- Vehicle
CREATE INDEX idx_vehicle_user ON Vehicle(user_id);
CREATE INDEX idx_vehicle_plate ON Vehicle(license_plate);

-- Station
CREATE INDEX idx_station_status ON Station(status);
CREATE INDEX idx_station_location ON Station(latitude, longitude);

-- Battery
CREATE INDEX idx_battery_station_status ON Battery(station_id, status, current_charge);
CREATE INDEX idx_battery_code ON Battery(battery_code);
CREATE INDEX idx_battery_model ON Battery(model, status);

-- Booking
CREATE INDEX idx_booking_user ON Booking(user_id, scheduled_at DESC);
CREATE INDEX idx_booking_station ON Booking(station_id, scheduled_at DESC);
CREATE INDEX idx_booking_status ON Booking(status, scheduled_at);
CREATE INDEX idx_booking_code ON Booking(booking_code);

-- Transaction
CREATE INDEX idx_transaction_user ON Transaction(user_id, swap_at DESC);
CREATE INDEX idx_transaction_station ON Transaction(station_id, swap_at DESC);
CREATE INDEX idx_transaction_code ON Transaction(transaction_code);
CREATE INDEX idx_transaction_booking ON Transaction(booking_id);

-- Payment
CREATE INDEX idx_payment_transaction ON Payment(transaction_id);
CREATE INDEX idx_payment_subscription ON Payment(subscription_id);
CREATE INDEX idx_payment_user ON Payment(user_id, created_at DESC);
CREATE INDEX idx_payment_status ON Payment(payment_status, created_at);

-- UserSubscription
CREATE INDEX idx_subscription_user_status ON UserSubscription(user_id, status);
CREATE INDEX idx_subscription_package ON UserSubscription(package_id);
CREATE INDEX idx_subscription_dates ON UserSubscription(start_date, end_date, status);

-- SupportTicket
CREATE INDEX idx_ticket_user ON SupportTicket(user_id, created_at DESC);
CREATE INDEX idx_ticket_assigned ON SupportTicket(assigned_to_staff_id, status);
CREATE INDEX idx_ticket_status ON SupportTicket(status, priority, created_at);
CREATE INDEX idx_ticket_number ON SupportTicket(ticket_number);

-- TicketReply
CREATE INDEX idx_reply_ticket ON TicketReply(ticket_id, created_at ASC);
CREATE INDEX idx_reply_user ON TicketReply(user_id);

-- StationRating
CREATE INDEX idx_rating_station ON StationRating(station_id, created_at DESC);
CREATE INDEX idx_rating_user ON StationRating(user_id, created_at DESC);
CREATE INDEX idx_rating_transaction ON StationRating(transaction_id);

-- BatteryTransferLog
CREATE INDEX idx_transfer_battery ON BatteryTransferLog(battery_id, transferred_at DESC);
CREATE INDEX idx_transfer_from_station ON BatteryTransferLog(from_station_id, transferred_at DESC);
CREATE INDEX idx_transfer_to_station ON BatteryTransferLog(to_station_id, transferred_at DESC);
CREATE INDEX idx_transfer_admin ON BatteryTransferLog(transferred_by, transferred_at DESC);
CREATE INDEX idx_transfer_status ON BatteryTransferLog(status, transferred_at DESC);
```

---

## 🛡️ Constraints & Business Rules

### **Data Integrity**

```sql
-- Battery charge range
ALTER TABLE Battery 
ADD CONSTRAINT chk_battery_charge 
CHECK (current_charge >= 0 AND current_charge <= 100);

-- Rating range
ALTER TABLE StationRating 
ADD CONSTRAINT chk_rating_range 
CHECK (rating >= 1 AND rating <= 5);

-- Subscription dates
ALTER TABLE UserSubscription 
ADD CONSTRAINT chk_subscription_dates 
CHECK (end_date > start_date);

-- Amount non-negative
ALTER TABLE Payment 
ADD CONSTRAINT chk_payment_amount 
CHECK (amount >= 0);

ALTER TABLE Transaction 
ADD CONSTRAINT chk_transaction_amount 
CHECK (amount >= 0);

-- Capacity positive
ALTER TABLE Station 
ADD CONSTRAINT chk_station_capacity 
CHECK (capacity > 0);
```

### **Business Logic Constraints**

```sql
-- User với role STAFF phải có station_id
-- Implement ở application layer

-- Mỗi User chỉ có 1 subscription active
-- Implement ở application layer với unique index:
CREATE UNIQUE INDEX idx_user_active_subscription 
ON UserSubscription(user_id) 
WHERE status='active';

-- Transaction_id unique trong StationRating
-- Đã có constraint UNIQUE trên transaction_id

-- Payment phải link với Transaction HOẶC Subscription (không cả hai)
-- Implement ở application layer

-- Swap duration phải dương
ALTER TABLE Transaction
ADD CONSTRAINT chk_swap_duration
CHECK (swap_duration_minutes IS NULL OR swap_duration_minutes > 0);

-- Transfer phải khác trạm
ALTER TABLE BatteryTransferLog
ADD CONSTRAINT chk_different_stations
CHECK (from_station_id != to_station_id);
```

---

## 🚀 Sample Queries

### **Tìm trạm gần nhất có pin**
```sql
SELECT 
  s.*,
  COUNT(b.battery_id) as available_batteries
FROM Station s
LEFT JOIN Battery b ON b.station_id = s.station_id 
  AND b.status = 'full' 
  AND b.model = 'Standard_75kWh'
WHERE s.status = 'active'
GROUP BY s.station_id
HAVING available_batteries > 0
ORDER BY (
  POW(s.latitude - ?, 2) + POW(s.longitude - ?, 2)
) ASC
LIMIT 10;
```

### **Lấy transaction history của user**
```sql
SELECT 
  t.*,
  s.name as station_name,
  v.license_plate,
  old_b.battery_code as old_battery,
  new_b.battery_code as new_battery,
  p.payment_status,
  r.rating
FROM Transaction t
JOIN Station s ON s.station_id = t.station_id
JOIN Vehicle v ON v.vehicle_id = t.vehicle_id
LEFT JOIN Battery old_b ON old_b.battery_id = t.old_battery_id
JOIN Battery new_b ON new_b.battery_id = t.new_battery_id
LEFT JOIN Payment p ON p.transaction_id = t.transaction_id
LEFT JOIN StationRating r ON r.transaction_id = t.transaction_id
WHERE t.user_id = ?
ORDER BY t.swap_at DESC;
```

### **Tính average rating của station**
```sql
SELECT 
  s.station_id,
  s.name,
  COUNT(r.rating_id) as total_ratings,
  AVG(r.rating) as avg_rating
FROM Station s
LEFT JOIN StationRating r ON r.station_id = s.station_id
GROUP BY s.station_id, s.name;
```

### **Kiểm tra subscription của user**
```sql
SELECT 
  us.*,
  sp.name as package_name,
  sp.price,
  sp.swap_limit,
  DATEDIFF(us.end_date, NOW()) as days_remaining
FROM UserSubscription us
JOIN ServicePackage sp ON sp.package_id = us.package_id
WHERE us.user_id = ?
  AND us.status = 'active'
LIMIT 1;
```

### **Average swap time per station (KPI)**
```sql
SELECT 
  s.station_id,
  s.name,
  COUNT(t.transaction_id) as total_swaps,
  AVG(t.swap_duration_minutes) as avg_duration_minutes,
  MIN(t.swap_duration_minutes) as fastest_swap,
  MAX(t.swap_duration_minutes) as slowest_swap
FROM Station s
LEFT JOIN Transaction t ON t.station_id = s.station_id
WHERE t.swap_duration_minutes IS NOT NULL
  AND t.swap_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY s.station_id, s.name
ORDER BY avg_duration_minutes ASC;
```

### **Battery transfer history**
```sql
SELECT 
  btl.*,
  b.battery_code,
  b.model,
  fs.name as from_station_name,
  ts.name as to_station_name,
  u.full_name as admin_name
FROM BatteryTransferLog btl
JOIN Battery b ON b.battery_id = btl.battery_id
JOIN Station fs ON fs.station_id = btl.from_station_id
JOIN Station ts ON ts.station_id = btl.to_station_id
JOIN User u ON u.user_id = btl.transferred_by
WHERE btl.battery_id = ?
ORDER BY btl.transferred_at DESC;
```

### **Peak hours analysis với swap duration**
```sql
SELECT 
  HOUR(swap_at) as hour,
  COUNT(*) as total_swaps,
  AVG(swap_duration_minutes) as avg_duration,
  SUM(CASE WHEN swap_duration_minutes <= 5 THEN 1 ELSE 0 END) as fast_swaps,
  SUM(CASE WHEN swap_duration_minutes > 5 THEN 1 ELSE 0 END) as slow_swaps
FROM Transaction
WHERE swap_duration_minutes IS NOT NULL
  AND swap_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY HOUR(swap_at)
ORDER BY total_swaps DESC;
```

### **Station transfer statistics (Admin reports)**
```sql
-- Trạm nào hay nhận/chuyển pin
SELECT 
  s.station_id,
  s.name,
  COUNT(CASE WHEN btl.from_station_id = s.station_id THEN 1 END) as batteries_sent,
  COUNT(CASE WHEN btl.to_station_id = s.station_id THEN 1 END) as batteries_received,
  (COUNT(CASE WHEN btl.to_station_id = s.station_id THEN 1 END) - 
   COUNT(CASE WHEN btl.from_station_id = s.station_id THEN 1 END)) as net_balance
FROM Station s
LEFT JOIN BatteryTransferLog btl ON (
  btl.from_station_id = s.station_id OR 
  btl.to_station_id = s.station_id
)
WHERE btl.transferred_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY s.station_id, s.name
ORDER BY net_balance DESC;
```

---

## 📝 Migration Order

**Thứ tự tạo tables (respect foreign keys):**

1. `User`
2. `Station`
3. `Vehicle`
4. `Battery`
5. `ServicePackage`
6. `UserSubscription`
7. `Booking`
8. `Transaction`
9. `Payment`
10. `SupportTicket`
11. `TicketReply`
12. `StationRating`
13. `BatteryTransferLog`

---

## ✅ Checklist Hoàn thành

```
✅ 13 Tables defined (12 core + 1 tracking)
✅ All foreign keys specified
✅ 40+ Indexes for performance
✅ Constraints for data integrity
✅ Relations documented
✅ 8 Sample queries provided (including KPIs)
✅ Migration order defined
✅ Business rules documented
✅ KPI tracking (swap_duration_minutes)
✅ Audit trail (BatteryTransferLog)
```

---

## 🎯 Key Features Summary

### **Phase 1 MVP:**
- ✅ Core 12 tables
- ✅ Transaction với swap_duration (KPI tracking)
- ✅ Rating system
- ✅ Payment system
- ✅ Subscription management

### **Phase 2 Enhancement:**
- ✅ BatteryTransferLog (audit trail)
- ✅ Advanced reports (performance, transfer stats)
- ✅ AI Suggestions (UI mockup)

### **NOT Included (intentionally):**
- ❌ audit_log (overkill for MVP)
- ❌ SoH tracking (Phase 3)
- ❌ IoT integration (Phase 3)

---

**Database design hoàn chỉnh 100%! Ready for implementation! 🚀**

