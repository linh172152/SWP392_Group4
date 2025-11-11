# 🧪 Driver Frontend - Test Plan & Validation Checklist

## 📋 Mục đích
Tài liệu này liệt kê tất cả các test cases và validation checklist cho Driver Frontend, đảm bảo tất cả flows hoạt động đúng theo logic nghiệp vụ.

---

## 🔐 1. Authentication & Authorization Flow

### 1.1 Login Flow
- [ ] **TC-001**: Đăng nhập thành công với email/password
  - [ ] Nhập đúng email và password → Đăng nhập thành công
  - [ ] Redirect đến `/driver/vehicles` hoặc dashboard
  - [ ] Token được lưu vào localStorage
  - [ ] User info được hiển thị đúng

- [ ] **TC-002**: Đăng nhập thất bại
  - [ ] Nhập sai email/password → Hiển thị error message
  - [ ] Nhập email không tồn tại → Hiển thị error message
  - [ ] Nhập password sai → Hiển thị error message
  - [ ] Rate limiting (429) → Hiển thị "Bạn đã đăng nhập quá nhiều lần"

- [ ] **TC-003**: Timeout handling
  - [ ] BE không phản hồi trong 10 giây → Hiển thị timeout error
  - [ ] Loading state được reset sau timeout

### 1.2 Google OAuth Flow
- [ ] **TC-004**: Đăng nhập bằng Google
  - [ ] Click "Đăng nhập bằng Google" → Redirect đến Google
  - [ ] Chọn tài khoản Google → Redirect về app
  - [ ] Đăng nhập thành công → Token được lưu

---

## 🚗 2. Vehicle Management Flow

### 2.1 Xem danh sách xe
- [ ] **TC-005**: Hiển thị danh sách xe
  - [ ] Load trang `/driver/vehicles` → Hiển thị danh sách xe
  - [ ] Mỗi xe hiển thị: make, model, license_plate, battery_model
  - [ ] Có thể thêm/xóa/sửa xe

### 2.2 Thêm/Xóa/Sửa xe
- [ ] **TC-006**: Thêm xe mới
  - [ ] Nhập đầy đủ thông tin → Thêm thành công
  - [ ] Validation: license_plate, battery_model bắt buộc

- [ ] **TC-007**: Xóa xe
  - [ ] Click xóa → Confirm → Xóa thành công
  - [ ] Xe bị xóa khỏi danh sách

---

## 📍 3. Station & Booking Flow

### 3.1 Xem danh sách trạm
- [ ] **TC-008**: Hiển thị danh sách trạm
  - [ ] Load trang `/driver/stations` → Hiển thị danh sách trạm
  - [ ] Mỗi trạm hiển thị: name, address, rating, distance
  - [ ] Có thể click vào trạm để xem chi tiết

### 3.2 Xem chi tiết trạm
- [ ] **TC-009**: Chi tiết trạm
  - [ ] Click vào trạm → Hiển thị chi tiết
  - [ ] Hiển thị: name, address, rating, operating hours
  - [ ] Hiển thị danh sách pin khả dụng (chỉ pin tương thích với xe của driver)
  - [ ] Có nút "Đặt pin" để chuyển đến booking page

### 3.3 Đặt pin (BookBatteryPage)
- [ ] **TC-010**: Chọn loại pin và xe
  - [ ] Load trang `/driver/station/:id/book-battery` → Hiển thị danh sách pin
  - [ ] Chỉ hiển thị pin tương thích với xe của driver
  - [ ] Chọn loại pin → Hiển thị giá và thông tin pin
  - [ ] Chọn xe tương thích → Hiển thị thông tin xe

- [ ] **TC-011**: Hiển thị giá và subscription preview
  - [ ] Chọn pin → Hiển thị giá từ pricing list
  - [ ] Nếu có subscription active → Hiển thị "Gói dịch vụ: [Tên] • Còn X lần" (LUÔN hiển thị, kể cả không áp dụng)
  - [ ] Nếu subscription áp dụng → Hiển thị "Tổng cộng (dự kiến): Miễn phí" (màu xanh)
  - [ ] Nếu không có subscription → Hiển thị giá đầy đủ
  - [ ] Hiển thị badge xanh khi subscription áp dụng: "✓ Gói '[Tên]' sẽ áp dụng cho loại pin này"

