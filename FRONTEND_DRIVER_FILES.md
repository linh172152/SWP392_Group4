# 📁 Danh Sách File Frontend Driver

> **Lưu ý:** Đây là danh sách các file Frontend Driver mà bạn phụ trách. Khi bị hỏi code, chỉ cần tìm trong các file này.

## 🗂️ Cấu Trúc Thư Mục

```
frontend/src/components/driver/
├── BookBatteryPage.tsx          # Đặt lịch đổi pin
├── BookingForm.tsx              # Form đặt lịch (có thể không dùng)
├── BookingHistory.tsx           # Lịch sử đặt chỗ
├── BookingModal.tsx             # Modal đặt lịch (có thể không dùng)
├── DriverDashboard.tsx         # Dashboard chính (routing)
├── DriverLayout.tsx             # Layout với sidebar
├── DriverProfile.tsx            # Hồ sơ cá nhân
├── NotificationBell.tsx        # Notification bell (Socket.IO)
├── RatingModal.tsx              # Modal đánh giá
├── ServicePackages.tsx          # Gói dịch vụ
├── StationDetail.tsx            # Chi tiết trạm
├── StationFinding.tsx           # Tìm trạm
├── StationRating.tsx            # Lịch sử đánh giá
├── SupportTickets.tsx           # Hỗ trợ
├── TopUpModal.tsx               # Modal nạp tiền
├── TransactionHistory.tsx       # Lịch sử giao dịch
├── VehicleManagement.tsx        # Quản lý xe
└── Wallet.tsx                   # Ví của tôi
```

---

## 📄 Chi Tiết Từng File

### 1. Authentication
**File:** `frontend/src/components/AuthModal.tsx`
- **Chức năng:** Đăng ký, đăng nhập
- **Key functions:**
  - `handleSubmit()` - Xử lý submit form
  - `validatePassword()` - Validate password
- **API:** 
  - `POST /api/auth/register`
  - `POST /api/auth/login`

---

### 2. Vehicle Management
**File:** `frontend/src/components/driver/VehicleManagement.tsx`
- **Chức năng:** CRUD xe
- **Key functions:**
  - `loadVehicles()` - Load danh sách xe
  - `handleAdd()` - Thêm xe mới
  - `handleEdit()` - Sửa xe
  - `handleDelete()` - Xóa xe
- **API:**
  - `GET /api/driver/vehicles`
  - `POST /api/driver/vehicles`
  - `PUT /api/driver/vehicles/:id`
  - `DELETE /api/driver/vehicles/:id`

---

### 3. Station Finding
**File:** `frontend/src/components/driver/StationFinding.tsx`
- **Chức năng:** Tìm trạm gần nhất
- **Key functions:**
  - `findNearbyPublicStations()` - Tìm trạm gần nhất (GPS)
  - `searchStations()` - Tìm kiếm trạm
- **API:**
  - `GET /api/driver/stations/nearby?lat=...&lng=...`
  - `GET /api/stations/public?search=...`

---

### 4. Station Detail
**File:** `frontend/src/components/driver/StationDetail.tsx`
- **Chức năng:** Chi tiết trạm
- **Key functions:**
  - `loadStationDetails()` - Load thông tin trạm
  - `calculateDistance()` - Tính khoảng cách
- **API:**
  - `GET /api/driver/stations/:id`

---

### 5. Book Battery Page
**File:** `frontend/src/components/driver/BookBatteryPage.tsx`
- **Chức năng:** Đặt lịch đổi pin (QUAN TRỌNG!)
- **Key functions:**
  - `loadVehicles()` - Load danh sách xe
  - `loadPricing()` - Load giá pin
  - `loadWalletBalance()` - Load số dư ví
  - `loadSubscription()` - Load subscription
  - `doesSubscriptionCoverModel()` - Check compatibility
  - `handleSubmit()` - Submit booking
- **API:**
  - `POST /api/driver/bookings` (Scheduled)
  - `POST /api/driver/bookings/instant` (Instant)
- **Nghiệp vụ:**
  - Check wallet balance hoặc subscription
  - Validate thời gian (30 phút - 12 giờ)
  - Hiển thị lock summary

---

### 6. Booking History
**File:** `frontend/src/components/driver/BookingHistory.tsx`
- **Chức năng:** Lịch sử đặt chỗ, hủy booking
- **Key functions:**
  - `loadBookings()` - Load danh sách booking
  - `handleCancel()` - Hủy booking
  - `handleFilterChange()` - Filter theo status
- **API:**
  - `GET /api/driver/bookings?status=...&page=...`
  - `PUT /api/driver/bookings/:id/cancel`
- **Nghiệp vụ:**
  - Tính thời gian hủy
  - Hiển thị cảnh báo nếu hủy < 15 phút
  - Refresh wallet sau khi hủy

---

### 7. Wallet
**File:** `frontend/src/components/driver/Wallet.tsx`
- **Chức năng:** Quản lý ví, lịch sử giao dịch
- **Key functions:**
  - `loadBalance()` - Load số dư
  - `loadTransactions()` - Load lịch sử giao dịch
  - `handleTopUpSuccess()` - Callback sau khi nạp tiền thành công
- **API:**
  - `GET /api/driver/wallet/balance`
  - `GET /api/driver/wallet/transactions?page=...&limit=10`

---

### 8. Top-Up Modal
**File:** `frontend/src/components/driver/TopUpModal.tsx`
- **Chức năng:** Nạp tiền vào ví
- **Key functions:**
  - `loadTopUpPackages()` - Load gói nạp tiền
  - `handleTopUp()` - Tạo payment URL VNPay
