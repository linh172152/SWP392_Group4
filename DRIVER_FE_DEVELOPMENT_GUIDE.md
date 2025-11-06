# Hướng Dẫn Phát Triển FE Driver - Logic & Nghiệp Vụ

## 📋 Tổng Quan

Tài liệu này tổng hợp logic và nghiệp vụ từ BE để hỗ trợ phát triển FE Driver.

---

## 🔌 API Endpoints Cho Driver

### Base URL
```
/api/driver
```

### Authentication
- Tất cả endpoints đều yêu cầu: `Authorization: Bearer <token>`
- Role required: `DRIVER`

---

## 📦 1. QUẢN LÝ XE (Vehicles)

### Endpoints
- `GET /api/driver/vehicles` - Lấy danh sách xe
- `POST /api/driver/vehicles` - Thêm xe mới
- `GET /api/driver/vehicles/:id` - Chi tiết xe
- `PUT /api/driver/vehicles/:id` - Cập nhật xe
- `DELETE /api/driver/vehicles/:id` - Xóa xe

### Data Model
```typescript
interface Vehicle {
  vehicle_id: string;
  user_id: string;
  license_plate: string; // Unique
  vehicle_type: "car" | "motorbike"; // BE chỉ chấp nhận lowercase
  make?: string; // Brand/Manufacturer
  model?: string;
  year?: number;
  battery_model: string; // REQUIRED - Model pin phù hợp với xe
  created_at: string;
  updated_at: string;
}
```

### Business Rules
1. **License Plate**: Phải unique trong hệ thống
2. **Vehicle Type**: 
   - BE chỉ chấp nhận: `"car"` hoặc `"motorbike"` (lowercase)
   - FE có thể gửi `"CAR"`, `"MOTORBIKE"`, `"TRUCK"` → BE sẽ normalize
   - `"TRUCK"` sẽ được convert thành `"car"`
3. **Battery Model**: Bắt buộc, phải khớp với model pin khi đặt chỗ
4. **Delete**: Không thể xóa xe nếu có booking đang pending/confirmed

### Validation (BE)
- `license_plate`, `vehicle_type`, `battery_model` là required
- Nếu license_plate đã tồn tại → Error 400

---

## 🗓️ 2. QUẢN LÝ ĐẶT CHỖ (Bookings)

### Endpoints
- `GET /api/driver/bookings?status=&page=&limit=` - Danh sách bookings
- `POST /api/driver/bookings` - Tạo booking (đặt lịch)
- `POST /api/driver/bookings/instant` - Tạo instant booking (đổi pin ngay)
- `GET /api/driver/bookings/:id` - Chi tiết booking
- `PUT /api/driver/bookings/:id` - Cập nhật booking
- `PUT /api/driver/bookings/:id/cancel` - Hủy booking

### Data Model
```typescript
interface Booking {
  booking_id: string;
  booking_code: string; // Format: "BK" + timestamp + random
  user_id: string;
  vehicle_id: string;
  station_id: string;
  battery_model: string;
  scheduled_at: string; // ISO 8601 format
  status: "pending" | "confirmed" | "completed" | "cancelled";
  is_instant?: boolean; // true = đổi pin ngay
  notes?: string;
  pin_code?: string; // 6 ký tự, được staff tạo khi check-in
  pin_verified_at?: string;
  checked_in_at?: string;
  checked_in_by_staff_id?: string;
  created_at: string;
  
  // Relations
  station?: {
    station_id: string;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    operating_hours?: string;
  };
  vehicle?: {
    vehicle_id: string;
    license_plate: string;
    vehicle_type: string;
    make?: string;
    model: string;
    year?: number;
  };
  transaction?: {
    transaction_id: string;
    transaction_code: string;
    payment_status: "pending" | "completed" | "failed";
    amount: number;
    swap_at?: string;
    swap_started_at?: string;
    swap_completed_at?: string;
    swap_duration_minutes?: number;
  };
  checked_in_by_staff?: {
    user_id: string;
    full_name: string;
    email: string;
  };
}
```

### Loại Booking

#### 2.1. Normal Booking (Đặt Lịch)
- **Endpoint**: `POST /api/driver/bookings`
- **Body**:
  ```json
  {
    "vehicle_id": "uuid",
    "station_id": "uuid",
    "battery_model": "string",
    "scheduled_at": "2024-01-15T14:00:00Z", // ISO 8601
    "notes": "optional"
  }
  ```