- [ ] **TC-011A**: Checkbox chọn dùng/không dùng subscription
  - [ ] Nếu có subscription áp dụng được → Hiển thị checkbox "Sử dụng gói '[Tên]' cho lần đổi pin này"
  - [ ] Checkbox mặc định được bật (checked) nếu subscription áp dụng được
  - [ ] Driver có thể tắt checkbox → "Tổng cộng (dự kiến)" hiển thị giá từ ví thay vì "Miễn phí"
  - [ ] Khi bật checkbox → Hiển thị "✓ Gói sẽ được áp dụng → Miễn phí"
  - [ ] Khi tắt checkbox → Hiển thị "⚠️ Sẽ thanh toán từ ví: X₫"
  - [ ] Giá "Tổng cộng (dự kiến)" cập nhật real-time theo checkbox
  - [ ] `use_subscription` parameter được gửi đúng theo lựa chọn của driver (true/false)

- [ ] **TC-012**: Wallet balance warning
  - [ ] Nếu wallet balance < estimated price → Hiển thị cảnh báo màu vàng
  - [ ] Nếu wallet balance >= estimated price → Hiển thị thông tin màu xanh
  - [ ] Chỉ hiển thị khi không có subscription áp dụng HOẶC driver tắt checkbox subscription

- [ ] **TC-012A**: Refresh pin real-time
  - [ ] Danh sách pin tự động refresh mỗi 10 giây
  - [ ] Số lượng pin được cập nhật khi driver khác đặt đơn
  - [ ] Hiển thị số pin đang được reserve: "X pin khả dụng (Y đang được giữ)"
  - [ ] Console log cảnh báo khi số pin thay đổi: "⚠️ [BATTERY] Pin [Model] thay đổi: X → Y"
  - [ ] Refresh không block UI (chạy background)

- [ ] **TC-012B**: Refresh pin trước khi đặt
  - [ ] Trước khi submit booking → Tự động refresh danh sách pin
  - [ ] Kiểm tra lại số pin khả dụng sau khi refresh
  - [ ] Nếu hết pin sau khi refresh → Hiển thị error: "Có thể pin vừa được đặt bởi người khác"
  - [ ] Không cho phép đặt nếu không còn pin khả dụng

- [ ] **TC-013**: Chọn thời gian hẹn
  - [ ] Chọn thời gian từ datetime picker
  - [ ] Validation: Tối thiểu 30 phút từ bây giờ
  - [ ] Validation: Tối đa 12 giờ từ bây giờ
  - [ ] Hiển thị thời gian đã chọn dưới dạng dễ đọc

- [ ] **TC-014**: Tạo booking thành công
  - [ ] Chọn đầy đủ: pin, xe, thời gian → Click "Xác nhận đặt chỗ"
  - [ ] Loading spinner hiển thị (BatteryLoading với variant charging)
  - [ ] Booking thành công → Hiển thị success message với hold_summary:
    - [ ] Nếu dùng subscription: "Gói '[Tên]' sẽ được sử dụng. Còn X lượt sau giao dịch này"
    - [ ] Nếu dùng ví: "Đã giữ X₫ từ ví của bạn. Số dư sau: Y₫"
  - [ ] Response chứa `hold_summary` với thông tin chi tiết
  - [ ] Redirect đến `/driver/bookings` hoặc hiển thị booking code
  - [ ] Booking xuất hiện trong lịch sử với status "pending"
  - [ ] `use_subscription` parameter được gửi đúng theo lựa chọn của driver (true/false từ checkbox)
  - [ ] Sau khi đặt thành công → Tự động refresh danh sách pin để cập nhật số lượng
  - [ ] Số pin khả dụng giảm đi 1 (pin đã được reserve)

- [ ] **TC-015**: Tạo booking thất bại
  - [ ] Thiếu thông tin → Hiển thị error message
  - [ ] Pin không tương thích → Hiển thị error message
  - [ ] Không còn pin khả dụng sau khi refresh → Hiển thị error: "Có thể pin vừa được đặt bởi người khác. Vui lòng chọn loại pin khác hoặc thử lại sau."
  - [ ] Thời gian không hợp lệ → Hiển thị error message
  - [ ] Error display có retry button
  - [ ] Pin bị reserve bởi booking khác (409 conflict) → Hiển thị error message rõ ràng

### 3.4 Instant Booking (Đổi pin ngay)
- [ ] **TC-016**: Instant booking
  - [ ] Click "Đổi pin ngay" → Tạo booking với scheduled_at = now + 15 phút
  - [ ] Validation: Phải có pin sẵn sàng (status = full)
  - [ ] Booking thành công → Status = "pending"
  - [ ] Pin được reserve (status = reserved) và giữ trong 15 phút

---

## 📅 4. Booking History Flow

### 4.1 Xem lịch sử đặt chỗ
- [ ] **TC-017**: Hiển thị danh sách booking
  - [ ] Load trang `/driver/bookings` → Hiển thị danh sách booking
  - [ ] Skeleton loading hiển thị khi đang load
  - [ ] Mỗi booking hiển thị: trạm, xe, thời gian, status, giá
  - [ ] Response chứa `pricing_preview` cho mỗi booking

