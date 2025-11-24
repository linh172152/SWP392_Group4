# 📋 DANH SÁCH LỖI BUSINESS RULE THEO TỪNG ROLE

## 🔴 ROLE: STAFF

### 1. **LỖI: Xác nhận booking yêu cầu verify SĐT không cần thiết**

**File:** `backend/src/controllers/staff-booking.controller.ts` (dòng 421-439)

**Vấn đề:**
- Staff phải nhập số điện thoại để xác nhận booking
- **Logic không phù hợp:** Confirm booking chỉ là "ghi nhận đơn", không cần driver có mặt
- Verify SĐT nên được chuyển sang bước Complete (khi driver thực sự đến trạm)

**Business Rule đúng (Theo giải pháp mới):**
- **Confirm booking:** Staff chỉ cần bấm "Xác nhận" → Không cần verify SĐT
- **Mục đích:** Ghi nhận đơn, báo cho driver biết staff đã sẵn sàng
- **Complete booking:** Mới cần verify SĐT (khi driver đến trạm)

**Vị trí code:**
```typescript
// Hiện tại: Yêu cầu verify SĐT khi confirm
if (normalizedUser !== normalizedInput) {
  throw new CustomError("Số điện thoại không khớp", 400);
}

// ĐỀ XUẤT: Bỏ verify SĐT ở confirm, chỉ cần update status
// Verify SĐT sẽ được chuyển sang completeBooking
```

---

### 2. **✅ ĐÚNG: Thông báo notification đúng logic**

**File:** `backend/src/controllers/staff-booking.controller.ts` (dòng 511)

**Hiện tại:**
- Message: `"Đặt chỗ của bạn tại ... đã được xác nhận. Vui lòng đến trạm."`
- **Logic ĐÚNG:** Confirm = Staff ghi nhận đơn → Driver cần đến trạm

**Business Rule:**
- Message hiện tại là đúng theo giải pháp mới
- Confirm booking = "Đơn đã được ghi nhận, vui lòng đến trạm"

---

### 3. **LỖI: Complete booking thiếu verify SĐT**

**File:** `backend/src/controllers/staff-booking.controller.ts` (dòng 655-730)

**Vấn đề:**
- Complete booking không yêu cầu verify SĐT
- **Logic sai:** Khi driver đến trạm và staff đổi pin, cần verify danh tính trước

**Business Rule đúng (Theo giải pháp mới):**
- **Complete booking:** Cần verify SĐT bắt buộc (bước 1)
- **Sau khi verify SĐT:** Mới cho nhập thông tin pin (bước 2)
- **Update `checked_in_at`:** Khi verify SĐT thành công (đánh dấu driver đã đến)

**Vị trí code:**
```typescript
// Hiện tại: Complete không có verify SĐT
export const completeBooking = asyncHandler(async (req: Request, res: Response) => {
  const { old_battery_code, new_battery_code, ... } = req.body;
  // THIẾU: Verify SĐT
});

// ĐỀ XUẤT: Thêm verify SĐT bắt buộc
export const completeBooking = asyncHandler(async (req: Request, res: Response) => {
  const { phone, old_battery_code, new_battery_code, ... } = req.body;
  
  // Bước 1: Verify SĐT (bắt buộc)
  if (!phone) {
    throw new CustomError("Phone number is required", 400);
  }
  // ... verify logic ...
  
  // Bước 2: Complete booking
  // ...
});
```

---

### 4. **CẢI THIỆN: UI Confirm và Complete cần tách biệt rõ ràng**

**File:** `frontend/src/components/staff/SwapTransactions.tsx`

**Vấn đề:**
- Dialog Confirm: Hiện tại yêu cầu nhập SĐT (không cần thiết)
- Dialog Complete: Chưa có bước verify SĐT riêng biệt

**Business Rule đúng (Theo giải pháp mới):**
- **Confirm Dialog:** 
  - Bỏ input SĐT
  - Chỉ cần button "Xác nhận"
  - Message: "Ghi nhận đơn này. Driver sẽ nhận được thông báo."
- **Complete Dialog:**
  - **Bước 1:** Verify SĐT (input + button "Xác nhận danh tính")
  - **Bước 2:** Nhập thông tin pin (chỉ hiện sau khi verify thành công)

---

## 🟡 ROLE: DRIVER

### 5. **✅ ĐÚNG: Status label đúng logic**

**File:** `frontend/src/components/driver/BookingHistory.tsx` (dòng 181)

**Hiện tại:**
- Status `confirmed` hiển thị: `"Đã xác nhận - Vui lòng đến trạm"`
- **Logic ĐÚNG:** Confirm = Staff ghi nhận đơn → Driver cần đến trạm