**Validation Rules:**
1. `scheduled_at` phải:
   - ✅ Trong tương lai
   - ✅ Tối thiểu 30 phút từ bây giờ
   - ✅ Tối đa 12 giờ từ bây giờ
2. `battery_model` phải khớp với `vehicle.battery_model` (case-insensitive)
3. Trạm phải có pin sẵn sàng tại thời điểm `scheduled_at`:
   - Pin `status = "full"` (sẵn sàng ngay)
   - Pin `status = "charging"` (nếu `scheduled_at` >= 1 giờ sau)
   - Trừ đi số pin đã được đặt bởi booking khác trong khoảng ±30 phút

**Booking Code**: `BK` + 10 số cuối timestamp + 2 ký tự random

#### 2.2. Instant Booking (Đổi Pin Ngay)
- **Endpoint**: `POST /api/driver/bookings/instant`
- **Body**:
  ```json
  {
    "vehicle_id": "uuid",
    "station_id": "uuid",
    "battery_model": "string",
    "notes": "optional"
  }
  ```

**Validation Rules:**
1. `scheduled_at` tự động = `now + 15 phút` (reservation window)
2. Chỉ chấp nhận pin `status = "full"` (sẵn sàng ngay)
3. Trừ đi số pin đã được đặt bởi instant booking khác trong 15 phút tới
4. `is_instant = true`

**Booking Code**: `INST` + 10 số cuối timestamp + 2 ký tự random

**Thông báo**: "Pin đã được tạm giữ. Vui lòng đến trạm trong vòng 15 phút."

### Hủy Booking

**Endpoint**: `PUT /api/driver/bookings/:id/cancel`

**Business Rules:**
1. Chỉ có thể hủy booking có status: `"pending"` hoặc `"confirmed"`
2. **Không thể hủy** nếu còn < 15 phút trước giờ hẹn (`scheduled_at`)
3. Nếu hủy muộn (trong 15 phút cuối):
   - Option 1: Không cho hủy → Error: "Cannot cancel booking within 15 minutes..."
   - Option 2: Phạt phí hủy muộn (hiện tại chưa implement)

**Response khi hủy thành công:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "booking": {...},
    "cancellation_fee": 0,
    "wallet_balance": null
  }
}
```

### Cập Nhật Booking

**Endpoint**: `PUT /api/driver/bookings/:id`

**Body**:
```json
{
  "scheduled_at": "2024-01-15T14:00:00Z", // optional
  "notes": "optional"
}
```

**Rules:**
- Chỉ có thể cập nhật booking có status = `"pending"`
- Nếu cập nhật `scheduled_at`, phải tuân theo validation như tạo booking mới

---

## 🏢 3. QUẢN LÝ TRẠM (Stations)

### Endpoints (Public - Không cần auth)
- `GET /api/stations/public?status=active&page=&limit=` - Danh sách trạm
- `GET /api/stations/public/nearby?lat=&lng=&radius=&battery_model=` - Tìm trạm gần
- `GET /api/stations/public/:id` - Chi tiết trạm

### Data Model
```typescript
interface Station {
  station_id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  capacity: number; // Số lượng pin tối đa
  supported_models: any; // JSON array
  operating_hours?: string;
  status: "active" | "maintenance" | "closed";
  created_at: string;
  updated_at: string;
  
  // Computed fields
  average_rating?: number;
  total_ratings?: number;
  available_batteries?: number; // Số pin sẵn sàng (status = "full")
  battery_inventory?: {
    full: number;
    charging: number;
    in_use: number;
    maintenance: number;
    damaged: number;
  };
  capacity_percentage?: number; // (total_batteries / capacity) * 100
  capacity_warning?: boolean; // true nếu capacity_percentage > 90%
  battery_stats?: Record<string, number>; // Count by status
  distance_km?: number; // Chỉ có khi search nearby
}
```

### Tìm Trạm Gần

**Endpoint**: `GET /api/stations/public/nearby`

**Query Params:**
- `lat` (required): Latitude
- `lng` (required): Longitude
- `radius` (optional, default: 10): Bán kính tìm kiếm (km)
- `battery_model` (optional): Lọc theo model pin

**Response:**
- Trạm được sắp xếp theo khoảng cách (gần nhất trước)
- Mỗi trạm có `distance_km` (tính bằng Haversine formula)

---

## 💰 4. VÍ ĐIỆN TỬ (Wallet)

### Endpoints
- `GET /api/driver/wallet/balance` - Số dư ví
- `GET /api/driver/wallet/transactions?page=&limit=` - Lịch sử giao dịch
- `POST /api/driver/wallet/topup` - Nạp tiền

### Data Model
```typescript
interface Wallet {
  wallet_id: string;
  user_id: string;
  balance: number; // Decimal (VND)
  created_at: string;
  updated_at: string;
}