- [ ] **TC-018**: Filter và search
  - [ ] Filter theo status (all, pending, confirmed, completed, cancelled)
  - [ ] Search theo trạm, xe, hoặc mã booking
  - [ ] Pagination hoạt động đúng

### 4.2 Status Badge
- [ ] **TC-019**: Hiển thị status đúng
  - [ ] `pending`: "Chờ xác nhận" (màu vàng/amber)
  - [ ] `confirmed`: "Đã xác nhận - Vui lòng đến trạm" (màu xanh)
  - [ ] `completed`: "Hoàn tất" (màu xanh lá) + Hiển thị số tiền đã trả
  - [ ] `cancelled`: "Đã hủy" (màu đỏ)

### 4.3 Payment Status
- [ ] **TC-020**: Hiển thị payment status
  - [ ] Booking `pending/confirmed`: "Chưa thanh toán" hoặc giá ước tính (~X đ)
  - [ ] Booking `completed` với amount = 0: "Miễn phí" (có badge "Miễn phí - Gói dịch vụ")
  - [ ] Booking `completed` với amount > 0: Hiển thị số tiền đã trả (X đ)
  - [ ] Booking `cancelled`: Không hiển thị giá

### 4.4 Cancel Booking
- [ ] **TC-021**: Hủy booking trước 15 phút
  - [ ] Booking có status `pending` hoặc `confirmed`
  - [ ] Còn > 15 phút đến giờ hẹn → Nút "Hủy đặt chỗ" enabled
  - [ ] Click hủy → Confirm dialog → Hủy thành công
  - [ ] Booking status chuyển thành `cancelled`
  - [ ] Response chứa `cancellation_fee`, `wallet_forfeited_amount`, `wallet_balance`
  - [ ] Tài nguyên đã giữ được giải phóng (pin, subscription, ví)
  - [ ] Hiển thị warning nếu < 30 phút: "Còn X phút - Hủy ngay nếu cần"

- [ ] **TC-022**: Hủy booking trong 15 phút (should fail)
  - [ ] Còn < 15 phút đến giờ hẹn → Nút "Hủy đặt chỗ" disabled
  - [ ] Hiển thị warning: "⚠️ Còn X phút - Không thể hủy"
  - [ ] Nếu vẫn gọi API → BE trả về error: "Cannot cancel booking within 15 minutes"
  - [ ] Error message được hiển thị rõ ràng

- [ ] **TC-023**: Hủy booking đã quá giờ hẹn
  - [ ] Booking đã quá giờ hẹn → Nút hủy disabled
  - [ ] Hiển thị: "Không thể hủy đặt chỗ đã quá giờ hẹn"

### 4.5 Hold Summary Display
- [ ] **TC-024**: Hiển thị thông tin giữ chỗ (hold_summary)
  - [ ] Booking status = `pending` hoặc `confirmed` → Hiển thị card "Thông tin giữ chỗ"
  - [ ] Nếu dùng subscription: Hiển thị "Gói '[Tên]' đang được giữ", số lượt còn lại, thời gian hết hạn
  - [ ] Nếu dùng ví: Hiển thị "Đã giữ X₫ từ ví", số dư sau, thời gian hết hạn
  - [ ] Hiển thị `hold_expires_at` nếu có
  - [ ] Card có màu xanh nhạt (bg-blue-50/50) với icon Package

### 4.6 Export Confirmation Voucher
- [ ] **TC-025**: Xuất phiếu xác nhận
  - [ ] Booking status = `confirmed` hoặc `in_progress`
  - [ ] Click "Xuất phiếu xác nhận" → Mở popup/print với booking code và thông tin

---

## 💳 5. Wallet Flow

### 5.1 Xem số dư ví
- [ ] **TC-026**: Hiển thị wallet balance
  - [ ] Load trang `/driver/wallet` → Hiển thị số dư ví
  - [ ] Format số tiền đúng (X.XXX.XXX đ)

### 5.2 Nạp tiền
- [ ] **TC-027**: Nạp tiền bằng cash
  - [ ] Chọn gói nạp → Nhập số tiền → Nạp thành công
  - [ ] Wallet balance tăng lên
  - [ ] Transaction được ghi vào lịch sử với type = "TOPUP"

- [ ] **TC-028**: Nạp tiền online (VNPay)
  - [ ] Chọn gói nạp → Click "Nạp qua VNPay"
  - [ ] Redirect đến VNPay
  - [ ] Thanh toán thành công → Redirect về → Wallet balance tăng

