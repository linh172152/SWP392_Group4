# 🎯 Hướng Dẫn Demo & Nghiệp Vụ - Frontend Driver

> **Lưu ý:** File này chỉ tập trung vào **Frontend Driver** (phần bạn phụ trách). Backend, Staff, Admin đã được chia cho các thành viên khác.

## 📋 Mục Lục
1. [Feature Core Cần Demo](#feature-core-cần-demo)
2. [Nghiệp Vụ (Business Rules) - Góc Nhìn Frontend](#nghiệp-vụ-business-rules---góc-nhìn-frontend)
3. [Flow Driver-Staff (Từ Góc Nhìn Driver)](#flow-driver-staff-từ-góc-nhìn-driver)
4. [Trick Sửa Code Frontend Nhanh](#trick-sửa-code-frontend-nhanh)

---

## 🎬 Feature Core Cần Demo

### 1. Authentication (Đăng ký/Đăng nhập)
**File:** `frontend/src/components/AuthModal.tsx`

**Demo Flow:**
1. Đăng ký tài khoản mới → Tự động tạo Wallet (balance = 0)
2. Đăng nhập → Nhận Access Token + Refresh Token
3. Auto-refresh token khi sắp hết hạn

**Điểm cần nhấn:**
- ✅ Tự động tạo Wallet khi đăng ký
- ✅ JWT với refresh token mechanism
- ✅ Auto-refresh token (2 phút trước khi hết hạn)

---

### 2. Vehicle Management (Quản lý xe)
**File:** `frontend/src/components/driver/VehicleManagement.tsx`

**Demo Flow:**
1. Thêm xe mới → Nhập biển số, loại xe, model pin
2. Xem danh sách xe → Hiển thị pin hiện tại của từng xe
3. Sửa/Xóa xe → Không cho xóa nếu xe đang có booking active

**Điểm cần nhấn:**
- ✅ Validate biển số không trùng
- ✅ Không cho xóa xe đang có booking

---

### 3. Station Finding & Booking (Tìm trạm & Đặt lịch)
**Files:**
- `frontend/src/components/driver/StationFinding.tsx`
- `frontend/src/components/driver/StationDetail.tsx`
- `frontend/src/components/driver/BookBatteryPage.tsx`

**Demo Flow:**
1. Tìm trạm gần nhất → GPS location → Hiển thị khoảng cách
2. Xem chi tiết trạm → Pricing, số pin có sẵn
3. Đặt lịch đổi pin:
   - Chọn xe → Chọn model pin → Chọn thời gian (30 phút - 12 giờ)
   - Check wallet balance hoặc subscription
   - Lock wallet amount hoặc lock subscription
   - Tạo booking với status `pending`

**Điểm cần nhấn:**
- ✅ GPS location → Tính khoảng cách thực tế
- ✅ Check pin available tại thời điểm đặt
- ✅ Lock wallet/subscription khi đặt chỗ
- ✅ Instant booking (15 phút) vs Scheduled booking (30 phút - 12 giờ)

---

### 4. Booking History & Cancel (Lịch sử & Hủy đặt chỗ)
**File:** `frontend/src/components/driver/BookingHistory.tsx`

**Demo Flow:**
1. Xem lịch sử booking → Filter theo status
2. Hủy booking:
   - Nếu hủy < 15 phút trước giờ hẹn → Trừ phí hủy 20K
   - Nếu hủy >= 15 phút → Hoàn tiền đầy đủ
   - Release wallet lock hoặc subscription lock

**Điểm cần nhấn:**
- ✅ Cancellation fee logic (20K nếu < 15 phút)
- ✅ Release lock khi hủy

---

### 5. Wallet & Top-Up (Ví & Nạp tiền)
**Files:**
- `frontend/src/components/driver/Wallet.tsx`
- `frontend/src/components/driver/TopUpModal.tsx`

**Demo Flow:**
1. Xem số dư ví → Lịch sử giao dịch
2. Nạp tiền:
   - Chọn gói nạp tiền (có bonus) → Redirect đến VNPay
   - Thanh toán → Return về `/payment/success` → Cập nhật wallet balance

**Điểm cần nhấn:**
- ✅ Top-up packages có bonus (VD: Nạp 500K nhận 550K)
- ✅ VNPay integration (sandbox/production)
- ✅ Payment return URL handling

---

### 6. Service Packages (Gói dịch vụ)
**File:** `frontend/src/components/driver/ServicePackages.tsx`

**Demo Flow:**
1. Xem danh sách gói dịch vụ → Giá, thời hạn, số lần đổi pin
2. Đăng ký gói → Trừ tiền từ wallet → Tạo subscription
3. Hủy gói:
   - Proportional refund (theo tỷ lệ sử dụng)
   - Cancellation fee 3%
   - Minimum refund 10,000đ

**Điểm cần nhấn:**
- ✅ Proportional refund khi hủy gói
- ✅ Cancellation fee 3%
- ✅ Minimum refund logic

---

### 7. Transaction History (Lịch sử giao dịch)
**File:** `frontend/src/components/driver/TransactionHistory.tsx`

**Demo Flow:**
1. Xem lịch sử giao dịch đổi pin → Filter theo status
2. Xem chi tiết: Pin cũ → Pin mới, số tiền, trạm
3. Đánh giá dịch vụ → Mỗi transaction chỉ đánh giá 1 lần

**Điểm cần nhấn:**
- ✅ Hiển thị battery codes (old → new)
- ✅ Rating chỉ 1 lần per transaction

---

## 💼 Nghiệp Vụ (Business Rules) - Góc Nhìn Frontend

### 1. Booking System - Business Rules (Frontend)

#### a. Tạo Booking (Create Booking)

**File:** `frontend/src/components/driver/BookBatteryPage.tsx`

**Business Rules (Những gì Frontend phải làm):**
1. **Validation thời gian đặt chỗ:**
   - Scheduled booking: 30 phút - 12 giờ từ hiện tại
   - Instant booking: Ngay trong 15 phút
   - ❌ Hiển thị lỗi nếu không hợp lệ

2. **Check pin có sẵn:**
   - Gọi API để check pin available
   - ❌ Hiển thị lỗi "Không còn pin, vui lòng chọn thời gian khác"

3. **Check wallet/subscription:**
   - Load wallet balance từ API
   - Load subscription từ API
   - Check compatibility: subscription có cover battery model không?
   - **Option 1: Dùng Subscription**
     - Hiển thị "Miễn phí (dùng gói dịch vụ)"
     - Gửi `use_subscription: true` trong request
   - **Option 2: Dùng Wallet**
     - Check `walletBalance >= price`
     - ❌ Nếu không đủ → Hiển thị "Số dư không đủ, vui lòng nạp thêm"
     - Gửi `use_subscription: false` trong request

4. **Hiển thị lock summary:**
   - Sau khi tạo booking thành công, hiển thị:
     - Số tiền đã lock (nếu dùng wallet)
     - Số lần đổi còn lại (nếu dùng subscription)
     - Thời gian lock hết hạn

**Key Code Location:**
```typescript
// frontend/src/components/driver/BookBatteryPage.tsx

// Load wallet balance
const loadWalletBalance = async () => {
  const res = await getWalletBalance();
  setWalletBalance(Number(res.data.balance));
};

// Load subscription
const loadSubscription = async () => {
  const res = await fetchWithAuth(API_ENDPOINTS.SUBSCRIPTIONS.BASE);
  // Check subscription active và compatible
};

// Check compatibility
const doesSubscriptionCoverModel = (subscription, batteryModel) => {
  // Check battery_models array hoặc battery_capacity_kwh
};

// Submit booking
const handleSubmit = async () => {
  // Validate
  if (!selectedVehicle || !selectedModel) {
    setError("Vui lòng chọn xe và model pin");
    return;
  }
  
  // Check wallet nếu không dùng subscription
  if (!useSubscription && walletBalance < price) {
    setError("Số dư không đủ, vui lòng nạp thêm");
    return;
  }
  
  // Gọi API
  await fetchWithAuth(API_ENDPOINTS.DRIVER.BOOKINGS, {
    method: 'POST',
    body: JSON.stringify({
      vehicle_id: selectedVehicle.vehicle_id,
      battery_model: selectedModel,
      scheduled_at: scheduledAt,
      use_subscription: useSubscription,
      // ...
    }),
  });
};
```

---

#### b. Hủy Booking (Cancel Booking)

**Business Rules:**
1. **Thời gian hủy:**
   - **Hiện tại:** Không cho hủy trong vòng 15 phút trước giờ hẹn (phải liên hệ staff)
   - **Có thể thay đổi:** Nếu hủy < 15 phút → Trừ phí hủy 20,000đ (code đã có sẵn, chỉ cần uncomment)
   - Nếu hủy >= 15 phút → Hoàn tiền đầy đủ (không trừ phí)

2. **Release lock:**
   - Release wallet lock → Hoàn tiền vào ví (trừ phí hủy nếu có)
   - Release subscription lock → Trả lại remaining_swaps

3. **Status update:**
   - Set booking status = `cancelled`
   - Ghi note: "Cancelled by user at [time]"

**Code Location:**
- Backend: `backend/src/controllers/booking.controller.ts` - `cancelBooking()`
- Frontend: `frontend/src/components/driver/BookingHistory.tsx`

**Key Logic:**
```typescript
// File: backend/src/controllers/booking.controller.ts - cancelBooking()
const minutesUntilScheduled = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);

// Hiện tại: Không cho hủy trong 15 phút
if (minutesUntilScheduled < 15 && minutesUntilScheduled > 0) {
  throw new CustomError(
    "Cannot cancel booking within 15 minutes of scheduled time. Please contact staff.",
    400
  );
}

// Nếu muốn cho hủy với phí (uncomment dòng 1394):
// const cancellationFee = minutesUntilScheduled < 15 ? 20000 : 0;

// Release lock
if (usedSubscription) {
  releaseSubscriptionLock();
} else {
  refundWalletAmount(lockedAmount - cancellationFee);
}
```

---

#### c. Auto-Cancel Expired Bookings (Frontend xử lý)

**File:** `frontend/src/components/driver/BookingHistory.tsx`

**Business Rules (Những gì Frontend phải làm):**
1. **Hiển thị notification:**
   - Backend tự động cancel và gửi notification qua Socket.IO
   - Frontend nhận notification → Hiển thị toast/alert
   - Message: "Đặt chỗ đã bị hủy tự động do bạn không có mặt trong vòng 10 phút sau giờ đã đặt"

2. **Auto-refresh danh sách:**
   - Khi nhận notification → Refresh danh sách booking
   - Booking status sẽ chuyển từ `confirmed` → `cancelled`
   - Hiển thị "Đã hủy tự động" với màu đỏ

3. **Cập nhật wallet:**
   - Nếu có hoàn tiền → Refresh wallet balance
   - Hiển thị transaction "Hoàn tiền hủy đặt chỗ"

**Key Code Location:**
```typescript
// frontend/src/components/driver/NotificationBell.tsx hoặc BookingHistory.tsx

// Listen Socket.IO notification
useEffect(() => {
  socket.on('notification', (data) => {
    if (data.type === 'booking_cancelled') {
      // Hiển thị toast
      toast.error(data.message);
      
      // Refresh bookings
      loadBookings();
      
      // Refresh wallet nếu có hoàn tiền
      if (data.data.wallet_refund_amount > 0) {
        loadWalletBalance();
      }
    }
  });
}, []);
```

---

### 2. Wallet System - Business Rules (Frontend)

#### a. Wallet-Based Payment

**File:** `frontend/src/components/driver/Wallet.tsx`, `BookBatteryPage.tsx`

**Business Rules (Những gì Frontend phải làm):**
1. **Check wallet balance trước khi đặt:**
   - Load wallet balance: `GET /api/driver/wallet/balance`
   - So sánh với giá đổi pin
   - ❌ Nếu `balance < price` → Hiển thị "Số dư không đủ, vui lòng nạp thêm"
   - ✅ Nếu đủ → Cho phép đặt chỗ

2. **Hiển thị lock amount:**
   - Sau khi đặt chỗ thành công, hiển thị:
     - "Số tiền đã giữ: X VND"
     - "Số dư sau khi giữ: Y VND"
   - Lưu ý: Đây là "giữ" (lock), chưa phải "trừ" (payment)

3. **Hiển thị transaction:**
   - Khi hoàn thành booking → Wallet balance giảm (đã trừ tiền)
   - Khi hủy booking → Wallet balance tăng (đã hoàn tiền)
   - Hiển thị trong lịch sử giao dịch

---

## 🔒 Giải Thích Chi Tiết: Lock Wallet & Lock Subscription

> **Mục đích:** Giải thích rõ ràng về cơ chế "lock" (giữ tiền/pin) để demo dễ hiểu

### 📖 Khái Niệm: Lock là gì?

**Lock (Giữ) = Tạm thời "khóa" tiền hoặc số lần đổi pin, chưa trừ thực sự**

**Ví dụ đời thường:**
- Giống như khi bạn đặt phòng khách sạn: Họ **giữ** (hold) số tiền trong thẻ, nhưng chưa **trừ** (charge) tiền
- Nếu bạn hủy đặt phòng → Họ **release** (nhả) số tiền đã giữ → Bạn không mất tiền
- Nếu bạn check-in → Họ mới **trừ** tiền thực sự

---

### 💰 Lock Wallet - Giữ Tiền Trong Ví

#### **Ví dụ Cụ Thể:**

**Tình huống:** Driver có 1,000,000đ trong ví, muốn đặt chỗ đổi pin giá 200,000đ

**Bước 1: Trước khi đặt chỗ**
```
Ví của Driver:
├─ Số dư: 1,000,000đ
├─ Số tiền đã giữ: 0đ
└─ Số dư có thể dùng: 1,000,000đ
```

**Bước 2: Khi đặt chỗ thành công (LOCK)**
```
Ví của Driver:
├─ Số dư: 1,000,000đ (KHÔNG ĐỔI - vẫn còn trong ví)
├─ Số tiền đã giữ: 200,000đ (LOCK - không thể dùng)
└─ Số dư có thể dùng: 800,000đ (1,000,000 - 200,000)
```

**Giải thích:**
- ✅ Số dư vẫn là 1,000,000đ (tiền vẫn còn trong ví)
- ✅ Nhưng 200,000đ đã bị "khóa" (lock) → Không thể dùng để đặt chỗ khác
- ✅ Chỉ còn 800,000đ có thể dùng

**Bước 3a: Nếu hủy đặt chỗ (RELEASE LOCK)**
```
Ví của Driver:
├─ Số dư: 1,000,000đ (KHÔNG ĐỔI)
├─ Số tiền đã giữ: 0đ (ĐÃ NHẢ)
└─ Số dư có thể dùng: 1,000,000đ (TRỞ LẠI BAN ĐẦU)
```

**Bước 3b: Nếu hoàn thành đổi pin (PAYMENT - Trừ tiền thực sự)**
```
Ví của Driver:
├─ Số dư: 800,000đ (ĐÃ TRỪ 200,000đ)
├─ Số tiền đã giữ: 0đ (ĐÃ CHUYỂN THÀNH PAYMENT)
└─ Số dư có thể dùng: 800,000đ
```

---

### 📦 Lock Subscription - Giữ Số Lần Đổi Pin

#### **Ví dụ Cụ Thể:**

**Tình huống:** Driver có gói dịch vụ với 10 lần đổi pin còn lại, muốn đặt chỗ

**Bước 1: Trước khi đặt chỗ**
```
Gói dịch vụ của Driver:
├─ Tổng số lần: 10 lần
├─ Đã dùng: 0 lần
└─ Còn lại: 10 lần (có thể dùng)
```

**Bước 2: Khi đặt chỗ thành công (LOCK)**
```
Gói dịch vụ của Driver:
├─ Tổng số lần: 10 lần
├─ Đã dùng: 0 lần
├─ Đã giữ: 1 lần (LOCK - không thể dùng cho booking khác)
└─ Còn lại: 9 lần (10 - 1)
```

**Giải thích:**
- ✅ Tổng số lần vẫn là 10 (chưa trừ)
- ✅ Nhưng 1 lần đã bị "khóa" (lock) → Không thể dùng để đặt chỗ khác
- ✅ Chỉ còn 9 lần có thể dùng

**Bước 3a: Nếu hủy đặt chỗ (RELEASE LOCK)**
```
Gói dịch vụ của Driver:
├─ Tổng số lần: 10 lần
├─ Đã dùng: 0 lần
├─ Đã giữ: 0 lần (ĐÃ NHẢ)
└─ Còn lại: 10 lần (TRỞ LẠI BAN ĐẦU)
```

**Bước 3b: Nếu hoàn thành đổi pin (TRỪ THỰC SỰ)**
```
Gói dịch vụ của Driver:
├─ Tổng số lần: 10 lần
├─ Đã dùng: 1 lần (ĐÃ TRỪ)
├─ Đã giữ: 0 lần
└─ Còn lại: 9 lần (10 - 1)
```

---

### 🎯 Tại Sao Cần Lock?

#### **1. Đảm Bảo Có Đủ Tiền/Pin Khi Đến Trạm**

**Vấn đề nếu không lock:**
```
Driver đặt chỗ → Có 200,000đ trong ví
↓
Driver rút hết tiền (200,000đ) → Ví còn 0đ
↓
Driver đến trạm → Không đủ tiền thanh toán ❌
```

**Giải pháp với lock:**
```
Driver đặt chỗ → Lock 200,000đ → Ví còn 0đ có thể dùng
↓
Driver không thể rút hết tiền (vì đã bị lock)
↓
Driver đến trạm → Có đủ tiền thanh toán ✅
```

#### **2. Tránh Double Booking (Đặt 2 chỗ cùng lúc)**

**Vấn đề nếu không lock:**
```
Driver có 200,000đ → Đặt chỗ 1 (200,000đ) → Thành công
Driver vẫn có 200,000đ → Đặt chỗ 2 (200,000đ) → Thành công ❌
↓
Driver chỉ đủ tiền cho 1 chỗ, nhưng đặt được 2 chỗ
```

**Giải pháp với lock:**
```
Driver có 200,000đ → Đặt chỗ 1 (200,000đ) → Lock 200,000đ
Driver còn 0đ có thể dùng → Đặt chỗ 2 → Báo lỗi "Không đủ tiền" ✅
```

#### **3. Có Thể Hoàn Tiền Nếu Hủy**

**Với lock:**
```
Đặt chỗ → Lock 200,000đ
Hủy chỗ → Release lock → Hoàn 200,000đ vào ví ✅
```

**Nếu không lock (trừ tiền ngay):**
```
Đặt chỗ → Trừ 200,000đ ngay
Hủy chỗ → Phải xử lý refund phức tạp ❌
```

---

### 🎬 Cách Demo Lock Wallet Cho Thầy Cô

#### **Demo Script:**

**Bước 1: Chuẩn bị**
1. Mở Wallet page → Ghi lại số dư ban đầu: **1,000,000đ**
2. Mở Book Battery page → Chọn trạm, xe, thời gian
3. Giá đổi pin: **200,000đ**

**Bước 2: Demo Lock (Khi đặt chỗ)**
```
"Bây giờ tôi sẽ đặt chỗ đổi pin giá 200,000đ"

[Click "Đặt chỗ"]

"Khi đặt chỗ thành công, hệ thống sẽ GIỮ (lock) 200,000đ trong ví"

[Chỉ vào Wallet page hoặc thông báo]
"Xem đây:
- Số dư ví: 1,000,000đ (KHÔNG ĐỔI - tiền vẫn còn trong ví)
- Số tiền đã giữ: 200,000đ (ĐÃ BỊ KHÓA)
- Số dư có thể dùng: 800,000đ (1,000,000 - 200,000)

Lưu ý: Tiền CHƯA BỊ TRỪ, chỉ bị GIỮ lại để đảm bảo có đủ tiền khi đến trạm."
```

**Bước 3: Demo Release Lock (Khi hủy)**
```
"Bây giờ tôi sẽ hủy đặt chỗ này"

[Click "Hủy đặt chỗ"]

"Khi hủy, hệ thống sẽ NHẢ (release) số tiền đã giữ"

[Chỉ vào Wallet page]
"Xem đây:
- Số dư ví: 1,000,000đ (VẪN KHÔNG ĐỔI)
- Số tiền đã giữ: 0đ (ĐÃ NHẢ)
- Số dư có thể dùng: 1,000,000đ (TRỞ LẠI BAN ĐẦU)

Tiền đã được hoàn lại, không mất gì cả."
```

**Bước 4: Demo Payment (Khi hoàn thành)**
```
"Bây giờ tôi sẽ đặt chỗ lại và giả sử đã hoàn thành đổi pin"

[Đặt chỗ lại → Giả sử Staff hoàn thành]

"Khi Staff hoàn thành đổi pin, hệ thống mới TRỪ TIỀN THỰC SỰ"

[Chỉ vào Wallet page]
"Xem đây:
- Số dư ví: 800,000đ (ĐÃ TRỪ 200,000đ)
- Số tiền đã giữ: 0đ (ĐÃ CHUYỂN THÀNH PAYMENT)
- Số dư có thể dùng: 800,000đ

Bây giờ tiền mới thực sự bị trừ."
```

---

### 🎬 Cách Demo Lock Subscription Cho Thầy Cô

#### **Demo Script:**

**Bước 1: Chuẩn bị**
1. Mở Service Packages page → Xem gói đang dùng
2. Ghi lại: **Còn lại: 10 lần đổi pin**

**Bước 2: Demo Lock (Khi đặt chỗ)**
```
"Bây giờ tôi sẽ đặt chỗ dùng gói dịch vụ"

[Chọn "Dùng gói dịch vụ" → Đặt chỗ]

"Khi đặt chỗ thành công, hệ thống sẽ GIỮ (lock) 1 lần đổi pin"

[Chỉ vào Service Packages page hoặc thông báo]
"Xem đây:
- Tổng số lần: 10 lần (KHÔNG ĐỔI)
- Đã dùng: 0 lần (CHƯA TRỪ)
- Đã giữ: 1 lần (ĐÃ BỊ KHÓA)
- Còn lại: 9 lần (10 - 1)

Lưu ý: Số lần CHƯA BỊ TRỪ, chỉ bị GIỮ lại để đảm bảo có đủ khi đến trạm."
```

**Bước 3: Demo Release Lock (Khi hủy)**
```
"Bây giờ tôi sẽ hủy đặt chỗ này"

[Click "Hủy đặt chỗ"]

"Khi hủy, hệ thống sẽ NHẢ (release) số lần đã giữ"

[Chỉ vào Service Packages page]
"Xem đây:
- Tổng số lần: 10 lần (VẪN KHÔNG ĐỔI)
- Đã dùng: 0 lần (VẪN CHƯA TRỪ)
- Đã giữ: 0 lần (ĐÃ NHẢ)
- Còn lại: 10 lần (TRỞ LẠI BAN ĐẦU)

Số lần đã được hoàn lại, không mất gì cả."
```

**Bước 4: Demo Trừ Thực Sự (Khi hoàn thành)**
```
"Bây giờ tôi sẽ đặt chỗ lại và giả sử đã hoàn thành đổi pin"

[Đặt chỗ lại → Giả sử Staff hoàn thành]

"Khi Staff hoàn thành đổi pin, hệ thống mới TRỪ SỐ LẦN THỰC SỰ"

[Chỉ vào Service Packages page]
"Xem đây:
- Tổng số lần: 10 lần
- Đã dùng: 1 lần (ĐÃ TRỪ)
- Đã giữ: 0 lần (ĐÃ CHUYỂN THÀNH USED)
- Còn lại: 9 lần (10 - 1)

Bây giờ số lần mới thực sự bị trừ."
```

---

### 📊 So Sánh Lock vs Payment

| Khía Cạnh | **LOCK (Giữ)** | **PAYMENT (Trừ)** |
|-----------|----------------|------------------|
| **Khi nào?** | Khi đặt chỗ | Khi hoàn thành đổi pin |
| **Tiền/Pin có bị trừ không?** | ❌ Chưa trừ, chỉ giữ | ✅ Đã trừ thực sự |
| **Có thể hoàn lại không?** | ✅ Có (nếu hủy) | ❌ Không (trừ khi refund riêng) |
| **Mục đích** | Đảm bảo có đủ khi đến trạm | Thanh toán thực sự |
| **Ví dụ** | Giống đặt phòng khách sạn (hold) | Giống check-out (charge) |

---

### 💡 Câu Hỏi Thường Gặp Khi Demo

**Q: Tại sao không trừ tiền ngay khi đặt chỗ?**
A: Vì nếu trừ ngay, khi hủy sẽ phải xử lý refund phức tạp. Lock giúp đơn giản hóa: Hủy → Release lock → Xong.

**Q: Lock có giống như "đặt cọc" không?**
A: Không hoàn toàn. Đặt cọc thường không hoàn lại nếu hủy. Lock thì hoàn lại đầy đủ (trừ phí hủy nếu có).

**Q: Nếu driver có 200K, lock 200K, thì còn dùng được bao nhiêu?**
A: Còn 0đ có thể dùng. 200K đã bị lock, không thể dùng để đặt chỗ khác.

**Q: Lock có thời hạn không?**
A: Có. Lock hết hạn khi booking bị auto-cancel (sau 10 phút không đến) hoặc khi hoàn thành/hủy booking.

---

### 🎯 Key Points Khi Demo

1. **Nhấn mạnh:** Lock ≠ Payment
   - Lock = Giữ (hold) → Có thể hoàn lại
   - Payment = Trừ (charge) → Không thể hoàn lại

2. **Show số liệu cụ thể:**
   - Trước: 1,000,000đ
   - Sau lock: 1,000,000đ (số dư) - 200,000đ (đã giữ) = 800,000đ (có thể dùng)
   - Sau hủy: 1,000,000đ (trở lại ban đầu)
   - Sau payment: 800,000đ (đã trừ thực sự)

3. **Giải thích lý do:**
   - Đảm bảo có đủ tiền khi đến trạm
   - Tránh double booking
   - Dễ dàng hoàn tiền khi hủy

---

**Key Code Location:**
```typescript
// frontend/src/components/driver/BookBatteryPage.tsx

// Load wallet balance
const loadWalletBalance = async () => {
  const res = await getWalletBalance();
  setWalletBalance(Number(res.data.balance));
};

// Check trước khi submit
const handleSubmit = async () => {
  // Check wallet nếu không dùng subscription
  if (!useSubscription) {
    if (walletBalance < price) {
      setError("Số dư không đủ, vui lòng nạp thêm");
      // Có thể redirect đến wallet page
      // navigate('/driver/wallet');
      return;
    }
  }
  
  // Submit booking...
};

// Hiển thị lock summary sau khi tạo booking
{holdSummary && (
  <div>
    <p>Số tiền đã giữ: {holdSummary.wallet_amount_locked?.toLocaleString('vi-VN')}đ</p>
    <p>Số dư sau khi giữ: {holdSummary.wallet_balance_after?.toLocaleString('vi-VN')}đ</p>
  </div>
)}
```

---

#### b. Top-Up Packages

**File:** `frontend/src/components/driver/TopUpModal.tsx`, `PaymentSuccess.tsx`

**Business Rules (Những gì Frontend phải làm):**
1. **Hiển thị top-up packages:**
   - Load packages: `GET /api/topup-packages?is_active=true`
   - Hiển thị: topup_amount, bonus_amount
   - Format: "Nạp 500,000đ → Nhận 550,000đ (+50,000đ bonus)"

2. **Tạo payment URL:**
   - Gọi `POST /api/driver/wallet/topup` với `package_id` hoặc `amount`
   - Backend trả về `payment_url` (VNPay URL)
   - Redirect user đến VNPay: `window.location.href = payment_url`

3. **Xử lý return từ VNPay:**
   - VNPay redirect về `/payment/success` hoặc `/payment/error`
   - File: `frontend/src/components/PaymentSuccess.tsx`
   - Backend đã xử lý và cập nhật wallet balance
   - Frontend chỉ cần:
     - Hiển thị "Nạp tiền thành công"
     - Refresh wallet balance
     - Redirect về wallet page

**Key Code Location:**
```typescript
// frontend/src/components/driver/TopUpModal.tsx

const handleTopUp = async (packageId?: string, amount?: number) => {
  const res = await fetchWithAuth(API_ENDPOINTS.DRIVER.WALLET.TOPUP, {
    method: 'POST',
    body: JSON.stringify({
      package_id: packageId,
      amount: amount,
    }),
  });
  
  const data = await res.json();
  
  if (data.success && data.data.payment_url) {
    // Redirect đến VNPay
    window.location.href = data.data.payment_url;
  }
};

// frontend/src/components/PaymentSuccess.tsx
useEffect(() => {
  // Backend đã xử lý payment và cập nhật wallet
  // Frontend chỉ cần hiển thị success và refresh
  toast.success("Nạp tiền thành công!");
  navigate('/driver/wallet');
}, []);
```

---

### 3. Subscription System - Business Rules (Frontend)

#### a. Đăng Ký Gói (Subscribe Package)

**File:** `frontend/src/components/driver/ServicePackages.tsx`

**Business Rules (Những gì Frontend phải làm):**
1. **Check điều kiện trước khi đăng ký:**
   - Load current subscription: `GET /api/driver/subscriptions?status=active`
   - ❌ Nếu đã có subscription active → Hiển thị "Bạn đã có gói đang hoạt động"
   - Load wallet balance
   - ❌ Nếu `walletBalance < packagePrice` → Hiển thị "Số dư không đủ, vui lòng nạp thêm"

2. **Hiển thị thông tin gói:**
   - Name, price, duration_days
   - swap_limit: "∞ lần" nếu null, hoặc "X lần" nếu có số
   - battery_models: Hiển thị danh sách model pin tương thích

3. **Xác nhận đăng ký:**
   - Hiển thị dialog xác nhận với thông tin:
     - Giá gói
     - Số dư ví hiện tại
     - Số dư sau khi trừ

4. **Gọi API đăng ký:**
   - `POST /api/driver/subscriptions/packages/:id/subscribe`
   - Backend sẽ trừ tiền và tạo subscription

5. **Cập nhật UI:**
   - Refresh danh sách subscription
   - Refresh wallet balance
   - Hiển thị "Đăng ký thành công"

**Key Code Location:**
```typescript
// frontend/src/components/driver/ServicePackages.tsx

const handleSubscribe = async (packageId: string) => {
  // Check đã có subscription chưa
  if (currentSubscription) {
    setError("Bạn đã có gói đang hoạt động");
    return;
  }
  
  // Check wallet balance
  const package = packages.find(p => p.package_id === packageId);
  if (walletBalance < package.price) {
    setError("Số dư không đủ, vui lòng nạp thêm");
    return;
  }
  
  // Xác nhận
  const confirmed = window.confirm(
    `Đăng ký gói ${package.name} với giá ${package.price.toLocaleString('vi-VN')}đ?`
  );
  if (!confirmed) return;
  
  // Gọi API
  const res = await fetchWithAuth(
    `${API_ENDPOINTS.SUBSCRIPTIONS.BASE}/packages/${packageId}/subscribe`,
    { method: 'POST' }
  );
  
  // Refresh
  await loadSubscriptions();
  await loadWalletBalance();
};
```

---

#### b. Hủy Gói (Cancel Subscription)

**File:** `frontend/src/components/driver/ServicePackages.tsx`

**Business Rules (Những gì Frontend phải làm):**
1. **Hiển thị thông tin hoàn tiền:**
   - Gọi API preview refund: `GET /api/driver/subscriptions/:id/refund-preview`
   - Backend tính toán và trả về:
     - `original_amount`: Giá gói ban đầu
     - `refund_ratio`: Tỷ lệ hoàn tiền
     - `cancellation_fee_percent`: 3%
     - `cancellation_fee_amount`: Số tiền phí hủy
     - `refund_amount`: Số tiền sẽ hoàn lại
     - `minimum_refund_applied`: Có áp dụng minimum 10K không

2. **Hiển thị dialog xác nhận:**
   - Hiển thị thông tin hoàn tiền chi tiết
   - Formula hiển thị: "Hoàn tiền = Giá gói × Tỷ lệ còn lại × 97% (trừ 3% phí)"
   - Minimum: "Tối thiểu hoàn 10,000đ"

3. **Gọi API hủy:**
   - `PUT /api/driver/subscriptions/:id/cancel`
   - Backend sẽ hoàn tiền vào wallet

4. **Cập nhật UI:**
   - Refresh subscription (status = cancelled)
   - Refresh wallet balance (đã tăng do hoàn tiền)
   - Hiển thị "Hủy gói thành công"

**Key Code Location:**
```typescript
// frontend/src/components/driver/ServicePackages.tsx

const handleCancel = async (subscriptionId: string) => {
  // Load refund preview
  const previewRes = await fetchWithAuth(
    `${API_ENDPOINTS.SUBSCRIPTIONS.BASE}/${subscriptionId}/refund-preview`
  );
  const preview = await previewRes.json();
  
  // Hiển thị dialog với thông tin hoàn tiền
  setRefundInfo(preview.data);
  setCancelDialogOpen(true);
  
  // User xác nhận
  const handleConfirmCancel = async () => {
    const res = await fetchWithAuth(
      `${API_ENDPOINTS.SUBSCRIPTIONS.BASE}/${subscriptionId}/cancel`,
      { method: 'PUT' }
    );
    
    // Refresh
    await loadSubscriptions();
    await loadWalletBalance();
  };
};

// Hiển thị refund info
{refundInfo && (
  <div>
    <p>Giá gói: {refundInfo.original_amount.toLocaleString('vi-VN')}đ</p>
    <p>Tỷ lệ hoàn: {refundInfo.refund_ratio * 100}%</p>
    <p>Phí hủy (3%): {refundInfo.cancellation_fee_amount.toLocaleString('vi-VN')}đ</p>
    <p>Số tiền hoàn lại: {refundInfo.refund_amount.toLocaleString('vi-VN')}đ</p>
  </div>
)}
```

---

### 4. Battery Compatibility - Business Rules (Frontend)

**File:** `frontend/src/utils/batteryModelUtils.ts`, `BookBatteryPage.tsx`

**Business Rules (Những gì Frontend phải làm):**
1. **Model matching:**
   - Vehicle `battery_model` phải match với battery model trong hệ thống
   - Sử dụng `matchBatteryModel()` để so sánh (case-insensitive, trim)
   - Khi chọn vehicle → Chỉ hiển thị battery models tương thích

2. **Subscription compatibility check:**
   - Load subscription: `GET /api/driver/subscriptions?status=active`
   - Check compatibility:
     - Nếu subscription có `battery_models` array → Check vehicle battery_model có trong array không
     - Nếu subscription có `battery_capacity_kwh` → Check vehicle battery capacity <= subscription capacity
   - Nếu compatible → Hiển thị "Miễn phí (dùng gói dịch vụ)"
   - Nếu không compatible → Hiển thị giá tiền

**Key Code Location:**
```typescript
// frontend/src/utils/batteryModelUtils.ts

export const matchBatteryModel = (model1: string, model2: string): boolean => {
  return model1.trim().toLowerCase() === model2.trim().toLowerCase();
};

// frontend/src/components/driver/BookBatteryPage.tsx

const doesSubscriptionCoverModel = (subscription: any, batteryModel: string): boolean => {
  if (!subscription || !subscription.package) return false;
  const pkg = subscription.package;
  
  // Check battery_models array
  if (pkg.battery_models && Array.isArray(pkg.battery_models) && pkg.battery_models.length > 0) {
    return pkg.battery_models.some((model: string) => 
      matchBatteryModel(model, batteryModel)
    );
  }
  
  // Check battery_capacity_kwh (nếu không có battery_models)
  // Backend sẽ xử lý logic này
  return false;
};

// Sử dụng
const isCompatible = doesSubscriptionCoverModel(currentSubscription, selectedModel);
if (isCompatible) {
  setUseSubscription(true);
  setPrice(0); // Miễn phí
} else {
  setUseSubscription(false);
  setPrice(batteryPrice); // Trả tiền
}
```

---

## 🔄 Flow Driver-Staff (Từ Góc Nhìn Driver)

### Flow 1: Driver Đặt Lịch → Staff Xác Nhận → Hoàn Thành

**Step 1: Driver tạo booking (Frontend)**
- **File:** `frontend/src/components/driver/BookBatteryPage.tsx`
- **API:** `POST /api/driver/bookings`
- **Frontend làm:**
  1. Validate form (xe, model pin, thời gian)
  2. Check wallet balance hoặc subscription
  3. Gọi API tạo booking
  4. Hiển thị lock summary (số tiền đã lock, số dư sau lock)
  5. Hiển thị notification "Đặt chỗ thành công"
  6. Redirect đến Booking History

**Step 2: Staff xác nhận booking (Driver nhận notification)**
- **File:** `frontend/src/components/driver/NotificationBell.tsx`, `BookingHistory.tsx`
- **Frontend làm:**
  1. Nhận notification qua Socket.IO: `type: "booking_confirmed"`
  2. Hiển thị toast: "Đặt chỗ đã được xác nhận"
  3. Auto-refresh Booking History
  4. Booking status chuyển từ `pending` → `confirmed`
  5. Hiển thị badge "Đã xác nhận" màu xanh

**Step 3: Staff hoàn thành booking (Driver nhận notification)**
- **File:** `frontend/src/components/driver/NotificationBell.tsx`, `BookingHistory.tsx`, `TransactionHistory.tsx`
- **Frontend làm:**
  1. Nhận notification qua Socket.IO: `type: "booking_completed"` hoặc transaction created
  2. Hiển thị toast: "Đổi pin thành công"
  3. Auto-refresh Booking History (status = `completed`)
  4. Auto-refresh Transaction History (có transaction mới)
  5. Auto-refresh Wallet (balance đã giảm nếu dùng wallet)
  6. Hiển thị battery codes: "Pin cũ: BAT001 → Pin mới: BAT002"
  7. Hiển thị nút "Đánh giá" trong Transaction History

**Key Points (Từ góc nhìn Driver):**
- ✅ Driver không cần làm gì sau khi đặt chỗ, chỉ cần chờ notification
- ✅ Notification real-time qua Socket.IO
- ✅ Auto-refresh các trang liên quan khi có thay đổi
- ✅ Hiển thị đầy đủ thông tin: battery codes, số tiền, trạm

---

### Flow 2: Auto-Cancel Expired Bookings (Driver nhận notification)

**File:** `frontend/src/components/driver/NotificationBell.tsx`, `BookingHistory.tsx`

**Frontend làm:**
1. Nhận notification qua Socket.IO: `type: "booking_cancelled"`
2. Message: "Đặt chỗ đã bị hủy tự động do bạn không có mặt trong vòng 10 phút sau giờ đã đặt"
3. Auto-refresh Booking History
4. Booking status chuyển từ `confirmed` → `cancelled`
5. Hiển thị badge "Đã hủy tự động" màu đỏ
6. Nếu có hoàn tiền → Refresh wallet balance
7. Hiển thị transaction "Hoàn tiền hủy đặt chỗ" trong Wallet

**Key Code:**
```typescript
// frontend/src/components/driver/NotificationBell.tsx

useEffect(() => {
  socket.on('notification', (data) => {
    if (data.type === 'booking_cancelled') {
      toast.error(data.message);
      
      // Refresh bookings
      // (có thể dùng context hoặc event để trigger refresh)
      window.dispatchEvent(new Event('refresh-bookings'));
      
      // Refresh wallet nếu có hoàn tiền
      if (data.data.wallet_refund_amount > 0) {
        window.dispatchEvent(new Event('refresh-wallet'));
      }
    }
  });
}, []);
```

---

### Flow 3: Booking Reminders (Driver nhận notification)

**File:** `frontend/src/components/driver/NotificationBell.tsx`

**Frontend làm:**
1. Nhận notification qua Socket.IO:
   - `type: "booking_reminder"` (30 phút trước)
   - `type: "booking_final_reminder"` (10 phút trước)
2. Hiển thị toast với message:
   - "Bạn có đặt chỗ tại [Trạm] sau 30 phút nữa. Vui lòng chuẩn bị đến đúng giờ."
   - "Bạn có đặt chỗ tại [Trạm] sau 10 phút nữa. Vui lòng đến đúng giờ để tránh bị hủy tự động."
3. Có thể hiển thị notification badge với số lượng unread
4. Click vào notification → Navigate đến Booking History

**Key Code:**
```typescript
// frontend/src/components/driver/NotificationBell.tsx

useEffect(() => {
  socket.on('notification', (data) => {
    if (data.type === 'booking_reminder' || data.type === 'booking_final_reminder') {
      toast.info(data.message, {
        duration: 10000, // Hiển thị 10 giây
      });
      
      // Cập nhật notification count
      setUnreadCount(prev => prev + 1);
    }
  });
}, []);
```

---

## 🛠️ Trick Sửa Code Frontend Nhanh

> **Lưu ý:** Chỉ sửa Frontend Driver, không động vào Backend/Staff/Admin

### 📍 API Endpoints Quan Trọng (Frontend)

**File:** `frontend/src/config/api.ts`

Các endpoint Driver thường dùng:
```typescript
API_ENDPOINTS.DRIVER.VEHICLES              // GET, POST, PUT, DELETE
API_ENDPOINTS.DRIVER.STATIONS               // GET /driver/stations/nearby
API_ENDPOINTS.DRIVER.BOOKINGS              // GET, POST
API_ENDPOINTS.DRIVER.BOOKINGS + '/:id/cancel'  // PUT
API_ENDPOINTS.DRIVER.WALLET.BALANCE        // GET
API_ENDPOINTS.DRIVER.WALLET.TRANSACTIONS   // GET
API_ENDPOINTS.DRIVER.WALLET.TOPUP          // POST
API_ENDPOINTS.SUBSCRIPTIONS.BASE           // GET, POST /packages/:id/subscribe
API_ENDPOINTS.SUBSCRIPTIONS.BASE + '/:id/cancel'  // PUT
API_ENDPOINTS.DRIVER.TRANSACTIONS          // GET
API_ENDPOINTS.RATINGS.BASE                 // GET, POST
API_ENDPOINTS.SUPPORT.CREATE               // POST
API_ENDPOINTS.SUPPORT.LIST                 // GET
```

### 1. Thêm Field Mới vào Form Booking

**Ví dụ: Thêm field `notes` (ghi chú) vào form đặt chỗ**

**File:** `frontend/src/components/driver/BookBatteryPage.tsx`

```typescript
// 1. Thêm state
const [notes, setNotes] = useState('');

// 2. Thêm vào form (sau phần chọn thời gian)
<div className="space-y-2">
  <Label>Ghi chú (tùy chọn)</Label>
  <Textarea
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    placeholder="Ghi chú cho nhân viên trạm..."
    rows={3}
  />
</div>

// 3. Thêm vào submit (trong handleSubmit)
await fetchWithAuth(API_ENDPOINTS.DRIVER.BOOKINGS, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vehicle_id: selectedVehicle.vehicle_id,
    battery_model: selectedModel,
    scheduled_at: scheduledAt,
    use_subscription: useSubscription,
    notes: notes.trim() || undefined, // Thêm field mới
  }),
});
```

**Lưu ý:** Backend đã có field `notes` rồi, chỉ cần thêm vào Frontend form.

---

### 2. Thay Đổi Text/Message Hiển Thị

**Ví dụ: Thay đổi message "Không cho hủy trong 15 phút" thành "Phí hủy 30K trong 15 phút"**

**File:** `frontend/src/components/driver/BookingHistory.tsx`

```typescript
// Tìm function handleCancel (khoảng dòng 200-250)

// Hiện tại:
if (minutesUntilScheduled < 15 && minutesUntilScheduled > 0) {
  const confirmed = window.confirm(
    "Hủy trong vòng 15 phút sẽ không được hoàn tiền. Bạn có chắc chắn?"
  );
}

// Đổi thành:
if (minutesUntilScheduled < 15 && minutesUntilScheduled > 0) {
  const confirmed = window.confirm(
    "Hủy trong vòng 15 phút sẽ bị trừ phí hủy 30,000đ. Bạn có chắc chắn?"
  );
}
```

**Ví dụ: Thay đổi text "Đặt lịch đổi pin" thành "Đặt chỗ thay pin"**

**File:** `frontend/src/components/driver/BookBatteryPage.tsx`

```typescript
// Tìm tất cả text "Đặt lịch đổi pin"
// Dùng Find & Replace (Ctrl+H trong VS Code):
// Find: "Đặt lịch đổi pin"
// Replace: "Đặt chỗ thay pin"
```

**Frontend:** `frontend/src/components/driver/BookingHistory.tsx`
```typescript
// Tìm text "20,000đ" hoặc "20K"
// Đổi thành "30,000đ" hoặc "30K"
```

---

### 3. Thay Đổi Validation Rule (Frontend)

**Ví dụ: Thay đổi validation thời gian đặt chỗ từ 30 phút - 12 giờ thành 1 giờ - 24 giờ**

**File:** `frontend/src/components/driver/BookBatteryPage.tsx`

```typescript
// Tìm function validate hoặc trong handleSubmit (khoảng dòng 300-400)

// Hiện tại:
const minTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 phút
const maxTime = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 giờ

// Đổi thành:
const minTime = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 giờ
const maxTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 giờ

// Và đổi text hiển thị:
// Tìm: "30 phút - 12 giờ"
// Đổi thành: "1 giờ - 24 giờ"
```

**Ví dụ: Thêm validation "Không cho đặt nếu wallet < 50K"**

**File:** `frontend/src/components/driver/BookBatteryPage.tsx`

```typescript
// Trong handleSubmit, thêm sau khi check wallet balance:

if (!useSubscription) {
  if (walletBalance < price) {
    setError("Số dư không đủ, vui lòng nạp thêm");
    return;
  }
  
  // Thêm validation mới
  if (walletBalance < 50000) {
    setError("Số dư ví phải tối thiểu 50,000đ để đặt chỗ");
    return;
  }
}
```

---

### 4. Thêm Filter/Search Mới

**Ví dụ: Thêm filter theo trạm trong Booking History**

**File:** `frontend/src/components/driver/BookingHistory.tsx`

```typescript
// 1. Thêm state
const [stationFilter, setStationFilter] = useState<string>('all');
const [stations, setStations] = useState<any[]>([]);

// 2. Load stations (trong useEffect)
useEffect(() => {
  const loadStations = async () => {
    const res = await fetchWithAuth(API_ENDPOINTS.STATIONS.PUBLIC);
    const data = await res.json();
    if (data.success) {
      setStations(data.data.stations || []);
    }
  };
  loadStations();
}, []);

// 3. Thêm Select vào UI (sau search bar)
<Select value={stationFilter} onValueChange={setStationFilter}>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Tất cả trạm" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Tất cả trạm</SelectItem>
    {stations.map(station => (
      <SelectItem key={station.station_id} value={station.station_id}>
        {station.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// 4. Filter bookings
const filteredBookings = bookings.filter(booking => {
  if (stationFilter === 'all') return true;
  return booking.station?.station_id === stationFilter;
});
```

---

### 5. Thêm Hiển Thị Thông Tin Mới

**Ví dụ: Hiển thị "Thời gian còn lại" trong Booking History**

**File:** `frontend/src/components/driver/BookingHistory.tsx`

```typescript
// 1. Thêm function tính thời gian còn lại
const getTimeRemaining = (scheduledAt: string) => {
  const now = new Date();
  const scheduled = new Date(scheduledAt);
  const diff = scheduled.getTime() - now.getTime();
  
  if (diff < 0) return 'Đã quá giờ';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `Còn ${hours}h ${minutes}m`;
  }
  return `Còn ${minutes}m`;
};

// 2. Thêm vào render (trong card booking)
{booking.status === 'pending' || booking.status === 'confirmed' ? (
  <div className="text-sm text-slate-600">
    ⏰ {getTimeRemaining(booking.scheduled_at)}
  </div>
) : null}
```

---

### 6. Thay Đổi Format Hiển Thị

**Ví dụ: Thay đổi format số tiền từ "500,000đ" thành "500K"**

**File:** `frontend/src/utils/format.ts` hoặc trong component

```typescript
// Tìm function formatCurrency

// Hiện tại:
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// Đổi thành (format ngắn gọn):
export const formatCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}Mđ`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}Kđ`;
  }
  return `${amount}đ`;
};
```

**Ví dụ: Thay đổi format ngày từ "15/01/2025 14:00" thành "15 Tháng 1, 2025 - 14:00"**

**File:** `frontend/src/utils/format.ts`

```typescript
// Tìm function formatDate

// Hiện tại:
export const formatDate = (date: string) => {
  return new Date(date).toLocaleString('vi-VN');
};

// Đổi thành:
export const formatDate = (date: string) => {
  const d = new Date(date);
  const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()} - ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
};
```

---

### 7. Thêm Component Mới

**Ví dụ: Thêm component hiển thị booking statistics**

**File:** `frontend/src/components/driver/BookingHistory.tsx`

```typescript
// 1. Thêm state
const [stats, setStats] = useState({
  total: 0,
  pending: 0,
  confirmed: 0,
  completed: 0,
  cancelled: 0,
});

// 2. Tính stats từ bookings
useEffect(() => {
  const newStats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };
  setStats(newStats);
}, [bookings]);

// 3. Hiển thị stats (trước danh sách bookings)
<div className="grid grid-cols-5 gap-4 mb-6">
  <Card>
    <CardContent className="p-4 text-center">
      <div className="text-2xl font-bold">{stats.total}</div>
      <div className="text-sm text-slate-600">Tổng</div>
    </CardContent>
  </Card>
  <Card>
    <CardContent className="p-4 text-center">
      <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
      <div className="text-sm text-slate-600">Chờ xác nhận</div>
    </CardContent>
  </Card>
  {/* Tương tự cho các status khác */}
</div>
```

---

### 8. Thêm Check Validation Mới (Frontend)

**Ví dụ: Không cho đặt chỗ nếu vehicle chưa có current_battery**

**File:** `frontend/src/components/driver/BookBatteryPage.tsx`

```typescript
// Trong loadVehicles hoặc khi chọn vehicle

// 1. Load vehicle với current_battery
const loadVehicles = async () => {
  const res = await fetchWithAuth(API_ENDPOINTS.DRIVER.VEHICLES);
  const data = await res.json();
  if (data.success) {
    setVehicles(data.data.vehicles || []);
  }
};

// 2. Check khi chọn vehicle
const handleSelectVehicle = (vehicle: VehicleItem) => {
  if (!vehicle.current_battery) {
    setError("Xe chưa có pin. Vui lòng đổi pin lần đầu tại trạm trước khi đặt chỗ.");
    setSelectedVehicle(null);
    return;
  }
  setSelectedVehicle(vehicle);
};

// 3. Hoặc check trong handleSubmit
const handleSubmit = async () => {
  if (!selectedVehicle) {
    setError("Vui lòng chọn xe");
    return;
  }
  
  if (!selectedVehicle.current_battery) {
    setError("Xe chưa có pin. Vui lòng đổi pin lần đầu tại trạm trước khi đặt chỗ.");
    return;
  }
  
  // ... rest of submit
};
```

---

### 9. Thay Đổi Time Range (Frontend)

**Ví dụ: Thay đổi text và validation instant booking từ 15 phút thành 20 phút**

**File:** `frontend/src/components/driver/BookBatteryPage.tsx`

```typescript
// 1. Tìm text "15 phút" và đổi thành "20 phút"
// Dùng Find & Replace: "15 phút" → "20 phút"

// 2. Nếu có validation thời gian (trong handleSubmit)
const handleInstantBooking = () => {
  const now = new Date();
  const scheduledTime = new Date(now.getTime() + 20 * 60 * 1000); // 20 phút
  
  // ... rest of logic
};

// 3. Đổi text hiển thị
// Tìm: "Đặt ngay (15 phút)"
// Đổi thành: "Đặt ngay (20 phút)"
```

---

### 10. Thay Đổi Message Notification

**Ví dụ: Thay đổi message auto-cancel từ "10 phút" thành "15 phút"**

**File:** `frontend/src/components/driver/NotificationBell.tsx` hoặc `BookingHistory.tsx`

```typescript
// Khi nhận notification booking_cancelled, có thể format lại message

useEffect(() => {
  socket.on('notification', (data) => {
    if (data.type === 'booking_cancelled') {
      // Format lại message nếu cần
      const message = data.message.replace('10 phút', '15 phút');
      toast.error(message);
    }
  });
}, []);
```

**Lưu ý:** Message thực tế đến từ Backend, nhưng Frontend có thể format lại để hiển thị.

---

### 11. Thay Đổi Reminder Message (Frontend)

**Ví dụ: Format lại message reminder từ "30 phút" thành "1 giờ"**

**File:** `frontend/src/components/driver/NotificationBell.tsx`

```typescript
useEffect(() => {
  socket.on('notification', (data) => {
    if (data.type === 'booking_reminder') {
      // Format message: "sau 30 phút" → "sau 1 giờ"
      const message = data.message.replace('sau 30 phút', 'sau 1 giờ');
      toast.info(message);
    }
    if (data.type === 'booking_final_reminder') {
      // Format message: "sau 10 phút" → "sau 20 phút"
      const message = data.message.replace('sau 10 phút', 'sau 20 phút');
      toast.warning(message);
    }
  });
}, []);
```

---

### 12. Thêm Auto-Refresh

**Ví dụ: Auto-refresh Booking History mỗi 30 giây**

**File:** `frontend/src/components/driver/BookingHistory.tsx`

```typescript
// Thêm useEffect với setInterval

useEffect(() => {
  // Load lần đầu
  loadBookings();
  
  // Auto-refresh mỗi 30 giây
  const interval = setInterval(() => {
    loadBookings();
  }, 30000); // 30 giây
  
  // Cleanup
  return () => clearInterval(interval);
}, [statusFilter, searchQuery]);
```

**Ví dụ: Auto-refresh Wallet Balance khi có thay đổi**

**File:** `frontend/src/components/driver/Wallet.tsx`

```typescript
useEffect(() => {
  loadBalance();
  loadTransactions();
  
  // Listen event từ các component khác (khi có transaction mới)
  const handleRefresh = () => {
    loadBalance();
    loadTransactions();
  };
  
  window.addEventListener('refresh-wallet', handleRefresh);
  
  return () => {
    window.removeEventListener('refresh-wallet', handleRefresh);
  };
}, []);
```

---

### 13. Thêm Debounce cho Search

**Ví dụ: Debounce search trong Station Finding**

**File:** `frontend/src/components/driver/StationFinding.tsx`

```typescript
// Thêm debounce hook hoặc dùng useEffect

const [searchQuery, setSearchQuery] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

// Debounce search query (500ms)
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery);
  }, 500);
  
  return () => clearTimeout(timer);
}, [searchQuery]);

// Gọi API khi debouncedSearch thay đổi
useEffect(() => {
  if (debouncedSearch) {
    searchStations(debouncedSearch);
  } else {
    findNearbyPublicStations();
  }
}, [debouncedSearch]);
```

---

### 14. Thêm Loading State

**Ví dụ: Thêm skeleton loading cho Booking History**

**File:** `frontend/src/components/driver/BookingHistory.tsx`

```typescript
// Import Skeleton component
import { Skeleton } from '../ui/skeleton';

// Hiển thị skeleton khi loading
{loading ? (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <Card key={i}>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-4 w-48 mb-2" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    ))}
  </div>
) : (
  // Render bookings
)}
```

---

### 15. Thêm Error Handling

**Ví dụ: Hiển thị error message đẹp hơn**

**File:** `frontend/src/components/driver/BookBatteryPage.tsx`

```typescript
// Thay vì chỉ setError, có thể hiển thị toast

import { toast } from 'sonner'; // hoặc useToast hook

const handleSubmit = async () => {
  try {
    // ... submit logic
  } catch (error: any) {
    // Hiển thị toast error
    toast.error(error.message || "Có lỗi xảy ra, vui lòng thử lại");
    
    // Hoặc hiển thị error trong UI
    setError(error.message);
  }
};
```

---

### 16. Thêm Confirmation Dialog

**Ví dụ: Thay window.confirm bằng Dialog đẹp hơn**

**File:** `frontend/src/components/driver/BookingHistory.tsx`

```typescript
// Import AlertDialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

// Thay window.confirm
const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
const [bookingToCancel, setBookingToCancel] = useState<BookingItem | null>(null);

const handleCancelClick = (booking: BookingItem) => {
  setBookingToCancel(booking);
  setCancelDialogOpen(true);
};

// Render AlertDialog
<AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Xác nhận hủy đặt chỗ</AlertDialogTitle>
      <AlertDialogDescription>
        Bạn có chắc chắn muốn hủy đặt chỗ này?
        {minutesUntilScheduled < 15 && (
          <span className="text-red-600"> Hủy trong 15 phút sẽ không được hoàn tiền.</span>
        )}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Không</AlertDialogCancel>
      <AlertDialogAction onClick={handleConfirmCancel}>
        Có, hủy đặt chỗ
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 🎯 Tips Khi Demo

### 1. Chuẩn Bị Data
- Tạo sẵn 2-3 trạm với pin đầy đủ
- Tạo sẵn 2-3 vehicles cho driver
- Nạp sẵn tiền vào wallet (500K-1M)
- Tạo sẵn 1 subscription package active

### 2. Demo Flow Mượt
1. **Đăng nhập** → Show dashboard
2. **Tìm trạm** → Show GPS, khoảng cách
3. **Đặt lịch** → Show validation, lock wallet
4. **Xem lịch sử** → Show filter, cancel với fee
5. **Nạp tiền** → Show VNPay flow (có thể skip nếu không có internet)
6. **Đăng ký gói** → Show subscription logic

### 3. Câu Hỏi Thường Gặp

**Q: Tại sao phải lock wallet khi đặt chỗ?**
A: Để đảm bảo driver có đủ tiền khi đến trạm. Nếu không lock, driver có thể rút hết tiền sau khi đặt chỗ.

**Q: Tại sao không cho hủy trong 15 phút?**
A: Để tránh driver hủy booking vào phút cuối, gây lãng phí tài nguyên trạm (pin đã được reserve). Nếu cần hủy gấp, driver phải liên hệ staff trực tiếp.

**Q: Có thể thay đổi thành phí hủy thay vì không cho hủy không?**
A: Có, code đã có sẵn logic phí hủy 20K. Chỉ cần uncomment dòng 1394 trong `booking.controller.ts` và comment dòng 1389-1392.

**Q: Subscription có thể dùng cho tất cả loại pin không?**
A: Không, subscription có `battery_models` array, chỉ dùng được cho các model pin trong array đó.

**Q: Tại sao auto-cancel sau 10 phút?**
A: Để tránh driver không đến nhưng pin vẫn bị reserve, gây lãng phí tài nguyên.

**Q: Tại sao phải lock wallet khi đặt chỗ?**
A: Để đảm bảo driver có đủ tiền khi đến trạm. Nếu không lock, driver có thể rút hết tiền sau khi đặt chỗ, dẫn đến không đủ tiền thanh toán khi hoàn thành.

**Q: Subscription unlimited có nghĩa là gì?**
A: `swap_limit = null` nghĩa là unlimited (không giới hạn số lần đổi pin). Nếu `swap_limit = 10` nghĩa là chỉ được đổi tối đa 10 lần trong thời hạn gói.

**Q: Tại sao instant booking chỉ giữ pin 15 phút?**
A: Vì instant booking là đặt ngay, driver phải đến ngay. Nếu quá 15 phút không đến, pin sẽ được release để phục vụ khách khác.

**Q: Battery status "reserved" là gì?**
A: Pin đã được giữ cho một booking cụ thể. Pin này không thể được assign cho booking khác cho đến khi booking được completed hoặc cancelled.

**Q: Tại sao phải check battery compatibility?**
A: Mỗi xe chỉ tương thích với một số model pin nhất định. Không thể đổi pin không tương thích vì có thể gây hỏng xe hoặc pin.

**Q: Wallet lock và payment khác nhau như thế nào?**
A: 
- **Lock:** Giữ tiền trong ví, chưa trừ. Có thể release (hoàn tiền) nếu hủy booking.
- **Payment:** Trừ tiền thực sự từ ví. Không thể hoàn lại (trừ khi có refund riêng).

**Q: Tại sao có 2 loại booking: Scheduled và Instant?**
A: 
- **Scheduled:** Đặt trước 30 phút - 12 giờ, phù hợp cho người có kế hoạch.
- **Instant:** Đặt ngay trong 15 phút, phù hợp cho người cần gấp.

**Q: Proportional refund trong subscription là gì?**
A: Hoàn tiền theo tỷ lệ thời gian còn lại. VD: Gói 1M/30 ngày, dùng 10 ngày, còn 20 ngày → Hoàn 20/30 = 66.67% giá gói (trừ 3% phí hủy).

---

## 📝 Checklist Trước Khi Demo

- [ ] Test tất cả flow Driver
- [ ] Test flow Driver-Staff (đặt chỗ → xác nhận → hoàn thành)
- [ ] Chuẩn bị data mẫu
- [ ] Test VNPay (hoặc chuẩn bị giải thích nếu không có internet)
- [ ] Review lại business rules
- [ ] Chuẩn bị câu trả lời cho câu hỏi thường gặp
- [ ] Test trên mobile (nếu có)

---

**Chúc bạn demo thành công! 🚀**