interface WalletTransaction {
  payment_id: string;
  transaction_id?: string;
  topup_package_id?: string;
  user_id: string;
  amount: number;
  payment_method: "cash" | "vnpay" | "momo" | "credit_card";
  payment_status: "pending" | "completed" | "failed";
  payment_gateway_ref?: string;
  paid_at?: string;
  created_at: string;
  
  // Relations
  transaction?: {
    transaction_code: string;
    booking?: {
      booking_code: string;
      station?: {
        name: string;
      };
    };
  };
  topup_package?: {
    name: string;
  };
}
```

### Nạp Tiền

**Endpoint**: `POST /api/driver/wallet/topup`

**Body**:
```json
{
  "package_id": "uuid",
  "payment_method": "vnpay" | "momo" | "cash" // default: "vnpay"
}
```

**Business Rules:**
1. **Cash**: Nạp ngay vào ví, tạo payment record với `payment_status = "completed"`
2. **Online (VNPay/MoMo)**: Trả về payment URL để redirect đến gateway
3. Package phải `is_active = true`

**Response (Cash):**
```json
{
  "success": true,
  "message": "Wallet topped up successfully",
  "data": {
    "balance": 500000,
    "topup_amount": 500000,
    "bonus_amount": 50000,
    "actual_amount": 550000
  }
}
```

**Response (Online):**
```json
{
  "success": true,
  "message": "Redirect to payment gateway",
  "data": {
    "package_id": "...",
    "topup_amount": 500000,
    "actual_amount": 550000,
    "bonus_amount": 50000,
    "payment_method": "vnpay"
    // Payment URL sẽ được tạo bởi VNPay service
  }
}
```

---

## 🔔 5. THÔNG BÁO (Notifications)

### Endpoints
- `GET /api/driver/notifications?is_read=&page=&limit=` - Danh sách thông báo
- `PUT /api/driver/notifications/:id/read` - Đánh dấu đã đọc
- `PUT /api/driver/notifications/read-all` - Đánh dấu tất cả đã đọc

### Data Model
```typescript
interface Notification {
  notification_id: string;
  user_id: string;
  type: string; // "booking_confirmed", "booking_cancelled", etc.
  title: string;
  message: string;
  is_read: boolean;
  data?: any; // JSON object chứa metadata
  created_at: string;
}
```

**Note**: Notifications được gửi tự động khi:
- Tạo booking thành công
- Hủy booking
- Booking sắp đến giờ (reminder)
- Booking tự động hủy do hết hạn

---

## 📊 6. GIAO DỊCH (Transactions)

### Endpoints
- `GET /api/driver/transactions?type=&status=&page=&limit=` - Danh sách giao dịch
- `GET /api/driver/transactions/pending` - Giao dịch chờ thanh toán
- `GET /api/driver/transactions/stats` - Thống kê giao dịch
- `GET /api/driver/transactions/:id` - Chi tiết giao dịch
- `POST /api/driver/transactions/:id/pay` - Thanh toán giao dịch
- `POST /api/driver/transactions/refund` - Yêu cầu hoàn tiền

### Data Model
```typescript
interface Transaction {
  transaction_id: string;
  transaction_code: string;
  booking_id: string;
  user_id: string;
  vehicle_id: string;
  station_id: string;
  old_battery_id: string;
  new_battery_id: string;
  staff_id: string;
  swap_at: string;
  swap_started_at?: string;
  swap_completed_at?: string;
  swap_duration_minutes?: number;
  payment_status: "pending" | "completed" | "failed";
  amount: number; // Decimal (VND)
  notes?: string;
  created_at: string;
  