### 5.3 Xem lịch sử giao dịch ví
- [ ] **TC-029**: Transaction history
  - [ ] Hiển thị danh sách transactions từ Payment model
  - [ ] Phân loại: SWAP (thanh toán đổi pin), SUBSCRIPTION (mua gói), TOPUP (nạp tiền)
  - [ ] Hiển thị đầy đủ: thời gian, số tiền, loại giao dịch, trạng thái

---

## 📦 6. Subscription Flow

### 6.1 Xem danh sách gói dịch vụ
- [ ] **TC-030**: Hiển thị packages
  - [ ] Load trang `/driver/subscriptions` → Hiển thị danh sách packages
  - [ ] Mỗi package hiển thị: name, price, duration, swap_limit, battery_capacity_kwh
  - [ ] Format giá đúng với `formatCurrency`

### 6.2 Mua gói dịch vụ
- [ ] **TC-031**: Mua package thành công
  - [ ] Chọn package → Click "Mua ngay"
  - [ ] Validation: Wallet balance >= package price
  - [ ] Thanh toán thành công → Wallet balance giảm
  - [ ] Subscription được tạo với status = "active"
  - [ ] Hiển thị thông tin subscription: remaining_swaps, end_date

- [ ] **TC-032**: Mua package thất bại - Không đủ tiền
  - [ ] Wallet balance < package price → Hiển thị error: "Insufficient wallet balance"
  - [ ] Tự động redirect đến wallet sau 2 giây (hoặc hiển thị nút "Nạp tiền")

- [ ] **TC-033**: Mua package - Đã có subscription active
  - [ ] Đã có subscription active cho package này → Hiển thị error
  - [ ] Không cho mua lại

### 6.3 Booking với subscription
- [ ] **TC-034**: Booking được miễn phí nhờ subscription
  - [ ] Có subscription active và tương thích với loại pin
  - [ ] Checkbox subscription mặc định được bật
  - [ ] Tạo booking với `use_subscription: true` (từ checkbox) → Preview hiển thị "Miễn phí"
  - [ ] Response chứa `hold_summary` với `use_subscription: true` và `subscription_name`
  - [ ] Subscription được lock (giữ 1 lượt) khi tạo booking
  - [ ] Staff complete booking → amount = 0
  - [ ] `remaining_swaps` bị trừ 1 (nếu không unlimited) - chỉ khi staff complete
  - [ ] Hiển thị "Miễn phí - Gói dịch vụ" trong booking history
  - [ ] Hold summary hiển thị trong booking history với thông tin subscription

- [ ] **TC-034A**: Booking với subscription nhưng driver chọn không dùng
  - [ ] Có subscription active và tương thích với loại pin
  - [ ] Driver tắt checkbox subscription → Preview hiển thị giá từ ví
  - [ ] Tạo booking với `use_subscription: false` → Wallet amount được lock
  - [ ] Response chứa `hold_summary` với `use_subscription: false` và `wallet_amount_locked`
  - [ ] Subscription KHÔNG bị lock (vì driver chọn không dùng)
  - [ ] Staff complete booking → amount > 0 (trừ từ ví)

- [ ] **TC-035**: Subscription không áp dụng
  - [ ] Subscription không tương thích với loại pin → Áp dụng giá thường, `use_subscription: false`
  - [ ] Subscription đã hết lượt → Áp dụng giá thường, `use_subscription: false`
  - [ ] Subscription đã hết hạn → Áp dụng giá thường, `use_subscription: false`
  - [ ] Wallet amount được lock thay vì subscription

### 6.4 Hủy subscription
- [ ] **TC-036**: Cancel subscription - Chưa sử dụng
  - [ ] Click "Hủy gói" → Confirm → Hủy thành công
  - [ ] Subscription status chuyển thành "cancelled"
  - [ ] Response chứa `refund` info: `payment_id`, `amount`, `payment_type: "PACKAGE_REFUND"`
  - [ ] Wallet balance được hoàn lại (tăng lên)
  - [ ] Không còn áp dụng cho booking mới
  - [ ] Hiển thị thông báo: "Subscription cancelled and refunded"

- [ ] **TC-037**: Cancel subscription - Đã sử dụng
  - [ ] Subscription đã được sử dụng (có booking completed) → Không thể hủy
  - [ ] Hiển thị error: "Subscription has already been used and cannot be refunded"

- [ ] **TC-038**: Cancel subscription - Đang bị lock bởi booking
  - [ ] Subscription đang được lock bởi booking pending/confirmed → Không thể hủy
  - [ ] Hiển thị error: "Subscription is currently reserved for booking [code]. Please cancel that booking first."

---

## 🔔 7. Notification Flow

