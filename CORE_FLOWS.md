# 🔄 Core Flows - Hệ Thống EV Battery Swap

> **Mục đích:** File này mô tả các core flow chính của toàn bộ dự án để làm slide thuyết trình

---

## 📋 Mục Lục Core Flows

1. [Authentication Flow (Đăng ký/Đăng nhập)](#1-authentication-flow)
2. [Booking Flow (Đặt lịch → Xác nhận → Hoàn thành)](#2-booking-flow)
3. [Payment Flow (Nạp tiền qua VNPay)](#3-payment-flow)
4. [Subscription Flow (Đăng ký → Sử dụng → Hủy gói)](#4-subscription-flow)
5. [Battery Management Flow (Quản lý pin)](#5-battery-management-flow)
6. [Auto-Cancel & Reminder Flow (Background Jobs)](#6-auto-cancel--reminder-flow)

---

## 1. Authentication Flow

### Mô Tả
Flow đăng ký và đăng nhập của user (Driver, Staff, Admin)

### Actors
- **Guest** (chưa đăng nhập)
- **System** (Backend)

### Flow Diagram

```
┌─────────────┐
│   Guest     │
│  (Chưa đăng │
│    nhập)    │
└──────┬──────┘
       │
       │ 1. Truy cập Landing Page
       ▼
┌─────────────────┐
│  Landing Page   │
│  [Đăng ký]      │
│  [Đăng nhập]    │
└──────┬──────────┘
       │
       ├─► 2a. Click "Đăng ký"
       │   └─► AuthModal (Tab: Đăng ký)
       │       ├─► Nhập: email, password, full_name, phone
       │       ├─► Validate form
       │       └─► POST /api/auth/register
       │
       └─► 2b. Click "Đăng nhập"
           └─► AuthModal (Tab: Đăng nhập)
               ├─► Nhập: email, password
               ├─► Validate form
               └─► POST /api/auth/login
                   │
                   ▼
┌─────────────────────────────┐
│      Backend Processing      │
│  ┌────────────────────────┐ │
│  │ 1. Verify credentials  │ │
│  │ 2. Hash password (reg)  │ │
│  │ 3. Create User          │ │
│  │ 4. Create Wallet (reg)   │ │
│  │ 5. Generate JWT tokens  │ │
│  │    - Access Token       │ │
│  │    - Refresh Token      │ │
│  └────────────────────────┘ │
└──────────────┬───────────────┘
               │
               │ 3. Response: { user, accessToken, refreshToken }
               ▼
┌─────────────────────────────┐
│      Frontend Processing     │
│  ┌────────────────────────┐ │
│  │ 1. Lưu tokens vào       │ │
│  │    localStorage        │ │
│  │ 2. Lưu user info       │ │
│  │ 3. Redirect theo role: │ │
│  │    - DRIVER → /driver  │ │
│  │    - STAFF → /staff    │ │
│  │    - ADMIN → /admin    │ │
│  └────────────────────────┘ │
└──────────────┬───────────────┘
               │
               ▼
┌─────────────────────────────┐
│   Dashboard (Theo Role)      │
└─────────────────────────────┘
```

### Chi Tiết Từng Bước

#### Bước 1: User truy cập Landing Page
- **Trigger:** User mở trang chủ `/`
- **Action:** Hiển thị Landing Page với nút "Đăng ký" và "Đăng nhập"

#### Bước 2a: Đăng ký
- **User action:** Click "Đăng ký" → Mở AuthModal
- **Form fields:**
  - Email (validate format, unique)
  - Password (tối thiểu 6 ký tự)
  - Full name (không để trống)
  - Phone (format số điện thoại VN)
- **Frontend:** Validate form → Gọi `POST /api/auth/register`
- **Backend:**
  1. Validate email chưa tồn tại
  2. Hash password với bcrypt
  3. Tạo User với role = DRIVER (mặc định)
  4. Tạo Wallet tự động (balance = 0)
  5. Generate JWT tokens (Access + Refresh)
  6. Trả về user info + tokens
- **Frontend:** Lưu tokens → Redirect đến `/driver/vehicles`

#### Bước 2b: Đăng nhập
- **User action:** Click "Đăng nhập" → Mở AuthModal
- **Form fields:**
  - Email
  - Password
- **Frontend:** Validate form → Gọi `POST /api/auth/login`
- **Backend:**
  1. Tìm user theo email
  2. Verify password với bcrypt
  3. Generate JWT tokens
  4. Trả về user info + tokens
- **Frontend:** Lưu tokens → Redirect theo role

### Business Rules
- ✅ Tự động tạo Wallet khi đăng ký (balance = 0)
- ✅ Role mặc định = DRIVER
- ✅ JWT Access Token: 15 phút expiry
- ✅ JWT Refresh Token: 7 ngày expiry
- ✅ Auto-refresh token khi sắp hết hạn (2 phút trước)

### Key Points cho Slide
- **Đăng ký:** Tự động tạo Wallet, role mặc định DRIVER
- **Đăng nhập:** JWT với refresh token mechanism
- **Security:** Password hashing, token expiration

---

## 2. Booking Flow

### Mô Tả
Flow đặt lịch đổi pin từ Driver → Staff xác nhận → Staff hoàn thành

### Actors
- **Driver** (Frontend)
- **Staff** (Frontend)
- **System** (Backend, Background Jobs)

### Flow Diagram

```
┌─────────────┐
│   Driver    │
└──────┬──────┘
       │
       │ 1. Tìm trạm (GPS)
       ▼
┌─────────────────┐
│ Station Finding │
│ - GPS location  │
│ - Nearby stations│
└──────┬──────────┘
       │
       │ 2. Chọn trạm → Xem chi tiết
       ▼
┌─────────────────┐
│ Station Detail  │
│ - Pricing       │
│ - Pin available │
│ [Đặt lịch]      │
└──────┬──────────┘
       │
       │ 3. Click "Đặt lịch"
       ▼
┌─────────────────────────────┐
│   Book Battery Page         │
│ ┌─────────────────────────┐│
│ │ 1. Chọn vehicle          ││
│ │ 2. Chọn battery model   ││
│ │ 3. Chọn thời gian        ││
│ │    (30 phút - 12 giờ)    ││
│ │ 4. Check wallet/        ││
│ │    subscription          ││
│ └─────────────────────────┘│
│ [Xác nhận đặt chỗ]          │
└──────┬──────────────────────┘
       │
       │ 4. Submit booking
       ▼
┌─────────────────────────────┐
│      Backend Processing     │
│ ┌─────────────────────────┐ │
│ │ 1. Validate booking     │ │
│ │ 2. Check pin available  │ │
│ │ 3. Lock battery         │ │
│ │    (status = reserved)  │ │
│ │ 4. Lock wallet OR       │ │
│ │    lock subscription    │ │
│ │ 5. Create booking       │ │
│ │    (status = pending)    │ │
│ │ 6. Send notification   │ │
│ └─────────────────────────┘ │
└──────────────┬───────────────┘
               │
               │ 5. Response: Booking created
               ▼
┌─────────────────────────────┐
│   Driver nhận notification   │
│   "Đặt chỗ thành công"       │
│   Status: pending            │
└──────────────┬───────────────┘
               │
               │ (Chờ Staff xác nhận)
               ▼
┌─────────────┐
│   Staff     │
└──────┬──────┘
       │
       │ 6. Xem danh sách booking
       ▼
┌─────────────────┐
│ Swap Transactions│
│ - Booking pending│
│ [Xác nhận]      │
└──────┬──────────┘
       │
       │ 7. Click "Xác nhận"
       │    → Nhập phone driver
       ▼
┌─────────────────────────────┐
│      Backend Processing     │
│ ┌─────────────────────────┐ │
│ │ 1. Verify phone number  │ │
│ │ 2. Update booking       │ │
│ │    (status = confirmed) │ │
│ │ 3. Send notification    │ │
│ └─────────────────────────┘ │
└──────────────┬───────────────┘
               │
               │ 8. Notification: "Đặt chỗ đã được xác nhận"
               ▼
┌─────────────────────────────┐
│   Driver nhận notification   │
│   Status: confirmed          │
└──────────────┬───────────────┘
               │
               │ (Driver đến trạm)
               ▼
┌─────────────────┐
│   Staff         │
│ [Hoàn thành]    │
└──────┬──────────┘
       │
       │ 9. Click "Hoàn thành"
       │    → Auto-fill old battery
       │    → Chọn new battery
       ▼
┌─────────────────────────────┐
│      Backend Processing     │
│ ┌─────────────────────────┐ │
│ │ 1. Update old battery   │ │
│ │    (status = charging)  │ │
│ │ 2. Update new battery  │ │
│ │    (status = in_use)    │ │
│ │ 3. Trừ tiền wallet OR   │ │
│ │    trừ subscription     │ │
│ │ 4. Release lock         │ │
│ │ 5. Create transaction   │ │
│ │ 6. Update booking       │ │
│ │    (status = completed)  │ │
│ │ 7. Send notification    │ │
│ └─────────────────────────┘ │
└──────────────┬───────────────┘
               │
               │ 10. Notification: "Đổi pin thành công"
               ▼
┌─────────────────────────────┐
│   Driver nhận notification   │
│   - Status: completed         │
│   - Transaction created       │
│   - Wallet balance updated    │
│   - Battery codes: BAT001→BAT002│
└─────────────────────────────┘
```

### Chi Tiết Từng Bước

#### Bước 1-3: Driver tìm trạm và đặt lịch
- **Driver:** Tìm trạm gần nhất (GPS) → Chọn trạm → Click "Đặt lịch"
- **Frontend:** Load station details, pricing, available batteries

#### Bước 4: Driver submit booking
- **Frontend:** 
  - Validate: vehicle, battery model, thời gian (30 phút - 12 giờ)
  - Check wallet balance hoặc subscription compatibility
  - Gọi `POST /api/driver/bookings`
- **Backend:**
  1. Validate booking data
  2. Check pin available tại thời điểm đặt
  3. Reserve battery (status = `reserved`)
  4. Lock wallet amount hoặc lock subscription
  5. Tạo booking (status = `pending`)
  6. Gửi notification cho Driver

#### Bước 5: Driver nhận notification
- **Socket.IO:** `type: "booking_confirmed"`
- **Message:** "Đặt chỗ thành công! Mã đặt chỗ: BK-001"
- **Frontend:** Auto-refresh Booking History

#### Bước 6-7: Staff xác nhận booking
- **Staff:** Xem danh sách booking → Click "Xác nhận" → Nhập phone driver
- **Frontend:** Gọi `POST /api/staff/bookings/:id/confirm`
- **Backend:**
  1. Verify phone number của driver
  2. Update booking (status = `confirmed`)
  3. Gửi notification cho Driver

#### Bước 8: Driver nhận notification xác nhận
- **Socket.IO:** `type: "booking_confirmed"`
- **Message:** "Đặt chỗ đã được xác nhận"
- **Frontend:** Auto-refresh Booking History (status = `confirmed`)

#### Bước 9: Staff hoàn thành booking
- **Staff:** Click "Hoàn thành" → Auto-fill old battery → Chọn new battery
- **Frontend:** Gọi `POST /api/staff/bookings/:id/complete`
- **Backend:**
  1. Update old battery (status = `charging` hoặc `damaged`/`maintenance`)
  2. Update new battery (status = `in_use`)
  3. Trừ tiền từ wallet hoặc trừ subscription
  4. Release wallet/subscription lock
  5. Tạo transaction record
  6. Update booking (status = `completed`)
  7. Gửi notification cho Driver

#### Bước 10: Driver nhận notification hoàn thành
- **Socket.IO:** `type: "booking_completed"` hoặc transaction created
- **Message:** "Đổi pin thành công"
- **Frontend:** 
  - Auto-refresh Booking History (status = `completed`)
  - Auto-refresh Transaction History (có transaction mới)
  - Auto-refresh Wallet (balance đã giảm)
  - Hiển thị battery codes: "BAT001 → BAT002"

### Business Rules
- ✅ **Lock mechanism:** Lock wallet/subscription khi đặt chỗ
- ✅ **Battery reservation:** Pin được reserve (status = `reserved`)
- ✅ **Phone verification:** Staff verify bằng phone (không cần PIN)
- ✅ **Auto-fill:** Old battery code tự động fill từ vehicle
- ✅ **Payment:** Trừ tiền khi hoàn thành (không phải khi đặt)

### Key Points cho Slide
- **Driver-Staff collaboration:** Driver đặt → Staff xác nhận → Staff hoàn thành
- **Real-time notification:** Socket.IO cho instant updates
- **Lock mechanism:** Đảm bảo có đủ tiền/pin khi đến trạm
- **Auto-fill:** Giảm lỗi nhập liệu cho Staff

---

## 3. Payment Flow (Nạp tiền qua VNPay)

### Mô Tả
Flow nạp tiền vào ví thông qua VNPay gateway

### Actors
- **Driver** (Frontend)
- **VNPay** (Payment Gateway)
- **System** (Backend)

### Flow Diagram

```
┌─────────────┐
│   Driver     │
└──────┬──────┘
       │
       │ 1. Click "Nạp tiền"
       ▼
┌─────────────────┐
│  Wallet Page    │
│  [Nạp tiền]     │
└──────┬──────────┘
       │
       │ 2. Click "Nạp tiền"
       ▼
┌─────────────────────────────┐
│   TopUp Modal               │
│ ┌─────────────────────────┐│
│ │ Chọn gói nạp tiền:      ││
│ │ - 200K → 200K           ││
│ │ - 500K → 550K (+50K)    ││
│ │ Hoặc nhập số tiền       ││
│ └─────────────────────────┘│
│ [Thanh toán VNPay]          │
└──────┬──────────────────────┘
       │
       │ 3. Submit top-up request
       ▼
┌─────────────────────────────┐
│      Backend Processing     │
│ ┌─────────────────────────┐ │
│ │ 1. Create payment record│ │
│ │ 2. Generate VNPay URL   │ │
│ │    - TMN Code           │ │
│ │    - Amount             │ │
│ │    - Return URL         │ │
│ │    - Signature (HMAC)   │ │
│ └─────────────────────────┘ │
└──────────────┬───────────────┘
               │
               │ 4. Response: { payment_url }
               ▼
┌─────────────────────────────┐
│   Frontend Redirect          │
│   window.location.href =     │
│   payment_url                │
└──────────────┬───────────────┘
               │
               ▼
┌─────────────────────────────┐
│      VNPay Gateway           │
│  (Sandbox/Production)        │
│  - User thanh toán          │
│  - VNPay xử lý payment       │
└──────────────┬───────────────┘
               │
               ├─► 5a. Thanh toán thành công
               │   └─► Redirect về: /payment/success
               │
               └─► 5b. Thanh toán thất bại
                   └─► Redirect về: /payment/error
                       │
                       ▼
┌─────────────────────────────┐
│      Backend Processing     │
│  (Return URL Handler)       │
│ ┌─────────────────────────┐ │
│ │ 1. Verify signature     │ │
│ │    (HMAC SHA512)        │ │
│ │ 2. Check payment status │ │
│ │ 3. Update wallet        │ │
│ │    balance              │ │
│ │ 4. Create wallet        │ │
│ │    transaction          │ │
│ └─────────────────────────┘ │
└──────────────┬───────────────┘
               │
               │ 6. Response: Success/Error
               ▼
┌─────────────────────────────┐
│   Payment Success Page       │
│   - Hiển thị "Nạp tiền      │
│     thành công"              │
│   - Refresh wallet balance   │
│   - Redirect về /driver/wallet│
└─────────────────────────────┘
```

### Chi Tiết Từng Bước

#### Bước 1-2: Driver mở modal nạp tiền
- **Driver:** Click "Nạp tiền" trong Wallet page
- **Frontend:** Mở TopUpModal, load top-up packages

#### Bước 3: Driver chọn gói và submit
- **Driver:** Chọn gói nạp tiền (có bonus) hoặc nhập số tiền
- **Frontend:** Gọi `POST /api/driver/wallet/topup`
- **Request body:**
  ```json
  {
    "package_id": "xxx" hoặc "amount": 500000
  }
  ```

#### Bước 4: Backend tạo payment URL
- **Backend:**
  1. Tạo payment record (status = `pending`)
  2. Generate VNPay payment URL với:
     - TMN Code
     - Amount (topup_amount + bonus_amount)
     - Return URL: `/api/payments/vnpay/return`
     - Signature: HMAC SHA512
  3. Trả về `payment_url`

#### Bước 5: Redirect đến VNPay
- **Frontend:** `window.location.href = payment_url`
- **VNPay:** User thanh toán trên VNPay gateway

#### Bước 6: VNPay redirect về
- **VNPay:** Redirect về `/payment/success` hoặc `/payment/error`
- **Backend:** Xử lý return URL:
  1. Verify signature (HMAC SHA512)
  2. Check payment status từ VNPay
  3. Nếu thành công:
     - Update wallet balance (topup_amount + bonus_amount)
     - Create wallet transaction
     - Update payment record (status = `completed`)
  4. Nếu thất bại:
     - Update payment record (status = `failed`)

#### Bước 7: Frontend hiển thị kết quả
- **PaymentSuccess.tsx:**
  - Hiển thị "Nạp tiền thành công"
  - Refresh wallet balance
  - Redirect về `/driver/wallet`

### Business Rules
- ✅ **Top-up packages có bonus:** VD: Nạp 500K nhận 550K
- ✅ **Signature verification:** HMAC SHA512 để đảm bảo an toàn
- ✅ **Return URL handling:** Backend xử lý kết quả từ VNPay
- ✅ **Wallet update:** Cộng tiền vào ví sau khi thanh toán thành công

### Key Points cho Slide
- **VNPay integration:** Sandbox/Production environment
- **Security:** Signature verification (HMAC SHA512)
- **Bonus system:** Top-up packages có bonus để khuyến khích nạp tiền
- **Return URL:** Xử lý kết quả thanh toán tự động

---

## 4. Subscription Flow

### Mô Tả
Flow đăng ký gói dịch vụ → Sử dụng → Hủy gói (proportional refund)

### Actors
- **Driver** (Frontend)
- **System** (Backend)

### Flow Diagram

```
┌─────────────┐
│   Driver    │
└──────┬──────┘
       │
       │ 1. Xem danh sách gói
       ▼
┌─────────────────┐
│ Service Packages│
│ - Gói Basic     │
│ - Gói Premium   │
│ [Đăng ký]      │
└──────┬──────────┘
       │
       │ 2. Click "Đăng ký"
       │    → Check điều kiện
       ▼
┌─────────────────────────────┐
│   Frontend Validation        │
│ ┌─────────────────────────┐ │
│ │ 1. Đã có subscription? │ │
│ │    → Báo lỗi           │ │
│ │ 2. Wallet balance >=    │ │
│ │    package price?       │ │
│ │    → Báo lỗi nếu không │ │
│ └─────────────────────────┘ │
└──────┬──────────────────────┘
       │
       │ 3. Xác nhận đăng ký
       ▼
┌─────────────────────────────┐
│      Backend Processing      │
│ ┌─────────────────────────┐ │
│ │ 1. Check đã có sub?     │ │
│ │ 2. Check wallet balance │ │
│ │ 3. Trừ tiền từ wallet   │ │
│ │ 4. Tạo subscription:    │ │
│ │    - start_date = now   │ │
│ │    - end_date = now +   │ │
│ │      duration_days      │ │
│ │    - remaining_swaps =  │ │
│ │      swap_limit         │ │
│ │    - status = active    │ │
│ └─────────────────────────┘ │
└──────────────┬───────────────┘
               │
               │ 4. Response: Subscription created
               ▼
┌─────────────────────────────┐
│   Driver nhận thông báo     │
│   "Đăng ký thành công"      │
│   - Subscription active      │
│   - Wallet balance updated   │
└──────────────┬───────────────┘
               │
               │ (Sử dụng subscription khi đặt chỗ)
               ▼
┌─────────────────────────────┐
│   Booking với Subscription   │
│ ┌─────────────────────────┐ │
│ │ 1. Check subscription   │ │
│ │    active & compatible  │ │
│ │ 2. Lock subscription    │ │
│ │    (trừ remaining_swaps)│ │
│ │ 3. Miễn phí đổi pin      │ │
│ └─────────────────────────┘ │
└──────────────┬───────────────┘
               │
               │ (Driver muốn hủy gói)
               ▼
┌─────────────────┐
│ Service Packages│
│ [Hủy gói]       │
└──────┬──────────┘
       │
       │ 5. Click "Hủy gói"
       │    → Preview refund
       ▼
┌─────────────────────────────┐
│   Backend: Refund Preview    │
│ ┌─────────────────────────┐ │
│ │ 1. Tính usage_ratio:    │ │
│ │    (end_date - now) /   │ │
│ │    (end_date - start)   │ │
│ │ 2. Tính refund:        │ │
│ │    price * ratio * 0.97 │ │
│ │    (trừ 3% fee)         │ │
│ │ 3. Minimum refund:     │ │
│ │    max(refund, 10K)     │ │
│ └─────────────────────────┘ │
└──────────────┬───────────────┘
               │
               │ 6. Response: Refund preview
               ▼
┌─────────────────────────────┐
│   Dialog: Xác nhận hủy      │
│   - Giá gói: 1,000,000đ     │
│   - Tỷ lệ hoàn: 66.67%      │
│   - Phí hủy (3%): 20,000đ   │
│   - Số tiền hoàn: 646,670đ  │
│   [Xác nhận hủy]            │
└──────┬──────────────────────┘
       │
       │ 7. Confirm cancel
       ▼
┌─────────────────────────────┐
│      Backend Processing      │
│ ┌─────────────────────────┐ │
│ │ 1. Tính refund amount   │ │
│ │ 2. Hoàn tiền vào wallet │ │
│ │ 3. Update subscription  │ │
│ │    (status = cancelled) │ │
│ └─────────────────────────┘ │
└──────────────┬───────────────┘
               │
               │ 8. Response: Subscription cancelled
               ▼
┌─────────────────────────────┐
│   Driver nhận thông báo      │
│   "Hủy gói thành công"        │
│   - Wallet balance updated    │
│   - Subscription cancelled    │
└─────────────────────────────┘
```

### Chi Tiết Từng Bước

#### Bước 1-2: Driver xem và chọn gói
- **Driver:** Xem danh sách gói dịch vụ
- **Frontend:** Load packages từ API, hiển thị: name, price, duration, swap_limit

#### Bước 3: Frontend validation
- **Check điều kiện:**
  - Đã có subscription active? → Báo lỗi
  - Wallet balance >= package price? → Báo lỗi nếu không đủ

#### Bước 4: Backend tạo subscription
- **Backend:**
  1. Validate điều kiện
  2. Trừ tiền từ wallet = package price
  3. Tạo subscription:
     - `start_date` = now
     - `end_date` = start_date + duration_days
     - `remaining_swaps` = swap_limit (null nếu unlimited)
     - `status` = `active`

#### Bước 5-6: Sử dụng subscription khi đặt chỗ
- **Khi đặt chỗ:**
  - Check subscription active và compatible với battery model
  - Lock subscription (trừ remaining_swaps nếu limited)
  - Miễn phí đổi pin (không trừ wallet)

#### Bước 7-8: Hủy gói với proportional refund
- **Backend tính toán:**
  ```
  usage_ratio = (end_date - now) / (end_date - start_date)
  refund_amount = price * usage_ratio * 0.97  // Trừ 3% fee
  refund_amount = max(refund_amount, 10000)   // Minimum 10K
  ```
- **Backend xử lý:**
  1. Tính refund amount
  2. Hoàn tiền vào wallet
  3. Update subscription (status = `cancelled`)

### Business Rules
- ✅ **Proportional refund:** Hoàn tiền theo tỷ lệ thời gian còn lại
- ✅ **Cancellation fee:** 3% phí hủy
- ✅ **Minimum refund:** Tối thiểu 10,000đ
- ✅ **Compatibility:** Subscription chỉ dùng được cho battery models trong package

### Key Points cho Slide
- **Proportional refund:** Công bằng cho cả user và hệ thống
- **Cancellation fee:** Tránh lạm dụng đăng ký/hủy
- **Minimum refund:** Đảm bảo không hoàn số tiền quá nhỏ

---

## 5. Battery Management Flow

### Mô Tả
Flow quản lý pin: Admin tạo pin → Staff quản lý tại trạm → Sử dụng khi đổi pin

### Actors
- **Admin** (Quản lý pin toàn hệ thống)
- **Staff** (Quản lý pin tại trạm)
- **System** (Background jobs)

### Flow Diagram

```
┌─────────────┐
│    Admin    │
└──────┬──────┘
       │
       │ 1. Tạo pin mới
       ▼
┌─────────────────┐
│ Battery Pricing │
│ Management      │
│ [Warehouse Tab] │
│ [+ Thêm pin]    │
└──────┬──────────┘
       │
       │ 2. Nhập thông tin pin
       │    - Battery code
       │    - Model
       │    - Station
       │    - Status: full
       │    - Charge: 100%
       ▼
┌─────────────────────────────┐
│      Backend Processing      │
│ ┌─────────────────────────┐ │
│ │ 1. Create battery       │ │
│ │ 2. Assign to station    │ │
│ │ 3. Status = full        │ │
│ │ 4. Charge = 100%        │ │
│ └─────────────────────────┘ │
└──────────────┬───────────────┘
               │
               ▼
┌─────────────────────────────┐
│   Pin được assign vào trạm   │
│   Status: full (100%)        │
└──────────────┬───────────────┘
               │
               ▼
┌─────────────┐
│    Staff    │
└──────┬──────┘
       │
       │ 3. Xem kho pin tại trạm
       ▼
┌─────────────────┐
│ Battery Inventory│
│ - Pin full       │
│ - Pin charging   │
│ - Pin in_use     │
└──────┬──────────┘
       │
       │ 4. Cập nhật status pin
       │    (full → charging)
       ▼
┌─────────────────────────────┐
│   Pin được sử dụng khi đổi   │
│ ┌─────────────────────────┐ │
│ │ 1. Booking reserve pin  │ │
│ │    (status = reserved)  │ │
│ │ 2. Staff complete       │ │
│ │    - Old: charging      │ │
│ │    - New: in_use        │ │
│ └─────────────────────────┘ │
└──────────────┬───────────────┘
               │
               │ (Pin cũ được sạc)
               ▼
┌─────────────────────────────┐
│   Background Process         │
│   (Hoặc Staff cập nhật)      │
│ ┌─────────────────────────┐ │
│ │ Pin charging → full    │ │
│ │ (charge = 100%)         │ │
│ │ Status: full            │ │
│ │ Sẵn sàng đổi tiếp      │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Chi Tiết Từng Bước

#### Bước 1-2: Admin tạo pin
- **Admin:** Quản lý pin → Warehouse tab → Thêm pin mới
- **Input:**
  - Battery code (unique)
  - Model (Tesla, BYD, etc.)
  - Station (assign vào trạm)
  - Status: `full`
  - Charge: 100%
- **Backend:** Tạo battery record

#### Bước 3: Staff quản lý pin tại trạm
- **Staff:** Xem kho pin → Filter theo status, model
- **Actions:**
  - Thêm pin mới (nếu nhận từ Admin)
  - Cập nhật status (full → charging → full)
  - Cập nhật charge percentage
  - Xóa pin (nếu damaged)

#### Bước 4: Pin được sử dụng
- **Khi đặt chỗ:**
  - Pin được reserve (status = `reserved`)
- **Khi hoàn thành đổi pin:**
  - Old battery: `in_use` → `charging` (nếu good) hoặc `damaged`/`maintenance`
  - New battery: `full` → `in_use`

#### Bước 5: Pin được sạc
- **Staff hoặc Background process:**
  - Cập nhật charge percentage
  - Khi charge = 100% → Status = `full`
  - Pin sẵn sàng đổi tiếp

### Business Rules
- ✅ **Battery status flow:** full → reserved → in_use → charging → full
- ✅ **Capacity warning:** Cảnh báo nếu capacity >= 90%, từ chối nếu >= 100%
- ✅ **Compatibility:** Pin chỉ dùng được cho vehicle có cùng battery model
- ✅ **Reserved:** Pin đã được giữ cho booking không thể assign cho booking khác

### Key Points cho Slide
- **Lifecycle:** Pin có lifecycle rõ ràng (full → reserved → in_use → charging → full)
- **Status management:** Quản lý trạng thái pin chặt chẽ
- **Compatibility:** Đảm bảo pin tương thích với vehicle

---

## 6. Auto-Cancel & Reminder Flow (Background Jobs)

### Mô Tả
Flow tự động hủy booking quá hạn và gửi reminder

### Actors
- **System** (Cron Jobs)
- **Driver** (Nhận notification)

### Flow Diagram

```
┌─────────────────────────────┐
│      Cron Job (Mỗi 5 phút)    │
│  ┌─────────────────────────┐ │
│  │ 1. Auto-Cancel Expired   │ │
│  │ 2. Send Reminders        │ │
│  └─────────────────────────┘ │
└──────────────┬────────────────┘
               │
               ├─► Flow 1: Auto-Cancel
               │
               │   Tìm bookings:
               │   - status = confirmed
               │   - scheduled_at < (now - 10 phút)
               │   - checked_in_at = null
               │
               │   ┌─────────────────────────┐
               │   │ Backend Processing       │
               │   │ 1. Release battery lock   │
               │   │ 2. Release wallet lock    │
               │   │ 3. Hoàn tiền vào ví       │
               │   │ 4. Update booking        │
               │   │    (status = cancelled)   │
               │   │ 5. Send notification     │
               │   └─────────────────────────┘
               │
               └─► Flow 2: Send Reminders
                   │
                   ├─► Reminder 30 phút trước
                   │   Tìm bookings:
                   │   - status = pending/confirmed
                   │   - scheduled_at trong 30 phút
                   │
                   │   ┌─────────────────────────┐
                   │   │ Send notification:      │
                   │   │ "Bạn có đặt chỗ sau     │
                   │   │  30 phút nữa"           │
                   │   └─────────────────────────┘
                   │
                   └─► Reminder 10 phút trước
                       Tìm bookings:
                       - status = pending/confirmed
                       - scheduled_at trong 10 phút
                       │
                       ┌─────────────────────────┐
                       │ Send notification:      │
                       │ "Bạn có đặt chỗ sau     │
                       │  10 phút nữa. Vui lòng  │
                       │  đến đúng giờ"          │
                       └─────────────────────────┘
                           │
                           ▼
┌─────────────────────────────┐
│   Driver nhận notification   │
│   (Socket.IO real-time)      │
│   - Toast notification        │
│   - Notification bell badge   │
└─────────────────────────────┘
```

### Chi Tiết Từng Flow

#### Flow 1: Auto-Cancel Expired Bookings
- **Cron job:** Chạy mỗi 5 phút
- **Tìm bookings:**
  - Status = `confirmed`
  - `scheduled_at` < (now - 10 phút)
  - `checked_in_at` = null (chưa đến trạm)
- **Xử lý:**
  1. Release battery lock (status = `reserved` → `full`)
  2. Release wallet lock (hoàn tiền vào ví)
  3. Release subscription lock (nếu có)
  4. Update booking (status = `cancelled`)
  5. Gửi notification cho Driver

#### Flow 2: Send Booking Reminders
- **Cron job:** Chạy mỗi 5 phút
- **Reminder 30 phút:**
  - Tìm bookings: `scheduled_at` trong khoảng 25-35 phút nữa
  - Gửi notification: "Bạn có đặt chỗ sau 30 phút nữa"
- **Reminder 10 phút:**
  - Tìm bookings: `scheduled_at` trong khoảng 8-12 phút nữa
  - Gửi notification: "Bạn có đặt chỗ sau 10 phút nữa. Vui lòng đến đúng giờ"

### Business Rules
- ✅ **Auto-cancel:** Sau 10 phút không đến → Tự động hủy
- ✅ **Reminder:** 30 phút & 10 phút trước giờ hẹn
- ✅ **Hoàn tiền:** Auto-cancel hoàn tiền đầy đủ (không trừ phí)

### Key Points cho Slide
- **Background automation:** Hệ thống tự động xử lý
- **Real-time notification:** Socket.IO cho instant updates
- **User experience:** Reminder giúp user không quên

---

## 📊 Tổng Hợp Core Flows

### Flow 1: User Journey (End-to-End)
```
Đăng ký → Nạp tiền → Tìm trạm → Đặt lịch → Nhận reminder → 
Đến trạm → Staff xác nhận → Staff hoàn thành → Đánh giá
```

### Flow 2: Payment Journey
```
Nạp tiền (VNPay) → Wallet balance tăng → 
Đặt chỗ (Lock wallet) → Hoàn thành (Trừ tiền)
```

### Flow 3: Subscription Journey
```
Đăng ký gói → Trừ tiền → Sử dụng (Miễn phí) → 
Hủy gói → Proportional refund
```

### Flow 4: Battery Lifecycle
```
Admin tạo pin → Assign trạm → Staff quản lý → 
Reserve cho booking → Đổi pin → Sạc → Sẵn sàng tiếp
```

---

## 🎯 Key Points Cho Slide Thuyết Trình

### 1. Authentication Flow
- ✅ Tự động tạo Wallet khi đăng ký
- ✅ JWT với refresh token mechanism
- ✅ Role-based routing (Driver/Staff/Admin)

### 2. Booking Flow
- ✅ **Driver-Staff collaboration:** Real-time workflow
- ✅ **Lock mechanism:** Đảm bảo có đủ tiền/pin
- ✅ **Auto-fill:** Giảm lỗi nhập liệu
- ✅ **Real-time notification:** Socket.IO

### 3. Payment Flow
- ✅ **VNPay integration:** Sandbox/Production
- ✅ **Security:** Signature verification
- ✅ **Bonus system:** Khuyến khích nạp tiền

### 4. Subscription Flow
- ✅ **Proportional refund:** Công bằng
- ✅ **Cancellation fee:** Tránh lạm dụng
- ✅ **Compatibility:** Chỉ dùng được cho battery models tương thích

### 5. Battery Management Flow
- ✅ **Lifecycle management:** Full → Reserved → In_use → Charging → Full
- ✅ **Status tracking:** Quản lý chặt chẽ trạng thái pin

### 6. Background Jobs
- ✅ **Auto-cancel:** Tự động hủy booking quá hạn
- ✅ **Reminders:** Nhắc nhở user đúng giờ
- ✅ **Automation:** Giảm công việc thủ công

---

## 📝 Gợi Ý Cho Slide Thuyết Trình

### 🎯 Chiến Lược: Kết Hợp 3 Yếu Tố

**✅ Nên làm:**
1. **Flow Diagram (Text/Shape)** - Hiển thị logic flow
2. **Screenshot Key Pages** - Minh họa UI quan trọng
3. **Demo Live** - Chứng minh hoạt động thực tế

**❌ Không nên:**
- Chỉ có text → Khó hình dung
- Chỉ có screenshot → Không thấy flow logic
- Chỉ demo → Không có context

---

### 📐 Cấu Trúc Slide Đề Xuất

#### **Slide 1: Overview**
- **Tiêu đề:** "Core Flows - EV Battery Swap System"
- **Nội dung:** 
  - 6 core flows chính (list)
  - 3 actors: Driver, Staff, Admin
  - Real-time notification với Socket.IO
- **Không cần screenshot** (chỉ overview)

---

#### **Slide 2-7: Từng Flow Chi Tiết**

**Cấu trúc mỗi slide (Ví dụ: Booking Flow):**

```
┌─────────────────────────────────────────┐
│  [Flow Diagram - Bên trái 50%]          │
│  ┌─────────────┐                         │
│  │   Driver    │                         │
│  └──────┬──────┘                         │
│         │                                │
│         ▼                                │
│  ┌─────────────┐                         │
│  │ BookBattery │                         │
│  └─────────────┘                         │
│                                          │
│  [Screenshot - Bên phải 50%]            │
│  ┌──────────────────────┐               │
│  │ [Ảnh BookBatteryPage]│               │
│  │                      │               │
│  │  - Chọn vehicle      │               │
│  │  - Chọn thời gian    │               │
│  │  - [Đặt chỗ]         │               │
│  └──────────────────────┘               │
└─────────────────────────────────────────┘
```

**Hoặc layout dọc:**
```
┌─────────────────────────────────────────┐
│  [Flow Diagram - Phần trên 40%]         │
│  (Text diagram như trong file này)      │
│                                          │
│  [Screenshot - Phần dưới 60%]           │
│  [Ảnh trang quan trọng nhất]            │
└─────────────────────────────────────────┘
```

---

### 📸 Danh Sách Screenshot Cần Chụp

#### **Flow 1: Authentication Flow**
- ✅ **Landing Page** (`/` - LandingPage component)
- ✅ **AuthModal - Tab Đăng ký** (AuthModal.tsx - register tab)
- ✅ **AuthModal - Tab Đăng nhập** (AuthModal.tsx - login tab)
- ✅ **Driver Dashboard sau đăng nhập** (DriverDashboard.tsx)

**Gợi ý:** Chụp 2-3 ảnh key (Landing Page + AuthModal), demo live phần còn lại

---

#### **Flow 2: Booking Flow** ⭐ (Quan trọng nhất)
- ✅ **Station Finding** (`StationFinding.tsx` - Map với markers)
- ✅ **Station Detail** (`StationDetail.tsx` - Pricing, pin available)
- ✅ **Book Battery Page** (`BookBatteryPage.tsx` - Form đặt chỗ)
- ✅ **Booking History - Pending** (`BookingHistory.tsx` - Status pending)
- ✅ **Swap Transactions (Staff)** (`SwapTransactions.tsx` - Danh sách booking)
- ✅ **Booking History - Completed** (`BookingHistory.tsx` - Status completed)

**Gợi ý:** 
- Chụp 4-5 ảnh key (Station Finding, Book Battery, Booking History)
- Demo live phần Staff xác nhận và hoàn thành

---

#### **Flow 3: Payment Flow**
- ✅ **Wallet Page** (`Wallet.tsx` - Hiển thị balance)
- ✅ **TopUp Modal** (`TopUpModal.tsx` - Chọn gói nạp tiền)
- ✅ **VNPay Gateway** (Screenshot VNPay sandbox - nếu có)
- ✅ **Payment Success** (`PaymentSuccess.tsx` - Thông báo thành công)
- ✅ **Wallet sau nạp tiền** (`Wallet.tsx` - Balance đã tăng)

**Gợi ý:** 
- Chụp 3-4 ảnh key (Wallet, TopUp Modal, Payment Success)
- Demo live phần VNPay (hoặc chỉ nói về integration)

---

#### **Flow 4: Subscription Flow**
- ✅ **Service Packages** (`ServicePackages.tsx` - Danh sách gói)
- ✅ **Subscription Active** (`ServicePackages.tsx` - Gói đang dùng)
- ✅ **Cancel Subscription Dialog** (`ServicePackages.tsx` - Preview refund)

**Gợi ý:** 
- Chụp 2-3 ảnh key
- Demo live phần đăng ký và hủy gói

---

#### **Flow 5: Battery Management Flow**
- ✅ **Battery Pricing Management (Admin)** (`BatteryPricingManagement.tsx` - Warehouse tab)
- ✅ **Battery Inventory (Staff)** (`BatteryInventory.tsx` - Danh sách pin tại trạm)

**Gợi ý:** 
- Chụp 2 ảnh (Admin tạo pin, Staff quản lý)
- Demo live phần cập nhật status

---

#### **Flow 6: Auto-Cancel & Reminder Flow**
- ✅ **Notification Bell** (Component hiển thị notification)
- ✅ **Booking History với notification** (Toast notification hoặc badge)

**Gợi ý:** 
- Chụp 1-2 ảnh (Notification UI)
- Demo live phần nhận notification (Socket.IO)

---

### 🎬 Chiến Lược Demo Song Song

#### **Cách 1: Flow Diagram + Screenshot + Demo (Khuyến nghị)**
```
Slide: Flow Diagram + Screenshot
     ↓
Thuyết trình: "Đây là flow logic và UI"
     ↓
Chuyển sang app: "Bây giờ tôi sẽ demo live"
     ↓
Demo: Thực hiện flow trên app thật
     ↓
Quay lại slide: Tóm tắt key points
```

**Ưu điểm:**
- ✅ Slide có context (diagram + screenshot)
- ✅ Demo chứng minh hoạt động thực tế
- ✅ Người xem hiểu cả logic và UI

---

#### **Cách 2: Chỉ Flow Diagram + Demo (Nếu thiếu thời gian)**
```
Slide: Flow Diagram (text)
     ↓
Thuyết trình: "Đây là flow logic"
     ↓
Demo: Thực hiện flow trên app
     ↓
Giải thích: "Như các bạn thấy, flow hoạt động như sau..."
```

**Ưu điểm:**
- ✅ Nhanh, tập trung vào demo
- ✅ Không cần chuẩn bị nhiều screenshot

**Nhược điểm:**
- ❌ Slide có thể khó hiểu nếu không demo ngay

---

### 📋 Checklist Chuẩn Bị Slide

#### **Trước khi làm slide:**
- [ ] Chụp screenshot các trang quan trọng (theo danh sách trên)
- [ ] Chỉnh sửa screenshot (crop, highlight phần quan trọng)
- [ ] Vẽ flow diagram (dùng PowerPoint/FigJam/Lucidchart)
- [ ] Chuẩn bị demo data (tài khoản test, booking test)

#### **Khi làm slide:**
- [ ] Mỗi flow có 1-2 slide:
  - Slide 1: Flow diagram + Screenshot key page
  - Slide 2 (nếu cần): Screenshot các bước chi tiết
- [ ] Layout rõ ràng: Diagram bên trái, Screenshot bên phải (hoặc trên/dưới)
- [ ] Highlight các điểm quan trọng trong screenshot (mũi tên, box)

#### **Khi thuyết trình:**
- [ ] Giải thích flow diagram trước
- [ ] Chỉ vào screenshot: "Đây là UI tại bước X"
- [ ] Chuyển sang demo: "Bây giờ tôi sẽ demo live"
- [ ] Quay lại slide: Tóm tắt key points

---

### 🎯 Gợi Ý Cụ Thể Cho Từng Flow

#### **Flow 1: Authentication**
- **Slide:** Flow diagram + Screenshot Landing Page + AuthModal
- **Demo:** Đăng ký tài khoản mới → Kiểm tra Wallet tự động tạo

#### **Flow 2: Booking** ⭐ (Quan trọng nhất)
- **Slide:** Flow diagram + Screenshot BookBatteryPage + BookingHistory
- **Demo:** 
  - Đặt lịch → Xem notification
  - (Chuyển sang Staff) Xác nhận → Hoàn thành
  - (Quay lại Driver) Xem kết quả

#### **Flow 3: Payment**
- **Slide:** Flow diagram + Screenshot Wallet + TopUpModal
- **Demo:** Nạp tiền → Xem balance tăng (hoặc chỉ nói về VNPay integration)

#### **Flow 4: Subscription**
- **Slide:** Flow diagram + Screenshot ServicePackages
- **Demo:** Đăng ký gói → Hủy gói → Xem proportional refund

#### **Flow 5: Battery Management**
- **Slide:** Flow diagram + Screenshot Battery Inventory
- **Demo:** (Nếu có thời gian) Cập nhật status pin

#### **Flow 6: Auto-Cancel & Reminder**
- **Slide:** Flow diagram + Screenshot Notification
- **Demo:** (Nếu có thời gian) Đợi reminder hoặc auto-cancel

---

### 💡 Tips Quan Trọng

1. **Đừng chụp quá nhiều screenshot:**
   - Chỉ chụp các trang **quan trọng nhất** (3-5 ảnh/flow)
   - Các bước khác demo live

2. **Highlight trong screenshot:**
   - Dùng mũi tên, box, circle để highlight phần quan trọng
   - VD: "Đây là nút [Đặt chỗ]" → Circle quanh nút

3. **Kết hợp text và ảnh:**
   - Flow diagram (text) để hiểu logic
   - Screenshot để hình dung UI
   - Demo để chứng minh hoạt động

4. **Chuẩn bị backup:**
   - Nếu demo bị lỗi → Dùng screenshot để giải thích
   - Nếu screenshot không rõ → Demo live

5. **Timing:**
   - Mỗi flow: 3-5 phút (1-2 phút slide + 2-3 phút demo)
   - Tổng 6 flows: ~20-30 phút

---

### 📊 Template Slide Mẫu

```
┌─────────────────────────────────────────────────────┐
│  [Tiêu đề Flow]                                     │
│                                                      │
│  ┌──────────────────┐  ┌─────────────────────────┐ │
│  │                  │  │                         │ │
│  │  Flow Diagram    │  │   Screenshot Key Page   │ │
│  │  (Text/Shape)    │  │                         │ │
│  │                  │  │   [Ảnh trang]           │ │
│  │  Driver →        │  │                         │ │
│  │  BookBattery →   │  │   Highlight:            │ │
│  │  Staff Confirm   │  │   - Nút [Đặt chỗ]       │ │
│  │                  │  │   - Form fields        │ │
│  └──────────────────┘  └─────────────────────────┘ │
│                                                      │
│  Key Points:                                         │
│  • Lock wallet khi đặt chỗ                          │
│  • Real-time notification                            │
│  • Staff verify bằng phone                           │
└─────────────────────────────────────────────────────┘
```

---

**File chi tiết:** Xem `DEMO_GUIDE.md` và `PROJECT_DOCUMENTATION.md` để biết thêm!