  // Relations
  booking?: {
    booking_code: string;
    station?: {
      name: string;
      address: string;
    };
  };
  station?: {
    name: string;
    address: string;
  };
  vehicle?: {
    license_plate: string;
  };
  payment?: {
    payment_id: string;
    payment_method: string;
    payment_status: string;
  };
  station_rating?: {
    rating_id: string;
    rating: number;
    comment?: string;
  };
}
```

**Note**: Transaction được tạo tự động khi staff hoàn thành swap battery tại trạm.

---

## ⭐ 7. ĐÁNH GIÁ TRẠM (Ratings)

### Endpoints
- `POST /api/ratings` - Tạo đánh giá
- `GET /api/ratings?station_id=&page=&limit=` - Danh sách đánh giá
- `GET /api/ratings/:id` - Chi tiết đánh giá
- `PUT /api/ratings/:id` - Cập nhật đánh giá
- `DELETE /api/ratings/:id` - Xóa đánh giá
- `GET /api/ratings/stations/:id` - Đánh giá của trạm
- `GET /api/ratings/stations/:id/summary` - Tổng quan đánh giá trạm

### Data Model
```typescript
interface Rating {
  rating_id: string;
  user_id: string;
  station_id: string;
  transaction_id: string; // Unique - 1 transaction chỉ được đánh giá 1 lần
  rating: number; // 1-5
  comment?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  user?: {
    user_id: string;
    full_name: string;
    email: string;
  };
  station?: {
    station_id: string;
    name: string;
    address: string;
  };
  transaction?: {
    transaction_id: string;
    transaction_code: string;
    swap_at: string;
  };
}

interface RatingSummary {
  station_id: string;
  total_ratings: number;
  average_rating: number; // Rounded to 1 decimal
  rating_distribution: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
}
```

### Business Rules
1. **Chỉ đánh giá được sau khi hoàn thành giao dịch**:
   - Transaction phải có `payment_status = "completed"`
   - Transaction phải thuộc về user
2. **Mỗi transaction chỉ được đánh giá 1 lần** (unique constraint)
3. **Rating**: 1-5 sao
4. **Update/Delete**: Chỉ user tạo đánh giá mới có thể update/delete

---

## 🔧 Services Cần Tạo (Frontend)

### 1. `wallet.service.ts`
```typescript
- getWalletBalance()
- getWalletTransactions(page, limit)
- topUpWallet(package_id, payment_method)
```

### 2. `notification.service.ts`
```typescript
- getNotifications(is_read?, page?, limit?)
- markNotificationAsRead(notificationId)
- markAllNotificationsAsRead()
```

### 3. `transaction.service.ts`
```typescript
- getTransactions(type?, status?, page?, limit?)
- getPendingTransactions()
- getTransactionStats()
- getTransactionDetails(transactionId)
- payTransaction(transactionId, paymentMethod)
- createRefundRequest(transactionId, reason, amount?)
```

### 4. `rating.service.ts`
```typescript
- createRating(stationId, transactionId, rating, comment?)
- getRatings(stationId?, page?, limit?)
- getRatingDetails(ratingId)
- updateRating(ratingId, rating?, comment?)
- deleteRating(ratingId)
- getStationRatings(stationId, page?, limit?)
- getStationRatingSummary(stationId)
```

### 5. `station.service.ts` (nếu chưa có)
```typescript
- getPublicStations(status?, page?, limit?)
- findNearbyStations(lat, lng, radius?, batteryModel?)
- getPublicStationDetails(stationId)
```

---

## 📱 Components Cần Phát Triển/Cải Thiện

### 1. **Wallet Management** (Chưa có)
- Hiển thị số dư ví
- Lịch sử giao dịch (topup, thanh toán booking)
- Nạp tiền (chọn package, chọn phương thức thanh toán)

### 2. **Notification Center** (Chưa có)
- Badge số thông báo chưa đọc
- Danh sách thông báo (filter by read/unread)
- Đánh dấu đã đọc (từng cái hoặc tất cả)
- Real-time notifications (WebSocket - BE đã có)

### 3. **Transaction History** (Có thể cải thiện)
- Danh sách giao dịch (filter, pagination)
- Chi tiết giao dịch
- Thanh toán giao dịch pending
- Yêu cầu hoàn tiền

### 4. **Rating System** (Chưa có)
- Form đánh giá sau khi hoàn thành giao dịch
- Hiển thị đánh giá của trạm (trong StationDetail)
- Edit/Delete đánh giá của mình

### 5. **Booking Components** (Cải thiện)
- ✅ Đã có: BookingHistory, BookingModal
- ❓ Cần kiểm tra: Instant booking flow, Cancel booking với validation

### 6. **Station Finding** (Cải thiện)
- ✅ Đã có: StationFinding, StationDetail
- ❓ Cần kiểm tra: Nearby search với GPS, Filter by battery model

---

## 🎯 Luồng Nghiệp Vụ Chính

### 1. Đặt Chỗ Thay Pin (Normal Booking)
```
1. User chọn trạm → Xem chi tiết trạm
2. Chọn xe → Chọn thời gian (30 phút - 12 giờ sau)
3. Chọn battery model (phải khớp với vehicle.battery_model)
4. Tạo booking → Nhận thông báo
5. Đến trạm đúng giờ → Staff check-in → Swap battery → Tạo transaction
6. Thanh toán transaction → Có thể đánh giá trạm
```

### 2. Đổi Pin Ngay (Instant Booking)
```
1. User chọn trạm → Xem chi tiết trạm
2. Chọn xe → Chọn "Đổi pin ngay"
3. Chọn battery model
4. Tạo instant booking → Pin được giữ 15 phút
5. Đến trạm trong 15 phút → Staff check-in → Swap → Transaction
6. Thanh toán → Đánh giá
```

### 3. Hủy Booking
```
1. User xem booking → Chọn hủy
2. Kiểm tra: Còn >= 15 phút trước giờ hẹn?
   - ✅ Có: Hủy thành công
   - ❌ Không: Error "Không thể hủy trong 15 phút cuối"