### 7.1 Real-time notifications
- [ ] **TC-039**: Nhận thông báo
  - [ ] Notification bell hiển thị số thông báo chưa đọc
  - [ ] Polling mỗi 10 giây để lấy notifications mới
  - [ ] Toast notification khi có thông báo mới

### 7.2 Các loại thông báo
- [ ] **TC-040**: Payment success notification
  - [ ] Staff complete booking → Nhận thông báo "Đã thanh toán X đ từ ví"
  - [ ] Có nút "Xem hóa đơn" → Navigate đến `/driver/transactions`

- [ ] **TC-041**: Booking confirmed notification
  - [ ] Booking được confirm → Nhận thông báo "Đặt chỗ thành công"
  - [ ] Có nút "Chi tiết" → Navigate đến `/driver/bookings` và highlight booking

- [ ] **TC-042**: Booking reminder notification
  - [ ] Nhận thông báo nhắc nhở trước giờ hẹn
  - [ ] Hiển thị "Còn X phút" và "Y phút trước"
  - [ ] Có nút "Xem đường đi" → Navigate đến station detail

- [ ] **TC-043**: Booking cancelled notification
  - [ ] Booking bị hủy → Nhận thông báo "Đã hủy đặt chỗ"
  - [ ] Chỉ hiển thị "Y phút trước" (không có "Còn X phút")

- [ ] **TC-044**: Topup success notification
  - [ ] Nạp tiền thành công → Nhận thông báo "Nạp tiền thành công"

### 7.3 Filter notifications
- [ ] **TC-045**: Filter notifications
  - [ ] Click filter dropdown → Hiển thị các options
  - [ ] Filter theo type → Chỉ hiển thị notifications đã chọn
  - [ ] Background filter là màu trắng (dễ đọc)

---

## 📊 8. Transaction History Flow

### 8.1 Xem lịch sử giao dịch
- [ ] **TC-046**: Hiển thị transactions
  - [ ] Load trang `/driver/transactions` → Hiển thị danh sách transactions
  - [ ] Mỗi transaction hiển thị: transaction_code, amount, payment_status, swap_at
  - [ ] Filter theo payment_status (all, completed, pending, failed)
  - [ ] Phân loại: SWAP (thanh toán đổi pin) → Hiển thị "Miễn phí" nếu amount = 0

### 8.2 Chi tiết transaction
- [ ] **TC-047**: Xem chi tiết transaction
  - [ ] Click vào transaction → Hiển thị chi tiết đầy đủ
  - [ ] Hiển thị: trạm, thời gian, số tiền, phương thức thanh toán, pin cũ/mới, nhân viên xử lý

---

## 👤 9. Profile Flow

### 9.1 Xem profile
- [ ] **TC-048**: Hiển thị thông tin profile
  - [ ] Load trang `/driver/profile` → Hiển thị thông tin user
  - [ ] Hiển thị: email, full_name, phone, avatar
  - [ ] Không hiển thị date_of_birth và address (vì BE không có)

### 9.2 Cập nhật profile
- [ ] **TC-049**: Update profile
  - [ ] Sửa thông tin → Click "Lưu" → Cập nhật thành công
  - [ ] Upload avatar → Avatar được cập nhật

---

## 🆘 10. Support & Feedback Flow

### 10.1 Tạo yêu cầu hỗ trợ
- [ ] **TC-062**: Tạo ticket hỗ trợ
  - [ ] Load trang `/driver/support` → Hiển thị danh sách tickets (nếu có)
  - [ ] Click "Tạo yêu cầu hỗ trợ" → Mở dialog
  - [ ] Form chỉ có 2 field: "Loại hỗ trợ mà bạn cần là" và "Mô tả chi tiết"
  - [ ] Select "Loại hỗ trợ" có background trắng (dễ nhìn)
  - [ ] Không có field "Tiêu đề" và "Mức độ ưu tiên"
  - [ ] Subject tự động tạo từ category + phần đầu description
  - [ ] Priority mặc định là "medium"
  - [ ] Nhập đầy đủ thông tin → Click "Tạo yêu cầu" → Tạo thành công
  - [ ] Ticket xuất hiện trong danh sách với status "open"

- [ ] **TC-063**: Loại hỗ trợ
  - [ ] Các loại: "Vấn đề về Pin", "Vấn đề về Trạm", "Vấn đề thanh toán", "Khiếu nại dịch vụ", "Khác"
  - [ ] Select có background trắng (bg-white dark:bg-slate-800)

### 10.2 Xem và quản lý tickets
- [ ] **TC-064**: Hiển thị danh sách tickets
  - [ ] Hiển thị tất cả tickets của driver
  - [ ] Mỗi ticket hiển thị: subject, ticket_number, status, priority, created_at
  - [ ] Filter theo status (all, open, in_progress, resolved, closed)
  - [ ] Search theo subject hoặc ticket_number
  - [ ] Select filter có background trắng

