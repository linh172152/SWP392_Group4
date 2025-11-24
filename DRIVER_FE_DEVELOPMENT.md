# Hướng dẫn Phát triển Frontend Driver

## Tổng quan

Tài liệu này mô tả các component và tính năng đã được phát triển cho role Driver, cũng như các cải thiện đã thực hiện dựa trên logic nghiệp vụ từ Backend.

---

## ✅ Đã hoàn thành

### 1. Tài liệu Logic Nghiệp vụ
- **File**: `DRIVER_BUSINESS_LOGIC.md`
- **Nội dung**: Tóm tắt đầy đủ logic nghiệp vụ từ BE, bao gồm:
  - Quản lý xe (Vehicles)
  - Quản lý trạm (Stations)
  - Quản lý đặt chỗ (Bookings) - bao gồm instant booking
  - Quản lý ví (Wallet)
  - Quản lý giao dịch (Transactions)
  - Quản lý gói đăng ký (Subscriptions)
  - Quản lý thông báo (Notifications)
  - Gói nạp tiền (Top-up Packages)

### 2. Cải thiện BookingHistory Component
- **File**: `frontend/src/components/driver/BookingHistory.tsx`
- **Cải thiện**:
  - ✅ Hiển thị badge "Đổi pin ngay" cho instant bookings
  - ✅ Hiển thị đầy đủ thông tin `hold_summary`:
    - Mã pin đã giữ (`battery_code`)
    - Thời gian hết hạn giữ chỗ (`hold_expires_at`) với cảnh báo khi sắp hết hạn
    - Thông tin subscription (tên gói, số lượt còn lại)
    - Số tiền đã trừ từ ví và số dư sau khi trừ
  - ✅ Hiển thị `pricing_preview` với message từ BE
  - ✅ Xử lý đúng logic hủy booking (không cho hủy trong 15 phút trước giờ hẹn)

---

## 📋 Các component hiện có

### 1. DriverLayout (`DriverLayout.tsx`)
- Layout chính với sidebar navigation
- Responsive với mobile menu
- Navigation items:
  - Xe của tôi (`/driver/vehicles`)
  - Tìm trạm thay pin (`/driver/stations`)
  - Đơn đặt chỗ (`/driver/bookings`)
  - Giao dịch (`/driver/transactions`)
  - Ví của tôi (`/driver/wallet`)
  - Gói dịch vụ (`/driver/subscriptions`)
  - Hỗ trợ (`/driver/support`)
  - Đánh giá dịch vụ (`/driver/ratings`)
  - Hồ sơ (`/driver/profile`)

### 2. VehicleManagement (`VehicleManagement.tsx`)
- CRUD xe của driver
- Tích hợp với `vehicle.service.ts`

### 3. StationFinding (`StationFinding.tsx`)
- Tìm trạm gần dựa trên vị trí
- Tích hợp với `driver-station.service.ts`

### 4. StationDetail (`StationDetail.tsx`)
- Chi tiết trạm
- Danh sách pin tại trạm

### 5. BookingHistory (`BookingHistory.tsx`) ✅ ĐÃ CẢI THIỆN
- Danh sách bookings với filter và pagination
- Hiển thị đầy đủ thông tin hold_summary và pricing_preview
- Hỗ trợ hủy booking với validation
- Export confirmation voucher

### 6. BookingForm (`BookingForm.tsx`)
- Form đặt lịch thay pin
- Tích hợp với `booking.service.ts`

### 7. BookBatteryPage (`BookBatteryPage.tsx`)
- Trang đặt pin tại trạm cụ thể
- Hỗ trợ instant booking

### 8. TransactionHistory (`TransactionHistory.tsx`)
- Lịch sử giao dịch
- Tích hợp với `transaction.service.ts`

### 9. Wallet (`Wallet.tsx`)
- Quản lý ví, số dư
- Nạp tiền qua VNPay
- Tích hợp với `wallet.service.ts`

### 10. ServicePackages (`ServicePackages.tsx`)
- Xem và đăng ký gói dịch vụ
- Tích hợp với `subscription.service.ts`

### 11. SupportTickets (`SupportTickets.tsx`)
- Quản lý ticket hỗ trợ
- Tích hợp với `support.service.ts`

### 12. StationRating (`StationRating.tsx`)
- Đánh giá trạm
- Tích hợp với `rating.service.ts`

### 13. DriverProfile (`DriverProfile.tsx`)
- Thông tin cá nhân
- Thống kê (tổng lần thay, tháng này)

---

## 🔧 Các cải thiện cần thực hiện

### 1. BookingForm - Hỗ trợ Instant Booking
**File**: `frontend/src/components/driver/BookingForm.tsx`

**Cần làm**:
- Thêm toggle/button "Đổi pin ngay" (instant booking)
- Khi chọn instant booking:
  - Ẩn field `scheduled_at` (tự động = now + 15 phút)
  - Hiển thị cảnh báo: "Pin sẽ được giữ trong 15 phút"
  - Gọi API `POST /api/driver/bookings/instant` thay vì `POST /api/driver/bookings`
- Hiển thị rõ ràng sự khác biệt giữa booking thường và instant booking

**Logic từ BE**:
```typescript
// Instant booking
POST /api/driver/bookings/instant
{
  vehicle_id: string,
  station_id: string,
  battery_model: string,
  notes?: string
}
// Không cần scheduled_at, không lock tiền/subscription
```