3. Nhận thông báo hủy
```

### 4. Nạp Tiền Ví
```
1. User vào Wallet → Chọn nạp tiền
2. Chọn package (topup_amount, bonus_amount, actual_amount)
3. Chọn phương thức: Cash hoặc Online (VNPay/MoMo)
4. Cash: Nạp ngay → Cập nhật balance
5. Online: Redirect đến gateway → Hoàn tất → Callback → Nạp vào ví
```

### 5. Đánh Giá Trạm
```
1. Sau khi hoàn thành transaction (payment_status = "completed")
2. Hiển thị form đánh giá (rating 1-5, comment)
3. Gửi đánh giá → Lưu vào database
4. Có thể edit/delete đánh giá của mình
```

---

## ⚠️ Lưu Ý Quan Trọng

1. **Date/Time Format**: Luôn dùng ISO 8601 (`2024-01-15T14:00:00Z`)
2. **Battery Model**: Case-insensitive trong BE, nhưng nên giữ nguyên format từ FE
3. **Vehicle Type**: FE có thể gửi `"CAR"`, `"MOTORBIKE"`, `"TRUCK"` → BE tự normalize
4. **Booking Status**: `pending` → `confirmed` → `completed` hoặc `cancelled`
5. **Transaction Payment Status**: `pending` → `completed` hoặc `failed`
6. **Station Status**: Chỉ tìm trạm có `status = "active"`
7. **Error Handling**: Luôn hiển thị message từ BE response

---

## 📝 Checklist Phát Triển

### Services
- [ ] `wallet.service.ts`
- [ ] `notification.service.ts`
- [ ] `transaction.service.ts`
- [ ] `rating.service.ts`
- [ ] Cải thiện `station.service.ts` (nếu cần)

### Components
- [ ] `WalletManagement.tsx` - Quản lý ví
- [ ] `NotificationCenter.tsx` - Trung tâm thông báo
- [ ] `TransactionHistory.tsx` - Lịch sử giao dịch (cải thiện)
- [ ] `RatingForm.tsx` - Form đánh giá
- [ ] `RatingList.tsx` - Danh sách đánh giá
- [ ] Cải thiện `BookingModal.tsx` - Thêm instant booking
- [ ] Cải thiện `BookingHistory.tsx` - Thêm cancel với validation

### Integration
- [ ] WebSocket cho real-time notifications
- [ ] GPS integration cho nearby stations
- [ ] Payment gateway integration (VNPay/MoMo)
- [ ] Error handling và user feedback

---

## 🔗 Tài Liệu Tham Khảo

- **Backend Routes**: `SWP392_Group4/backend/src/routes/`
- **Backend Controllers**: `SWP392_Group4/backend/src/controllers/`
- **Database Schema**: `SWP392_Group4/backend/prisma/schema.prisma`
- **Swagger Docs**: `http://localhost:3000/api-docs` (khi chạy BE)

---

**Chúc bạn phát triển thành công! 🚀**

