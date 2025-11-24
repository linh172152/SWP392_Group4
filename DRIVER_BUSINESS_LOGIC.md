# Tài liệu Logic Nghiệp vụ Driver - Từ Backend

## Tổng quan

Tài liệu này mô tả logic nghiệp vụ cho role Driver dựa trên các routes, controllers và services của Backend.

---

## 1. QUẢN LÝ XE (Vehicles)

### API Endpoints
- `GET /api/driver/vehicles` - Lấy danh sách xe của driver
- `POST /api/driver/vehicles` - Thêm xe mới
- `GET /api/driver/vehicles/:id` - Chi tiết xe
- `PUT /api/driver/vehicles/:id` - Cập nhật xe
- `DELETE /api/driver/vehicles/:id` - Xóa xe

### Logic nghiệp vụ

#### Thêm xe mới
- **Bắt buộc**: `license_plate`, `vehicle_type`, `battery_model`
- **Tùy chọn**: `make/brand`, `model`, `year`
- **Đặc biệt**: Khi thêm xe, hệ thống tự động tạo pin mới với `battery_code` được cung cấp
- **Validation**: 
  - License plate phải unique
  - Vehicle type: `MOTORBIKE`, `CAR`, `TRUCK` (BE normalize: TRUCK → CAR)
  - Battery code phải chưa tồn tại trong hệ thống
  - Pin mới được tạo với status `in_use` tại trạm active đầu tiên

#### Cập nhật xe
- Không thể thay đổi `current_battery_code` trực tiếp (phải qua staff)
- Không thể xóa xe nếu có booking đang active (pending/confirmed)

#### Xóa xe
- Chỉ xóa được nếu không có booking active

---

## 2. QUẢN LÝ TRẠM (Stations)

### API Endpoints
- `GET /api/driver/stations/nearby` - Tìm trạm gần (lat, lng, radius)
- `GET /api/driver/stations/search` - Tìm kiếm trạm (query, lat, lng, radius)
- `GET /api/driver/stations/:id` - Chi tiết trạm
- `GET /api/driver/stations/:id/batteries` - Danh sách pin tại trạm

### Logic nghiệp vụ

#### Tìm trạm gần
- **Query params**: `lat`, `lng`, `radius` (km, default: 10)
- **Response**: 
  - Danh sách trạm active
  - Số pin available (status = full)
  - Average rating
  - Distance (km) - tính bằng Haversine formula
  - Capacity percentage và warning
  - Battery inventory theo model

#### Chi tiết trạm
- Thông tin đầy đủ: name, address, coordinates, operating hours
- Danh sách pin với status
- Average rating và total ratings
- Battery inventory và capacity stats

---

## 3. QUẢN LÝ ĐẶT CHỖ (Bookings)

### API Endpoints
- `GET /api/driver/bookings` - Danh sách bookings (filter: status, pagination)
- `POST /api/driver/bookings` - Tạo booking (đặt lịch)
- `POST /api/driver/bookings/instant` - Tạo instant booking (đổi pin ngay)
- `GET /api/driver/bookings/:id` - Chi tiết booking
- `PUT /api/driver/bookings/:id` - Cập nhật booking (chỉ scheduled_at, notes)
- `PUT /api/driver/bookings/:id/cancel` - Hủy booking

### Logic nghiệp vụ

#### Tạo Booking (Đặt lịch)
- **Bắt buộc**: `vehicle_id`, `station_id`, `battery_model`, `scheduled_at`
- **Tùy chọn**: `notes`, `use_subscription` (default: true)
- **Validation**:
  - Scheduled time phải trong tương lai
  - Tối thiểu 30 phút từ bây giờ
  - Tối đa 12 giờ từ bây giờ
  - Battery model phải tương thích với vehicle
  - Station phải active

- **Hold Logic**:
  - Hệ thống tự động reserve pin phù hợp tại trạm
  - Ưu tiên pin status = `full`, fallback = `charging` (nếu scheduled >= 1h)
  - Pin được chuyển sang status `reserved`
  - Hold expires sau `scheduled_at + 15 phút`