- **API:**
  - `GET /api/topup-packages?is_active=true`
  - `POST /api/driver/wallet/topup`
- **Nghiệp vụ:**
  - Hiển thị gói nạp tiền với bonus
  - Redirect đến VNPay

---

### 9. Service Packages
**File:** `frontend/src/components/driver/ServicePackages.tsx`
- **Chức năng:** Đăng ký/hủy gói dịch vụ
- **Key functions:**
  - `loadPackages()` - Load danh sách gói
  - `loadCurrentSubscription()` - Load subscription hiện tại
  - `handleSubscribe()` - Đăng ký gói
  - `handleCancel()` - Hủy gói
  - `loadRefundPreview()` - Preview hoàn tiền
- **API:**
  - `GET /api/packages?is_active=true`
  - `GET /api/driver/subscriptions?status=active`
  - `POST /api/driver/subscriptions/packages/:id/subscribe`
  - `GET /api/driver/subscriptions/:id/refund-preview`
  - `PUT /api/driver/subscriptions/:id/cancel`
- **Nghiệp vụ:**
  - Check đã có subscription chưa
  - Check wallet balance
  - Hiển thị proportional refund

---

### 10. Transaction History
**File:** `frontend/src/components/driver/TransactionHistory.tsx`
- **Chức năng:** Lịch sử giao dịch đổi pin
- **Key functions:**
  - `loadTransactions()` - Load lịch sử
  - `handleOpenRating()` - Mở modal đánh giá
- **API:**
  - `GET /api/driver/transactions?page=...&limit=10&status=...`
- **Nghiệp vụ:**
  - Hiển thị battery codes (old → new)
  - Hiển thị nút "Đánh giá" nếu chưa đánh giá

---

### 11. Rating Modal
**File:** `frontend/src/components/driver/RatingModal.tsx`
- **Chức năng:** Đánh giá trạm
- **Key functions:**
  - `handleSubmit()` - Gửi đánh giá
- **API:**
  - `POST /api/ratings`
- **Nghiệp vụ:**
  - Chọn số sao (1-5)
  - Nhập comment (tùy chọn)
  - Mỗi transaction chỉ đánh giá 1 lần

---

### 12. Station Rating
**File:** `frontend/src/components/driver/StationRating.tsx`
- **Chức năng:** Xem lịch sử đánh giá
- **Key functions:**
  - `loadRatings()` - Load đánh giá đã tạo
- **API:**
  - `GET /api/ratings`

---

### 13. Support Tickets
**File:** `frontend/src/components/driver/SupportTickets.tsx`
- **Chức năng:** Tạo và xem ticket hỗ trợ
- **Key functions:**
  - `loadTickets()` - Load danh sách ticket
  - `createTicket()` - Tạo ticket mới
- **API:**
  - `GET /api/support?status=...`
  - `POST /api/support`

---

### 14. Driver Profile
**File:** `frontend/src/components/driver/DriverProfile.tsx`
- **Chức năng:** Quản lý hồ sơ
- **Key functions:**
  - `loadProfile()` - Load thông tin user
  - `handleUpdate()` - Cập nhật profile
  - `handleChangePassword()` - Đổi mật khẩu
- **API:**
  - `GET /api/auth/me`
  - `PUT /api/auth/profile`
  - `POST /api/auth/change-password`

---

### 15. Notification Bell
**File:** `frontend/src/components/driver/NotificationBell.tsx`
- **Chức năng:** Real-time notifications (Socket.IO)
- **Key functions:**
  - Socket.IO connection
  - Listen notifications
  - Mark as read
- **API:**
  - `GET /api/driver/notifications`
  - `PUT /api/driver/notifications/:id/read`
  - `PUT /api/driver/notifications/read-all`

---

## 🔍 Cách Tìm Code Nhanh

### Tìm theo chức năng:
- **Đặt lịch:** `BookBatteryPage.tsx`
- **Hủy booking:** `BookingHistory.tsx` - `handleCancel()`
- **Nạp tiền:** `TopUpModal.tsx` - `handleTopUp()`
- **Đăng ký gói:** `ServicePackages.tsx` - `handleSubscribe()`
- **Hủy gói:** `ServicePackages.tsx` - `handleCancel()`
- **Notification:** `NotificationBell.tsx`

### Tìm theo API endpoint:
- **Vehicles:** `VehicleManagement.tsx`
- **Stations:** `StationFinding.tsx`, `StationDetail.tsx`
- **Bookings:** `BookBatteryPage.tsx`, `BookingHistory.tsx`
- **Wallet:** `Wallet.tsx`, `TopUpModal.tsx`
- **Subscriptions:** `ServicePackages.tsx`
- **Transactions:** `TransactionHistory.tsx`
- **Ratings:** `RatingModal.tsx`, `StationRating.tsx`
- **Support:** `SupportTickets.tsx`

---

## 📝 Lưu Ý Khi Sửa Code

1. **Chỉ sửa Frontend Driver**, không động vào:
   - Backend (`backend/src/`)
   - Staff components (`frontend/src/components/staff/`)
   - Admin components (`frontend/src/components/admin/`)

2. **API đã có sẵn**, chỉ cần gọi đúng endpoint:
   - Xem `frontend/src/config/api.ts` để biết endpoint
   - Xem `frontend/src/services/` để biết cách gọi API

3. **Validation:**
   - Frontend validate trước khi gọi API
   - Backend sẽ validate lại (double check)

4. **Error handling:**
   - Luôn có try-catch
   - Hiển thị error message cho user

---

**File chi tiết:** Xem `DEMO_GUIDE.md` để biết nghiệp vụ và trick sửa code!