- [ ] **TC-065**: Xem chi tiết ticket
  - [ ] Click vào ticket (bất kỳ đâu trên card) → Mở dialog với chi tiết
  - [ ] Badge "Medium" và "Open" chỉ để hiển thị (không phải nút)
  - [ ] Text "Chi tiết" chỉ là indicator (không phải nút riêng)
  - [ ] Hiển thị tất cả replies (tin nhắn) từ API
  - [ ] Phân biệt tin nhắn của staff (bên trái, màu xám) và driver (bên phải, màu xanh)
  - [ ] Hiển thị thời gian và người gửi
  - [ ] Nếu chưa có replies → Hiển thị "Chưa có tin nhắn nào"
  - [ ] API response format: `{ data: { replies: [...], pagination: {...} } }`

### 10.3 Trả lời ticket
- [ ] **TC-066**: Gửi tin nhắn
  - [ ] Ticket status = "open" hoặc "in_progress" → Có thể gửi tin nhắn
  - [ ] Textarea có background trắng (dễ nhìn)
  - [ ] Nhập tin nhắn → Click gửi → POST đến `/support/:id/replies`
  - [ ] Optimistic update: Tin nhắn được thêm vào conversation ngay
  - [ ] Sau đó reload lại từ BE để đảm bảo đồng bộ
  - [ ] Tin nhắn hiển thị với avatar và thời gian
  - [ ] Tin nhắn được lưu vào BE và vẫn còn khi đóng/mở lại dialog
  - [ ] Console log "📨 Loaded replies" khi load thành công

---

## ⭐ 11. Station Rating Flow

### 11.1 Đánh giá trạm
- [ ] **TC-067**: Xem giao dịch chưa đánh giá
  - [ ] Load trang `/driver/ratings` → Hiển thị danh sách giao dịch đã completed
  - [ ] Chỉ hiển thị giao dịch chưa được đánh giá
  - [ ] Mỗi giao dịch hiển thị: tên trạm, mã giao dịch, thời gian swap
  - [ ] Có nút "Đánh giá" cho mỗi giao dịch

- [ ] **TC-068**: Tạo đánh giá
  - [ ] Click "Đánh giá" hoặc click vào giao dịch → Mở form đánh giá
  - [ ] Chọn số sao (1-5 sao)
  - [ ] Nhập nhận xét (tùy chọn)
  - [ ] Click "Gửi đánh giá" → Tạo thành công
  - [ ] Giao dịch biến mất khỏi danh sách "chưa đánh giá"
  - [ ] Đánh giá xuất hiện trong "Đánh giá của tôi"

- [ ] **TC-069**: Xem đánh giá đã tạo
  - [ ] Section "Đánh giá của tôi" hiển thị tất cả đánh giá đã gửi
  - [ ] Mỗi đánh giá hiển thị: tên trạm, số sao, nhận xét (nếu có), thời gian
  - [ ] Hiển thị đầy đủ 5 sao với màu vàng cho sao đã chọn

### 11.2 Đồng bộ với trang tìm trạm
- [ ] **TC-070**: Rating hiển thị ở trang tìm trạm
  - [ ] Đánh giá ở trang "Đánh giá dịch vụ" → Cập nhật vào bảng `station_ratings`
  - [ ] Trang "Tìm trạm thay pin" tính `average_rating` và `total_ratings` từ cùng bảng
  - [ ] Khi có đánh giá mới → Số sao và tổng đánh giá ở trang tìm trạm cập nhật
  - [ ] Hiển thị đúng số sao trung bình và số lượng đánh giá

---

## 🎨 12. UI/UX Validation

### 12.1 Loading States
- [ ] **TC-050**: Skeleton loading
  - [ ] BookBatteryPage: Skeleton hiển thị khi đang load dữ liệu ban đầu
  - [ ] BookingHistory: Skeleton hiển thị khi đang load danh sách booking

- [ ] **TC-051**: Loading spinner
  - [ ] Button submit: BatteryLoading với variant "charging" hiển thị khi đang xử lý
  - [ ] Nút "Làm mới": BatteryLoading với variant "rotate" hiển thị khi đang load

### 12.2 Error Handling
- [ ] **TC-052**: Error display
  - [ ] Error hiển thị với ErrorDisplay component
  - [ ] Có retry button để thử lại
  - [ ] Error message rõ ràng, dễ hiểu (tiếng Việt)

### 12.3 Responsive Design
- [ ] **TC-053**: Mobile/Tablet/Desktop
  - [ ] UI hiển thị đúng trên các kích thước màn hình khác nhau
  - [ ] Navigation menu hoạt động tốt trên mobile