- **Payment/Subscription Logic**:
  - Nếu `use_subscription = true` và có subscription active:
    - Kiểm tra subscription có cover battery model không
    - Nếu có và còn lượt → dùng subscription (không trừ tiền ví)
    - Nếu không hoặc hết lượt → trừ tiền ví
  - Nếu `use_subscription = false` hoặc không có subscription:
    - Trừ tiền ví ngay (lock amount)
    - Tạo payment record với status `reserved`

- **Response**:
  - Booking object
  - `pricing_preview`: Thông tin giá dự kiến
  - `hold_summary`: 
    - `battery_code`: Mã pin đã giữ
    - `use_subscription`: Có dùng subscription không
    - `subscription_unlimited`: Subscription unlimited không
    - `subscription_remaining_after`: Số lượt còn lại sau booking
    - `subscription_name`: Tên gói
    - `wallet_amount_locked`: Số tiền đã trừ (nếu không dùng subscription)
    - `wallet_balance_after`: Số dư ví sau khi trừ
    - `hold_expires_at`: Thời gian hết hạn hold

#### Tạo Instant Booking (Đổi pin ngay)
- **Bắt buộc**: `vehicle_id`, `station_id`, `battery_model`
- **Tùy chọn**: `notes`
- **Logic**:
  - Scheduled time = now + 15 phút
  - Chỉ reserve pin status = `full` (không fallback charging)
  - Kiểm tra số pin available ngay (trừ đi instant bookings khác trong 15 phút tới)
  - Không lock tiền/subscription (thanh toán sau khi hoàn thành)
  - Flag `is_instant = true`

#### Hủy Booking
- **Chính sách hủy**:
  - Hủy trong vòng 15 phút trước giờ hẹn → **KHÔNG CHO HỦY** (hoặc phạt phí - hiện tại không cho hủy)
  - Hủy trước đó → Hoàn tiền/subscription về
- **Release Logic**:
  - Release pin về trạng thái cũ
  - Hoàn tiền ví (nếu đã lock)
  - Hoàn lượt subscription (nếu đã trừ)
  - Cập nhật booking status = `cancelled`

#### Cập nhật Booking
- Chỉ cho phép cập nhật khi status = `pending`
- Chỉ có thể cập nhật: `scheduled_at`, `notes`

---

## 4. QUẢN LÝ VÍ (Wallet)

### API Endpoints
- `GET /api/driver/wallet/balance` - Số dư ví
- `GET /api/driver/wallet/transactions` - Lịch sử giao dịch ví (pagination)
- `POST /api/driver/wallet/topup` - Nạp tiền (VNPay)

### Logic nghiệp vụ

#### Số dư ví
- Tự động tạo wallet nếu chưa có (balance = 0)

#### Nạp tiền
- **Bắt buộc**: `package_id` (topup package)
- **Tùy chọn**: `payment_method` (default: vnpay)
- **Logic**:
  - Lấy thông tin topup package
  - Tạo VNPay payment URL
  - Redirect user đến VNPay
  - Sau khi thanh toán thành công → cập nhật wallet balance

#### Lịch sử giao dịch
- Hiển thị tất cả payments liên quan đến wallet
- Bao gồm: topup, booking payments, subscription payments, refunds

---

## 5. QUẢN LÝ GIAO DỊCH (Transactions)

### API Endpoints
- `GET /api/driver/transactions` - Danh sách transactions (filter: type, status, pagination)
- `GET /api/driver/transactions/pending` - Transactions cần thanh toán
- `GET /api/driver/transactions/stats` - Thống kê transactions
- `GET /api/driver/transactions/:id` - Chi tiết transaction
- `POST /api/driver/transactions/:id/pay` - Thanh toán transaction
- `POST /api/driver/transactions/refund` - Yêu cầu hoàn tiền

### Logic nghiệp vụ

#### Transaction Types
- `PAYMENT`: Thanh toán đổi pin
- `REFUND`: Hoàn tiền
- `REWARD`: Thưởng

