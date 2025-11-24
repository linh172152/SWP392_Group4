# ⚡ Quick Reference - Frontend Driver (Tóm Tắt Nhanh)

> **Lưu ý:** Chỉ tập trung vào **Frontend Driver** (phần bạn phụ trách)

## 🎯 5 Feature Core Phải Demo

1. **Đăng ký/Đăng nhập** → Tự động tạo Wallet
2. **Tìm trạm & Đặt lịch** → GPS, lock wallet, check pin available
3. **Hủy booking** → Release lock, cancellation logic
4. **Nạp tiền** → VNPay flow, top-up packages có bonus
5. **Đăng ký gói** → Subscription, proportional refund

---

## 💼 Nghiệp Vụ Quan Trọng (Business Rules)

### Booking System
- ✅ **Thời gian đặt:** 30 phút - 12 giờ (Scheduled) hoặc 15 phút (Instant)
- ✅ **Lock wallet/subscription** khi đặt chỗ
- ✅ **Không cho hủy** trong 15 phút trước giờ hẹn (hoặc phí 20K nếu enable)
- ✅ **Auto-cancel** sau 10 phút nếu không đến
- ✅ **Reminder** 30 phút & 10 phút trước giờ hẹn

### Wallet System
- ✅ **Wallet-based ONLY** - Phải nạp tiền trước
- ✅ **Lock ≠ Payment** - Lock là giữ tiền, Payment là trừ tiền
- ✅ **Top-up packages** có bonus (VD: Nạp 500K nhận 550K)

### Subscription System
- ✅ **Proportional refund** khi hủy gói
- ✅ **Cancellation fee 3%**
- ✅ **Minimum refund 10,000đ**
- ✅ **Compatibility check** - Chỉ dùng được cho battery models trong package

### Battery System
- ✅ **Status:** full, charging, in_use, reserved, damaged, maintenance
- ✅ **Compatibility** - Vehicle battery_model phải match với battery model
- ✅ **Reserved** - Pin đã được giữ cho booking

---

## 🔄 Flow Driver-Staff (Từ Góc Nhìn Driver)

### Flow: Đặt Lịch → Nhận Notification → Xem Kết Quả

1. **Driver đặt lịch (Frontend):**
   - File: `BookBatteryPage.tsx`
   - Check wallet/subscription
   - Gọi API tạo booking
   - Hiển thị lock summary
   - Status = pending

2. **Driver nhận notification xác nhận:**
   - File: `NotificationBell.tsx`
   - Socket.IO: `type: "booking_confirmed"`
   - Auto-refresh Booking History
   - Status = confirmed

3. **Driver nhận notification hoàn thành:**
   - File: `NotificationBell.tsx`, `TransactionHistory.tsx`
   - Socket.IO: `type: "booking_completed"`
   - Auto-refresh: Booking History, Transaction History, Wallet
   - Status = completed
   - Hiển thị battery codes: "BAT001 → BAT002"

**Key Points (Frontend):**
- ✅ Real-time notification qua Socket.IO
- ✅ Auto-refresh các trang liên quan
- ✅ Hiển thị đầy đủ thông tin

---

## 🛠️ Trick Sửa Code Frontend Nhanh

### 1. Thay đổi text/message
**File:** `frontend/src/components/driver/BookingHistory.tsx`
- Tìm text cần đổi → Dùng Find & Replace (Ctrl+H)
- VD: "Đặt lịch đổi pin" → "Đặt chỗ thay pin"

### 2. Thay đổi validation (Frontend)
**File:** `frontend/src/components/driver/BookBatteryPage.tsx`
- Tìm function `handleSubmit` → Thêm check mới
- VD: Check wallet balance >= 50K

### 3. Thêm field vào form
**File:** `frontend/src/components/driver/BookBatteryPage.tsx`
- Thêm state: `const [field, setField] = useState('')`
- Thêm vào form: `<Input value={field} onChange={...} />`
- Thêm vào submit body

### 4. Thêm filter mới
**File:** `frontend/src/components/driver/BookingHistory.tsx`
- Thêm Select component
- Filter array: `bookings.filter(...)`

### 5. Thay đổi format hiển thị
**File:** `frontend/src/utils/format.ts`
- Function `formatCurrency`, `formatDate`
- Hoặc format trực tiếp trong component

---

## ❓ Câu Hỏi Thường Gặp

**Q: Tại sao lock wallet?**
A: Đảm bảo driver có đủ tiền khi đến trạm.

**Q: Lock vs Payment?**
A: Lock = giữ tiền (có thể hoàn), Payment = trừ tiền (không hoàn).

**Q: Tại sao không cho hủy trong 15 phút?**
A: Tránh hủy phút cuối, gây lãng phí pin đã reserve.

**Q: Subscription unlimited?**
A: `swap_limit = null` = không giới hạn.

**Q: Battery compatibility?**
A: Vehicle battery_model phải match với battery model trong hệ thống.

**Q: Proportional refund?**
A: Hoàn tiền theo tỷ lệ thời gian còn lại (trừ 3% phí hủy).

---

## 📝 Checklist Trước Demo

- [ ] Test flow: Đăng ký → Đặt lịch → Hủy
- [ ] Test flow: Đặt lịch → Staff xác nhận → Hoàn thành
- [ ] Test nạp tiền (hoặc chuẩn bị giải thích)
- [ ] Test đăng ký gói → Hủy gói (proportional refund)
- [ ] Review business rules
- [ ] Chuẩn bị data mẫu
- [ ] Test trên mobile (nếu có)

---

**File chi tiết:** Xem `DEMO_GUIDE.md` để biết thêm!