**Business Rule:**
- Status label hiện tại là đúng theo giải pháp mới
- `confirmed` = "Đơn đã được staff ghi nhận, vui lòng đến trạm"

---

### 6. **CẢI THIỆN: Logic hủy booking confirmed cần làm rõ**

**File:** `backend/src/controllers/booking.controller.ts` (dòng 1349, 1377-1396)

**Hiện tại:**
- Driver có thể hủy booking với status `confirmed`
- **Theo giải pháp mới:** `confirmed` = Staff đã ghi nhận đơn, driver chưa đến trạm
- **Logic hiện có:**
  - ✅ Check: "Không cho hủy trong 15 phút trước scheduled time"
  - ❌ **THIẾU:** Không check "chỉ cho hủy trong vòng X phút sau khi confirm"

**Business Rule đúng:**
- Booking `confirmed` = Driver chưa đến trạm → **Có thể cho hủy**
- Nhưng nên có validation: **Chỉ cho hủy trong vòng X phút sau khi confirm** (ví dụ: 30 phút)
- Lý do: Sau khi staff đã ghi nhận đơn, nếu quá lâu (ví dụ: > 30 phút) thì không nên cho hủy nữa

**Cần thêm:**
```typescript
// Nếu booking confirmed, check thời gian từ khi confirm
if (booking.status === "confirmed" && booking.checked_in_at) {
  const confirmedAt = new Date(booking.checked_in_at);
  const minutesSinceConfirmed = (now.getTime() - confirmedAt.getTime()) / (1000 * 60);
  
  if (minutesSinceConfirmed > 30) {
    throw new CustomError(
      "Không thể hủy đơn đã được xác nhận quá 30 phút. Vui lòng liên hệ staff.",
      400
    );
  }
}
```

---

### 7. **LỖI: Validation thời gian hủy booking có thể cải thiện**

**File:** `backend/src/controllers/booking.controller.ts` (dòng 1386-1396)

**Vấn đề:**
- Chỉ check: "Không cho hủy trong 15 phút trước scheduled time"
- **Thiếu:** Không check trường hợp đã quá scheduled time (đã qua giờ hẹn)

**Business Rule đúng:**
- Nếu đã qua scheduled time và booking vẫn pending → Có thể cho hủy (vì đã quá hạn)
- Nếu booking đã confirmed → Không cho hủy (vì driver đã đến trạm)

---

## 🟢 ROLE: ADMIN

### 8. **LỖI: Không có validation về instant booking**

**File:** `backend/src/controllers/booking.controller.ts` (dòng 1090-1331)

**Vấn đề:**
- Instant booking: Driver đặt chỗ và đến ngay
- Nhưng không có validation rõ ràng về:
  - Driver phải ở gần trạm (GPS check)?
  - Có thể tạo instant booking từ xa không?

**Business Rule cần làm rõ:**
- Instant booking có yêu cầu driver phải ở gần trạm không?
- Hoặc instant booking chỉ là flag để staff biết driver sẽ đến ngay?

---

## 📊 TỔNG KẾT