### 12.4 Form Inputs Background
- [ ] **TC-071**: Select và Input có background trắng
  - [ ] Tất cả Select (SelectTrigger, SelectContent) có `bg-white dark:bg-slate-800`
  - [ ] Tất cả Input có `bg-white dark:bg-slate-800`
  - [ ] Không còn class "glass" hoặc trong suốt
  - [ ] Áp dụng cho: TransactionHistory, SupportTickets, BookingHistory, BookingModal, VehicleManagement

### 12.5 Text Color Consistency
- [ ] **TC-072**: Màu chữ nhất quán
  - [ ] Tất cả tiêu đề dùng `text-slate-900 dark:text-white` (không dùng gradient xanh)
  - [ ] Áp dụng cho: TransactionHistory, Wallet, và tất cả trang khác

---

## 🔍 13. Edge Cases & Error Scenarios

### 13.1 Network Errors
- [ ] **TC-054**: Mất kết nối mạng
  - [ ] API call thất bại → Hiển thị error message
  - [ ] Có retry button để thử lại

### 13.2 Invalid Data
- [ ] **TC-055**: Dữ liệu không hợp lệ
  - [ ] BE trả về data không đúng format → Không crash app
  - [ ] Hiển thị error message phù hợp

### 13.3 Empty States
- [ ] **TC-056**: Không có dữ liệu
  - [ ] Không có booking → Hiển thị "Không tìm thấy đặt chỗ"
  - [ ] Không có xe → Hiển thị "Chưa có xe nào"
  - [ ] Không có trạm → Hiển thị "Không tìm thấy trạm"

---

## ✅ 14. Integration Tests

### 14.1 End-to-End Flows
- [ ] **TC-057**: Complete booking flow với hold system
  - [ ] Đăng nhập → Chọn trạm → Đặt pin với checkbox subscription bật → Booking pending với hold_summary
  - [ ] Pin được reserve (status = reserved) → Subscription được lock
  - [ ] Số pin khả dụng giảm đi 1 (hiển thị real-time)
  - [ ] Staff confirm → Booking confirmed → Hold vẫn còn
  - [ ] Staff complete → Hold được consume → Subscription remaining_swaps giảm → Transaction tạo với amount = 0
  - [ ] Pin reserve được đưa cho driver (status = in_use)
  - [ ] Pin cũ của driver trả lại trạm (status = charging)

- [ ] **TC-058**: Complete booking flow với wallet
  - [ ] Đăng nhập → Chọn trạm → Đặt pin với checkbox subscription tắt → Wallet amount được lock
  - [ ] Số pin khả dụng giảm đi 1 (hiển thị real-time)
  - [ ] Staff complete → Wallet amount được trừ → Transaction tạo với amount > 0
  - [ ] Pin reserve được đưa cho driver (status = in_use)
  - [ ] Pin cũ của driver trả lại trạm (status = charging)

- [ ] **TC-059**: Subscription flow với hold
  - [ ] Mua package → Wallet giảm → Subscription active
  - [ ] Đặt pin → Subscription được lock (hold_summary hiển thị)
  - [ ] Staff complete → remaining_swaps giảm → Hold được release
  - [ ] Hiển thị "Miễn phí - Gói dịch vụ" trong booking history

- [ ] **TC-060**: Cancel flow với hold release
  - [ ] Đặt pin với subscription → Subscription được lock
  - [ ] Hủy trước 15 phút → Booking cancelled → Hold được release → Subscription unlock
  - [ ] Đặt pin với wallet → Wallet amount được lock
  - [ ] Hủy trước 15 phút → Booking cancelled → Wallet amount được hoàn lại

- [ ] **TC-061**: Hold expiration
  - [ ] Tạo booking → Pin được reserve với `hold_expires_at`
  - [ ] Sau khi hết hạn (nếu không complete) → Pin được release tự động
  - [ ] Số pin khả dụng tăng lại (hiển thị real-time sau khi refresh)

---

## 📝 Test Execution Notes

### Cách test:
1. **Manual Testing**: Chạy từng test case theo thứ tự
2. **Check Console**: Kiểm tra console logs để debug
3. **Network Tab**: Kiểm tra API calls trong DevTools
4. **LocalStorage**: Kiểm tra token và data được lưu đúng

### Môi trường test:
- **Development**: `http://localhost:5173`
- **Backend**: `https://ev-battery-backend.onrender.com/api`
- **Test Account**: Cần có driver account với:
  - Ít nhất 1 xe đã đăng ký
  - Wallet có số dư (để test payment)
  - Có thể tạo subscription để test

