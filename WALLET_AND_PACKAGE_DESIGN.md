# Wallet và Package - Thiết kế và Logic Nghiệp vụ

## 📋 Mục lục
1. [Ý tưởng ban đầu](#ý-tưởng-ban-đầu)
2. [Phân tích logic nghiệp vụ](#phân-tích-logic-nghiệp-vụ)
3. [Đề xuất cải tiến](#đề-xuất-cải-tiến)
4. [Flow thanh toán](#flow-thanh-toán)
5. [Schema đề xuất](#schema-đề-xuất)
6. [Tích hợp MoMo QR](#tích-hợp-momo-qr)
7. [Chính sách hoàn tiền](#chính-sách-hoàn-tiền)

---

## 💡 Ý tưởng ban đầu

### Wallet (Ví điện tử)

**Mục đích:**
- Nạp tiền vào ví để thanh toán cho các dịch vụ
- Thanh toán cho đơn hàng đổi pin
- Thanh toán cho gói dịch vụ (subscription packages)

**Tính năng:**
1. **Nạp tiền bằng mã QR MoMo**
   - User quét QR code để nạp tiền
   - Tích hợp với MoMo Payment Gateway
   - Nạp tiền được cộng vào wallet balance

2. **Thanh toán đa mục đích**
   - Thanh toán cho đơn hàng đổi pin
   - Thanh toán cho gói dịch vụ (mua subscription)
   - Thanh toán online hoặc tại chỗ

3. **Hoàn tiền khi hủy đơn**
   - Khi user đã thanh toán đơn nhưng không đến đổi pin
   - Đơn sẽ được hủy tự động
   - Tiền được hoàn trả vào wallet

### Package (Gói dịch vụ)

**Mục đích:**
- Mua gói dịch vụ với số lượt đổi pin cố định
- Phân loại theo dung tích pin: 75kWh, 100kWh, etc.

**Tính năng:**
1. **Gói theo dung tích pin**
   - 75kWh: Cho xe nhỏ (Tesla Model 3, VinFast VF8)
   - 100kWh: Cho xe lớn (Tesla Model S, BYD Atto 3)
   - Có thể mở rộng thêm các dung tích khác

2. **Mua gói → Dùng nhiều lần**
   - User mua gói một lần
   - Có số lượt đổi pin cố định (ví dụ: 10 lượt/tháng)
   - Mỗi lần đổi pin sẽ trừ 1 lượt
   - Tiết kiệm hơn so với thanh toán từng lần

---

## 🔍 Phân tích logic nghiệp vụ

### 1. Wallet System

#### Điểm tốt ✅
- **Nạp tiền bằng QR MoMo**: Tiện lợi, phù hợp thị trường Việt Nam
- **Thanh toán đa mục đích**: Linh hoạt, có thể dùng cho nhiều mục đích
- **Hoàn tiền vào wallet**: Tăng trải nghiệm người dùng, không mất tiền

#### Vấn đề cần xử lý ⚠️

1. **Thời điểm thanh toán**
   - **Hiện tại**: Thanh toán khi complete booking (đã đổi pin xong)
   - **Vấn đề**: Khó hoàn tiền nếu user không đến
   - **Đề xuất**: Thanh toán khi confirm booking (trước khi đổi pin)

2. **Logic hoàn tiền**
   - Cần xác định rõ: Hoàn 100% hay trừ phí hủy?
   - Cần track payment để biết đã thanh toán chưa
   - Cần chính sách phí hủy rõ ràng

3. **QR Code MoMo**
   - Cần tích hợp MoMo Payment Gateway
   - Generate QR code động theo số tiền
   - Xử lý callback từ MoMo

### 2. Package System

#### Điểm tốt ✅
- **Phân loại theo dung tích pin**: Hợp lý, dễ quản lý
- **Mua gói → Dùng nhiều lần**: Tiết kiệm cho khách hàng
- **Có thời hạn và số lượt**: Kiểm soát được việc sử dụng

#### Đề xuất cải tiến 💡

1. **Cấu trúc gói dịch vụ**
   - Thêm field `battery_capacity` để phân loại theo dung tích
   - Thêm field `supported_models` để liệt kê các model hỗ trợ
   - Có thể thêm gói "Tất cả dung tích" (premium)

2. **Logic sử dụng gói**
   - Khi complete booking: Kiểm tra subscription trước
   - Nếu có lượt trong subscription → Dùng subscription
   - Nếu không có lượt → Trừ wallet
   - **Ưu tiên**: Subscription > Wallet

---

## 🚀 Đề xuất cải tiến

### 1. Flow thanh toán mới

### Flow 1: Thanh toán ngay khi booking (Khuyến nghị)
```
┌─────────────────┐
│  Create Booking │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Thanh toán     │ ← Driver có thể thanh toán ngay (tùy chọn)
│  (Tùy chọn)     │    - Wallet hoặc Subscription
└────────┬────────┘    - Payment status: "completed"
         │
         ▼
┌─────────────────┐
│ Confirm Booking │ ← Staff confirm (đã thanh toán rồi)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Complete Swap  │ ← Đã thanh toán rồi, chỉ đổi pin
└─────────────────┘
```

### Flow 2: Thanh toán khi confirm (Nếu chưa thanh toán)
```
┌─────────────────┐
│  Create Booking │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Confirm Booking │ ← Nếu chưa thanh toán → Thanh toán tại đây
│  + Thanh toán   │    - Bắt buộc phải thanh toán
└────────┬────────┘    - Payment status: "completed"
         │
         ▼
┌─────────────────┐
│  Complete Swap  │ ← Đã thanh toán rồi, chỉ đổi pin
└─────────────────┘
```

### Flow 3: Thanh toán trễ (Không khuyến nghị)
```
┌─────────────────┐
│  Create Booking │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Confirm Booking │ ← Chưa thanh toán (cho phép)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Complete Swap  │ ← Bắt buộc thanh toán trước khi complete
│  + Thanh toán   │    - Nếu chưa thanh toán → Không cho complete
└─────────────────┘
```

**Lợi ích:**
- **Linh hoạt**: Driver có thể thanh toán sớm hoặc muộn (tùy chọn)
- **Bắt buộc**: Phải thanh toán trước khi complete (đổi pin)
- **Dễ hoàn tiền**: Nếu đã thanh toán nhưng chưa đổi pin → Hoàn tiền dễ dàng
- **Tránh mất pin**: User không đến → Tự động hủy và hoàn tiền

### 2. Logic hoàn tiền

```typescript
// Khi hủy booking đã thanh toán
if (booking.payment_status === 'completed') {
  const refundAmount = calculateRefund(booking);
  // refundAmount = fullAmount - cancellationFee
  await refundToWallet(userId, refundAmount);
}
```

**Chính sách hoàn tiền đề xuất:**
- **Hủy trước 1 giờ**: Hoàn 100%
- **Hủy trong 1 giờ**: Hoàn 80% (phí hủy 20%)
- **Hủy trong 15 phút**: Hoàn 50% (phí hủy 50%)
- **Không đến (no-show)**: Không hoàn tiền

### 3. Cấu trúc Package đề xuất

```typescript
ServicePackage {
  // Basic info
  package_id: string
  name: "Gói 75kWh - 10 lượt/tháng"
  description: "Gói dịch vụ cho xe 75kWh, 10 lượt đổi pin trong 30 ngày"
  
  // Battery specs (NEW)
  battery_capacity: "75kWh"  // Dung tích pin
  supported_models: ["Tesla Model 3", "VinFast VF8"] // Model hỗ trợ
  
  // Usage limits
  swap_limit: 10  // Số lượt đổi pin
  duration_days: 30  // Thời hạn gói (ngày)
  
  // Pricing
  price: 500000  // Giá gói
  is_active: true
}
```

**Ví dụ các gói:**
- **Gói 75kWh - 10 lượt**: 500,000đ (50,000đ/lượt)
- **Gói 75kWh - 20 lượt**: 900,000đ (45,000đ/lượt) - Tiết kiệm 10%
- **Gói 100kWh - 10 lượt**: 700,000đ (70,000đ/lượt)
- **Gói Premium - Tất cả dung tích**: 1,200,000đ

---

## 📊 Schema đề xuất

### 1. Wallet Schema (Đã có sẵn)

```prisma
model Wallet {
  wallet_id  String   @id @default(uuid()) @db.Uuid
  user_id    String   @unique @db.Uuid
  balance    Decimal  @default(0) @db.Decimal(10, 2)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  user       User     @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
}
```

### 2. TopUpPackage Schema (Đã có sẵn)

```prisma
model TopUpPackage {
  package_id    String    @id @default(uuid()) @db.Uuid
  name          String    @db.VarChar(100)
  description   String?
  topup_amount  Decimal   @db.Decimal(10, 2)
  bonus_amount  Decimal   @db.Decimal(10, 2)
  actual_amount Decimal   @db.Decimal(10, 2)
  is_active     Boolean   @default(true)
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  payments      Payment[]
}
```

### 3. ServicePackage Schema (Cần cập nhật)

```prisma
model ServicePackage {
  package_id      String             @id @default(uuid()) @db.Uuid
  name            String             @db.VarChar(100)
  description     String?
  
  // NEW: Battery specs
  battery_capacity String?           @db.VarChar(20)  // "75kWh", "100kWh", "all"
  supported_models Json?             // ["Tesla Model 3", "VinFast VF8"]
  
  // Usage limits
  swap_limit      Int?               // Số lượt đổi pin
  duration_days   Int                // Thời hạn gói (ngày)
  
  // Pricing
  price           Decimal            @db.Decimal(10, 2)
  is_active       Boolean            @default(true)
  
  created_at     DateTime           @default(now())
  updated_at      DateTime           @updatedAt
  subscriptions  UserSubscription[]
}
```

### 4. Payment Schema (Cần cập nhật)

```prisma
model Payment {
  payment_id          String            @id @default(uuid()) @db.Uuid
  transaction_id      String?           @unique @db.Uuid
  subscription_id     String?           @db.Uuid
  topup_package_id    String?           @db.Uuid
  booking_id          String?           @db.Uuid  // NEW: Link trực tiếp với booking
  user_id             String            @db.Uuid
  amount              Decimal           @db.Decimal(10, 2)
  payment_method      PaymentMethod     // "wallet", "vnpay", "momo", "cash"
  payment_status      PaymentStatus     @default(pending)
  payment_gateway_ref String?           @db.VarChar(100)
  paid_at             DateTime?
  refund_amount       Decimal?          @db.Decimal(10, 2)  // NEW: Số tiền đã hoàn
  refunded_at         DateTime?         // NEW: Thời điểm hoàn tiền
  created_at          DateTime          @default(now())
  
  // Relations
  subscription        UserSubscription?
  topup_package       TopUpPackage?
  transaction         Transaction?
  booking             Booking?         // NEW
  user                User
}
```

### 5. Booking Schema (Cần cập nhật)

```prisma
model Booking {
  booking_id             String        @id @default(uuid()) @db.Uuid
  booking_code           String        @unique @db.VarChar(20)
  user_id                String        @db.Uuid
  vehicle_id             String        @db.Uuid
  station_id             String        @db.Uuid
  battery_model          String        @db.VarChar(50)
  scheduled_at           DateTime
  status                 BookingStatus @default(pending)
  
  // NEW: Payment tracking
  payment_status         PaymentStatus @default(pending)  // "pending", "completed", "refunded"
  payment_id             String?       @db.Uuid  // Link với Payment
  paid_at                DateTime?     // Thời điểm thanh toán
  
  checked_in_at          DateTime?
  checked_in_by_staff_id String?       @db.Uuid
  pin_code               String?       @db.VarChar(6)
  pin_verified_at        DateTime?
  is_instant             Boolean       @default(false)
  notes                  String?
  created_at             DateTime      @default(now())
  
  // Relations
  payment                Payment?      // NEW
  checked_in_by_staff    User?
  station                Station
  user                   User
  vehicle                Vehicle
  transaction            Transaction?
}
```

---

## 💳 Tích hợp MoMo QR

### 1. Generate QR Code

```typescript
// Backend: Generate MoMo QR Code
async function generateMoMoQR(amount: number, userId: string) {
  const orderId = `TOPUP_${Date.now()}_${userId}`;
  
  const response = await momoAPI.createQR({
    amount,
    orderId,
    orderInfo: `Nạp tiền vào ví ${amount.toLocaleString('vi-VN')}đ`,
    returnUrl: `${FRONTEND_URL}/wallet/topup/success`,
    notifyUrl: `${BACKEND_URL}/api/payments/momo/callback`
  });
  
  // Save payment record
  await prisma.payment.create({
    data: {
      user_id: userId,
      amount,
      payment_method: 'momo',
      payment_status: 'pending',
      payment_gateway_ref: orderId,
      // ... other fields
    }
  });
  
  return {
    qrCode: response.qrCodeUrl,
    qrCodeData: response.qrCodeData,  // Base64 image
    orderId: response.orderId,
    expireTime: response.expireTime
  };
}
```

### 2. Handle MoMo Callback

```typescript
// Backend: Handle MoMo callback
async function handleMoMoCallback(req: Request, res: Response) {
  const { orderId, resultCode, amount } = req.body;
  
  if (resultCode === '0') {
    // Payment successful
    const payment = await prisma.payment.findFirst({
      where: { payment_gateway_ref: orderId }
    });
    
    if (payment && payment.payment_status === 'pending') {
      // Update wallet balance
      await prisma.wallet.upsert({
        where: { user_id: payment.user_id },
        update: {
          balance: { increment: amount }
        },
        create: {
          user_id: payment.user_id,
          balance: amount
        }
      });
      
      // Update payment status
      await prisma.payment.update({
        where: { payment_id: payment.payment_id },
        data: {
          payment_status: 'completed',
          paid_at: new Date()
        }
      });
    }
  }
  
  res.status(200).json({ resultCode: '0' });
}
```

### 3. Frontend: Display QR Code

```typescript
// Frontend: Display QR Code
const TopUpModal = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const handleGenerateQR = async (packageId: string) => {
    const response = await walletService.generateMoMoQR({
      package_id: packageId
    });
    
    setQrCode(response.data.qrCodeData);
    setOrderId(response.data.orderId);
    
    // Poll for payment status
    pollPaymentStatus(response.data.orderId);
  };
  
  return (
    <div>
      {qrCode && (
        <div>
          <img src={`data:image/png;base64,${qrCode}`} alt="MoMo QR Code" />
          <p>Quét mã QR bằng ứng dụng MoMo để thanh toán</p>
        </div>
      )}
    </div>
  );
};
```

---

## 🔄 Chính sách hoàn tiền

### 1. Logic hoàn tiền

```typescript
// Calculate refund amount based on cancellation time
function calculateRefund(booking: Booking): number {
  const scheduledTime = new Date(booking.scheduled_at);
  const now = new Date();
  const minutesUntilScheduled = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
  
  const fullAmount = Number(booking.transaction?.amount || 0);
  
  // Chính sách hoàn tiền
  if (minutesUntilScheduled > 60) {
    // Hủy trước 1 giờ: Hoàn 100%
    return fullAmount;
  } else if (minutesUntilScheduled > 15) {
    // Hủy trong 1 giờ: Hoàn 80% (phí hủy 20%)
    return fullAmount * 0.8;
  } else if (minutesUntilScheduled > 0) {
    // Hủy trong 15 phút: Hoàn 50% (phí hủy 50%)
    return fullAmount * 0.5;
  } else {
    // Không đến (no-show): Không hoàn tiền
    return 0;
  }
}

// Refund to wallet
async function refundToWallet(userId: string, amount: number, paymentId: string) {
  await prisma.$transaction(async (tx) => {
    // Update wallet balance
    await tx.wallet.upsert({
      where: { user_id: userId },
      update: {
        balance: { increment: amount }
      },
      create: {
        user_id: userId,
        balance: amount
      }
    });
    
    // Update payment record
    await tx.payment.update({
      where: { payment_id: paymentId },
      data: {
        refund_amount: amount,
        refunded_at: new Date()
      }
    });
    
    // Create refund transaction record
    await tx.transaction.create({
      data: {
        transaction_code: `REFUND_${Date.now()}`,
        user_id: userId,
        amount: amount,
        type: 'REFUND',
        status: 'COMPLETED',
        description: `Hoàn tiền đơn hàng ${booking.booking_code}`
      }
    });
  });
}
```

### 2. Auto-cancel và hoàn tiền

```typescript
// Auto-cancel expired bookings and refund
async function autoCancelAndRefund() {
  const expiredBookings = await prisma.booking.findMany({
    where: {
      status: { in: ['pending', 'confirmed'] },
      payment_status: 'completed',
      scheduled_at: { lt: new Date() }  // Đã quá giờ hẹn
    },
    include: {
      payment: true,
      transaction: true
    }
  });
  
  for (const booking of expiredBookings) {
    // Calculate refund (no-show = 0%)
    const refundAmount = 0;  // Không hoàn tiền cho no-show
    
    // Update booking status
    await prisma.booking.update({
      where: { booking_id: booking.booking_id },
      data: { status: 'cancelled' }
    });
    
    // Send notification
    await notificationService.sendNotification({
      userId: booking.user_id,
      type: 'booking_cancelled',
      title: 'Đơn hàng đã bị hủy',
      message: `Đơn hàng ${booking.booking_code} đã bị hủy do không đến đổi pin.`
    });
  }
}
```

---

## 📝 Tóm tắt

### Wallet System
- ✅ Nạp tiền bằng QR MoMo
- ✅ Thanh toán cho đơn hàng và gói dịch vụ
- ✅ Hoàn tiền khi hủy đơn (theo chính sách)
- ⚠️ Cần thanh toán khi confirm booking (không phải complete)
- ⚠️ Cần tích hợp MoMo Payment Gateway

### Package System
- ✅ Phân loại theo dung tích pin (75kWh, 100kWh)
- ✅ Mua gói → Dùng nhiều lần
- ✅ Ưu tiên subscription trước wallet
- ⚠️ Cần cập nhật schema để hỗ trợ battery_capacity và supported_models

### Flow thanh toán (Linh hoạt)
1. **User tạo booking** → Status: "pending", Payment: "pending"
2. **User thanh toán** (Tùy chọn - có thể thanh toán ngay hoặc sau):
   - Thanh toán bằng Wallet hoặc Subscription
   - Payment status: "completed"
   - Booking status: vẫn "pending" (chờ staff confirm)
3. **Staff confirm booking**:
   - Nếu đã thanh toán → Chỉ confirm
   - Nếu chưa thanh toán → Bắt buộc thanh toán trước khi confirm
   - Status: "confirmed"
4. **User đến đổi pin** → Staff complete booking (đã thanh toán rồi)
5. **Nếu hủy** → Hoàn tiền theo chính sách (nếu đã thanh toán)

**Lưu ý:**
- Driver có thể thanh toán sớm (ngay khi booking) hoặc muộn (khi confirm)
- Bắt buộc phải thanh toán trước khi complete (đổi pin)
- Nếu đã thanh toán nhưng chưa đổi pin → Dễ hoàn tiền

---

## 🔗 Liên kết

- [Wallet Service](./frontend/src/services/wallet.service.ts)
- [TopUpPackage Service](./frontend/src/services/topup-package.service.ts)
- [Wallet Component](./frontend/src/components/driver/Wallet.tsx)
- [TopUpModal Component](./frontend/src/components/driver/TopUpModal.tsx)
- [Wallet Controller](./backend/src/controllers/wallet.controller.ts)
- [Booking Controller](./backend/src/controllers/booking.controller.ts)

---

**Cập nhật lần cuối:** 2025-01-XX
**Người thiết kế:** AI Assistant + User
**Trạng thái:** Đang phát triển