### 2. BookBatteryPage - Cải thiện Instant Booking
**File**: `frontend/src/components/driver/BookBatteryPage.tsx`

**Cần làm**:
- Đảm bảo gọi đúng API instant booking khi user chọn "Đổi pin ngay"
- Hiển thị thông báo rõ ràng về thời gian giữ pin (15 phút)
- Xử lý error khi không có pin available ngay

### 3. TransactionHistory - Hiển thị đầy đủ thông tin
**File**: `frontend/src/components/driver/TransactionHistory.tsx`

**Cần làm**:
- Hiển thị đầy đủ thông tin từ BE:
  - `new_battery` và `old_battery` (mã pin, model, capacity, charge)
  - `staff` (người thực hiện)
  - `station_rating` (nếu đã đánh giá)
  - `swap_duration_minutes` (thời gian thay pin)
- Hiển thị transaction stats từ API `/api/driver/transactions/stats`
- Hiển thị pending transactions từ API `/api/driver/transactions/pending`
- Hỗ trợ thanh toán transaction qua API `/api/driver/transactions/:id/pay`

### 4. Wallet - Tích hợp Top-up Packages
**File**: `frontend/src/components/driver/Wallet.tsx`

**Cần làm**:
- Load danh sách top-up packages từ API `/api/driver/topup-packages`
- Hiển thị các gói nạp với:
  - `topup_amount`: Số tiền nạp
  - `bonus_amount`: Số tiền thưởng
  - `actual_amount`: Tổng = topup + bonus
- Khi chọn gói → gọi API `/api/driver/wallet/topup` với `package_id`
- Redirect đến VNPay payment URL
- Xử lý callback từ VNPay

### 5. ServicePackages - Cải thiện Subscription Flow
**File**: `frontend/src/components/driver/ServicePackages.tsx`

**Cần làm**:
- Hiển thị đầy đủ thông tin subscription:
  - `remaining_swaps` (null = unlimited)
  - `end_date` với countdown
  - `auto_renew` status
- Hỗ trợ cancel subscription với validation:
  - Kiểm tra subscription chưa sử dụng
  - Kiểm tra không có booking đang lock subscription
- Hiển thị rõ ràng khi nào subscription cover battery model nào

### 6. Tạo BookingDetail Component (Mới)
**File**: `frontend/src/components/driver/BookingDetail.tsx`

**Cần làm**:
- Component mới để xem chi tiết booking
- Route: `/driver/bookings/:id`
- Hiển thị:
  - Thông tin booking đầy đủ
  - `pricing_preview` với message
  - `hold_summary` chi tiết
  - Transaction (nếu đã hoàn thành)
  - Station rating (nếu đã đánh giá)
  - Actions: Cancel, Update (nếu pending)

---

## 📝 Lưu ý quan trọng

### 1. Hold System
- Khi booking được tạo, BE tự động reserve pin
- Pin được giữ trong `scheduled_at + 15 phút`
- FE cần hiển thị rõ ràng:
  - Mã pin đã giữ (`hold_summary.battery_code`)
  - Thời gian hết hạn (`hold_expires_at`)
  - Cảnh báo khi sắp hết hạn (< 15 phút)

### 2. Subscription Priority
- Mặc định `use_subscription = true`
- Cho phép driver chọn không dùng subscription
- Hiển thị rõ ràng:
  - Khi nào dùng subscription (miễn phí)
  - Khi nào trừ tiền ví
  - Số lượt còn lại sau booking

### 3. Instant Booking
- Khác với booking thường:
  - Không lock tiền/subscription
  - Chỉ reserve pin trong 15 phút
  - Thanh toán sau khi hoàn thành
- Hiển thị badge "Đổi pin ngay" để phân biệt

### 4. Error Handling
- Luôn hiển thị message từ BE (tiếng Việt)
- Xử lý các trường hợp:
  - Không đủ tiền ví
  - Không có pin available
  - Booking conflict
  - Hủy muộn (< 15 phút trước giờ hẹn)

### 5. Real-time Updates
- Nên có polling hoặc websocket cho:
  - Booking status changes
  - Wallet balance updates
  - Notification updates

---

## 🔗 API Endpoints Reference

Xem file `DRIVER_BUSINESS_LOGIC.md` để biết chi tiết về các API endpoints và logic nghiệp vụ.

---

## 📦 Services đã có

- `auth.service.ts` - Authentication
- `vehicle.service.ts` - Vehicle management
- `booking.service.ts` - Booking management
- `driver-station.service.ts` - Station operations
- `wallet.service.ts` - Wallet operations
- `transaction.service.ts` - Transaction management
- `subscription.service.ts` - Subscription management
- `notification.service.ts` - Notifications
- `support.service.ts` - Support tickets
- `rating.service.ts` - Station ratings

---

## 🚀 Next Steps

1. ✅ Hoàn thành cải thiện BookingHistory
2. ⏳ Cải thiện BookingForm - hỗ trợ instant booking
3. ⏳ Cải thiện BookBatteryPage - instant booking flow
4. ⏳ Cải thiện TransactionHistory - hiển thị đầy đủ thông tin
5. ⏳ Cải thiện Wallet - tích hợp topup packages
6. ⏳ Cải thiện ServicePackages - subscription flow
7. ⏳ Tạo BookingDetail component

---

## 📞 Liên hệ

Nếu có thắc mắc về logic nghiệp vụ hoặc cần thay đổi BE, vui lòng liệt kê yêu cầu để thông báo cho bên BE.