### Lỗi cần sửa (Theo giải pháp mới):
1. ⚠️ **Confirm booking yêu cầu verify SĐT không cần thiết** (Lỗi #1) - Cần bỏ verify SĐT
2. ✅ **Thông báo notification đúng logic** (Lỗi #2) - Không cần sửa
3. ⚠️ **Complete booking thiếu verify SĐT** (Lỗi #3) - Cần thêm verify SĐT
4. 💡 **UI cần tách biệt rõ ràng Confirm và Complete** (Lỗi #4) - Cải thiện UI
5. ✅ **Status label đúng logic** (Lỗi #5) - Không cần sửa
6. 💡 **Logic hủy booking confirmed cần làm rõ** (Lỗi #6) - Cải thiện

### Lỗi khác:
7. 💡 **Validation thời gian hủy có thể cải thiện** (Lỗi #7)
8. ❓ **Business rule về instant booking** (Lỗi #8)

---

## 🔄 FLOW ĐÚNG (Theo Giải Pháp Mới)

### Flow hiện tại (CẦN SỬA):
```
1. Driver đặt chỗ → pending
2. Staff xác nhận (yêu cầu verify SĐT) → confirmed ❌
3. Driver nhận thông báo: "Vui lòng đến trạm"
4. Staff complete (không verify SĐT) → completed ❌
```

### Flow đúng (THEO GIẢI PHÁP MỚI):
```
1. Driver đặt chỗ → pending
2. Staff bấm "Xác nhận" (KHÔNG cần verify SĐT) → confirmed ✅
   → Driver nhận: "Đã xác nhận - Vui lòng đến trạm" ✅
3. Driver đến trạm
4. Staff bấm "Đổi pin":
   → Bước 1: Verify SĐT (bắt buộc) ✅
   → Bước 2: Nhập pin cũ + pin mới ✅
   → completed
```

**Ý nghĩa:**
- **Confirm:** Staff ghi nhận đơn, báo cho driver biết đã sẵn sàng
- **Complete:** Xác nhận driver đã đến và thực hiện đổi pin

---

## 📝 GHI CHÚ

- **Giải pháp mới:** Tách biệt rõ ràng 2 mục đích:
  - **Confirm booking:** Staff ghi nhận đơn (không cần driver có mặt)
  - **Complete booking:** Xác nhận driver đã đến và đổi pin (cần verify SĐT)
- **Booking `confirmed`:** Có nghĩa là "Staff đã ghi nhận đơn, sẵn sàng cho việc đổi pin"
- **Status label:** "Đã xác nhận - Vui lòng đến trạm" là ĐÚNG theo giải pháp mới

---

## 📄 GIẢI THÍCH VỀ 2 PAGE: LỊCH SỬ THAY PIN VÀ GIAO DỊCH

### **1. Lịch sử Thay Pin (Booking History)**

**Mục đích:** Hiển thị **quá trình đặt chỗ và thay pin** của driver

**Dữ liệu hiển thị:**
- Tất cả bookings: `pending`, `confirmed`, `completed`, `cancelled`
- Thông tin: Trạm, xe, thời gian hẹn, status, pin đã giữ, giá tiền
- Chức năng: Hủy booking, xuất phiếu xác nhận

**Lý do có đơn chưa complete:**
- Driver cần theo dõi **toàn bộ quá trình** từ khi đặt chỗ đến khi hoàn thành
- Biết được đơn nào đã được staff ghi nhận (`confirmed`)
- Biết được đơn nào đang chờ (`pending`)
- Có thể hủy đơn nếu cần

**File:** `frontend/src/components/driver/BookingHistory.tsx`
**API:** `GET /api/driver/bookings`

---

### **2. Giao dịch (Transaction History)**

**Mục đích:** Hiển thị **lịch sử giao dịch đổi pin thật sự** (chỉ các đơn đã hoàn thành)

**Dữ liệu hiển thị:**
- Chỉ transactions: Booking đã `completed`
- Thông tin chi tiết: Pin cũ, pin mới, mức sạc, giá tiền, phương thức thanh toán
- Chức năng: Đánh giá dịch vụ, xem chi tiết giao dịch

**Lý do chỉ có đơn đã complete:**
- Transaction chỉ được tạo khi booking `completed`
- Đây là **lịch sử giao dịch thật sự** (đã thực hiện đổi pin)
- Dùng để: Xem lịch sử thanh toán, đánh giá dịch vụ, tra cứu giao dịch

**File:** `frontend/src/components/driver/TransactionHistory.tsx`
**API:** `GET /api/driver/transactions`

---

### **So sánh:**

| Tiêu chí | Lịch sử Thay Pin | Giao dịch |
|----------|------------------|-----------|
| **Mục đích** | Quá trình đặt chỗ và thay pin | Lịch sử giao dịch thật sự |
| **Dữ liệu** | Tất cả bookings (pending, confirmed, completed, cancelled) | Chỉ transactions (completed) |
| **Khi nào có** | Ngay khi driver đặt chỗ | Chỉ khi booking completed |
| **Dùng để** | Theo dõi quá trình, hủy đơn | Xem lịch sử thanh toán, đánh giá |
| **Tương tự** | Giống "Đơn hàng" trong e-commerce | Giống "Lịch sử mua hàng" trong e-commerce |

---

### **Ví dụ thực tế:**

**Lịch sử Thay Pin:**
- Đơn #1: pending (vừa đặt, chưa được xác nhận)
- Đơn #2: confirmed (đã được staff ghi nhận, chờ driver đến)
- Đơn #3: completed (đã đổi pin xong)
- Đơn #4: cancelled (đã hủy)

**Giao dịch:**
- Chỉ có: Đơn #3 (đã completed)
- Không có: Đơn #1, #2, #4 (vì chưa có transaction)

---

### **Kết luận:**

✅ **Giải thích của bạn là ĐÚNG:**
- **Lịch sử Thay Pin:** Show quá trình thay pin (bao gồm cả pending, confirmed)
- **Giao dịch:** Lịch sử thay pin thật sự (chỉ completed)

Đây là cách thiết kế hợp lý, tương tự như:
- E-commerce: "Đơn hàng" vs "Lịch sử mua hàng"
- Booking system: "Bookings" vs "Transactions"