#### Transaction Status
- `PENDING`: Chờ thanh toán
- `COMPLETED`: Đã hoàn thành
- `FAILED`: Thất bại
- `CANCELLED`: Đã hủy

#### Thanh toán Transaction
- Chỉ transaction status = `pending` và amount > 0
- Payment method: `vnpay`, `cash`, `momo`
- Nếu VNPay → redirect đến payment gateway

#### Yêu cầu hoàn tiền
- Chỉ transaction status = `completed`
- Tạo support ticket với category = `payment_issue`
- Admin sẽ xử lý và hoàn tiền

---

## 6. QUẢN LÝ GÓI ĐĂNG KÝ (Subscriptions)

### API Endpoints
- `GET /api/driver/subscriptions` - Danh sách subscriptions của driver
- `POST /api/driver/subscriptions/packages/:packageId/subscribe` - Đăng ký gói
- `POST /api/driver/subscriptions/:subscriptionId/cancel` - Hủy subscription

### Logic nghiệp vụ

#### Đăng ký gói
- **Bắt buộc**: `packageId`
- **Tùy chọn**: `autoRenew` (default: false)
- **Validation**:
  - Package phải active
  - Không được có subscription active cùng package
  - Wallet balance phải đủ
- **Logic**:
  - Trừ tiền từ wallet
  - Tạo subscription với:
    - `start_date` = now
    - `end_date` = now + `package.duration_days`
    - `remaining_swaps` = `package.swap_limit` (null = unlimited)
  - Tạo payment record

#### Hủy subscription
- **Điều kiện**:
  - Subscription phải active
  - Chưa sử dụng (remaining_swaps = package.swap_limit hoặc chưa có booking nào dùng)
  - Không có booking đang lock subscription này
- **Logic**:
  - Hoàn tiền về wallet
  - Cập nhật subscription status = `cancelled`
  - Tạo refund payment record

---

## 7. QUẢN LÝ THÔNG BÁO (Notifications)

### API Endpoints
- `GET /api/driver/notifications` - Danh sách notifications (filter: is_read, pagination)
- `PUT /api/driver/notifications/:id/read` - Đánh dấu đã đọc
- `PUT /api/driver/notifications/read-all` - Đánh dấu tất cả đã đọc

### Logic nghiệp vụ
- Notifications được tạo tự động khi:
  - Booking được tạo/confirmed/cancelled
  - Payment thành công/thất bại
  - Transaction completed
- Unread count được trả về trong response

---

## 8. GÓI NẠP TIỀN (Top-up Packages)

### API Endpoints
- `GET /api/driver/topup-packages` - Danh sách gói nạp (filter: is_active, pagination)

### Logic nghiệp vụ
- Chỉ hiển thị gói active
- Mỗi gói có:
  - `topup_amount`: Số tiền nạp
  - `bonus_amount`: Số tiền thưởng
  - `actual_amount`: Tổng = topup_amount + bonus_amount

---

## Lưu ý quan trọng cho Frontend

1. **Booking Hold System**:
   - Luôn hiển thị `hold_summary` khi booking được tạo
   - Hiển thị `hold_expires_at` và cảnh báo nếu sắp hết hạn
   - Pin được giữ tự động, không cần driver chọn pin cụ thể

2. **Subscription Priority**:
   - Mặc định `use_subscription = true`
   - Cho phép driver chọn không dùng subscription (để trừ tiền ví ngay)
   - Hiển thị rõ ràng khi nào dùng subscription, khi nào trừ tiền ví

3. **Instant Booking**:
   - Khác với booking thường: không lock tiền/subscription
   - Chỉ reserve pin trong 15 phút
   - Thanh toán sau khi hoàn thành

4. **Payment Flow**:
   - Topup: VNPay → redirect → callback
   - Transaction payment: Có thể VNPay hoặc cash (tại trạm)

5. **Error Handling**:
   - Luôn hiển thị message từ BE (tiếng Việt)
   - Xử lý các trường hợp: không đủ tiền, không có pin, booking conflict

6. **Real-time Updates**:
   - Nên có polling hoặc websocket cho:
     - Booking status changes
     - Wallet balance updates
     - Notification updates