### Checklist trước khi test:
- [ ] BE đang chạy và accessible
- [ ] CORS đã được config đúng
- [ ] Test account đã được setup
- [ ] Có ít nhất 1 trạm với pin khả dụng
- [ ] Có ít nhất 1 package dịch vụ để test subscription
- [ ] BE đã có booking hold system (hold_summary, use_subscription)
- [ ] BE đã có subscription cancel với refund
- [ ] Test account có wallet balance để test wallet lock

---

## 🎯 Priority Test Cases

### Critical (Phải test trước):
- TC-011A: Checkbox chọn dùng/không dùng subscription
- TC-012A: Refresh pin real-time
- TC-012B: Refresh pin trước khi đặt
- TC-014: Tạo booking thành công với hold_summary
- TC-021: Hủy booking trước 15 phút (với hold release)
- TC-022: Hủy booking trong 15 phút (should fail)
- TC-024: Hiển thị hold_summary trong booking history
- TC-031: Mua package thành công
- TC-034: Booking được miễn phí nhờ subscription (với hold)
- TC-034A: Booking với subscription nhưng driver chọn không dùng
- TC-036: Cancel subscription với refund
- TC-057: Complete booking flow với hold system

### High Priority:
- TC-010 đến TC-015: Booking flow (với use_subscription và checkbox)
- TC-017 đến TC-025: Booking history flow (với hold_summary)
- TC-026 đến TC-029: Wallet flow
- TC-035: Subscription không áp dụng (wallet lock)
- TC-037: Cancel subscription - Đã sử dụng
- TC-038: Cancel subscription - Đang bị lock
- TC-058: Complete booking flow với wallet
- TC-060: Cancel flow với hold release
- TC-061: Hold expiration với refresh pin

### Medium Priority:
- TC-039 đến TC-045: Notification flow
- TC-046 đến TC-047: Transaction history
- TC-050 đến TC-052: UI/UX validation
- TC-058: Complete booking flow với wallet
- TC-059: Subscription flow với hold
- TC-061: Hold expiration

---

---

## 🆕 Tính năng mới từ BE (Cập nhật 2024)

### Booking Hold System
- **Hold Summary**: Mỗi booking có `hold_summary` chứa thông tin về tài nguyên đã giữ (pin, subscription, ví)
- **use_subscription parameter**: Khi tạo booking, có thể chỉ định `use_subscription: true/false` (default: true)
- **Hold Expiration**: Pin và tài nguyên được giữ có thời gian hết hạn (`hold_expires_at`)
- **Hold Release**: Khi hủy booking, tài nguyên đã giữ được giải phóng tự động

### Subscription Management
- **Cancel với Refund**: Hủy subscription chưa sử dụng sẽ được hoàn tiền vào ví
- **Lock Check**: Không thể hủy subscription đang bị lock bởi booking
- **Usage Check**: Không thể hủy subscription đã được sử dụng

### Response Structure
- **Create Booking Response**: Chứa `booking`, `pricing_preview`, và `hold_summary`
- **Cancel Booking Response**: Chứa `cancellation_fee`, `wallet_forfeited_amount`, `wallet_balance`
- **Cancel Subscription Response**: Chứa `subscription`, `refund`, và `wallet_balance`

### Frontend Enhancements (Cập nhật 2024)
- **Checkbox chọn subscription** (TC-011A): Driver có thể chọn dùng/không dùng subscription khi đặt pin, ngay cả khi có subscription active
- **Refresh pin real-time** (TC-012A): Danh sách pin tự động refresh mỗi 10 giây để cập nhật số lượng
- **Refresh trước khi đặt** (TC-012B): Tự động refresh pin trước khi submit để đảm bảo số liệu chính xác
- **Hiển thị pin reserved** (TC-012A): Hiển thị số pin đang được reserve: "X pin khả dụng (Y đang được giữ)"
- **Cảnh báo số pin thay đổi** (TC-012A): Console log cảnh báo khi số pin thay đổi trong quá trình đặt
- **Hỗ trợ & phản hồi** (TC-062-TC-066): Form đơn giản chỉ có 2 field, subject tự động tạo, priority mặc định
- **Đánh giá dịch vụ** (TC-067-TC-070): Đánh giá trạm từ giao dịch đã completed, đồng bộ với trang tìm trạm
- **UI Improvements** (TC-071-TC-072): Tất cả Select/Input có background trắng, màu chữ nhất quán

---

**Lưu ý**: Tài liệu này đã được cập nhật để phản ánh các tính năng mới từ BE (Booking Hold System, Subscription Refund, v.v.) và các cải tiến từ FE (Checkbox subscription, Refresh real-time, v.v.). Sẽ được cập nhật tiếp sau khi test thực tế và ghi nhận các issues.

