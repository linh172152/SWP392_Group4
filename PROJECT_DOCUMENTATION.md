# 📚 EV Battery Swap Station Management System - Complete Documentation

## 📊 Project Overview

**EV Battery Swap Station Management System** là hệ thống quản lý trạm đổi pin xe điện toàn diện, được phát triển bởi **SWP392 Group 4** tại FPT University. Hệ thống hỗ trợ quản lý trạm đổi pin, đặt lịch, thanh toán, và vận hành cho 3 nhóm người dùng: **Driver**, **Staff**, và **Admin**.

### 🎯 Mục tiêu chính:

- Quản lý trạm đổi pin xe điện hiệu quả
- Hỗ trợ người dùng tìm kiếm và đặt lịch đổi pin
- Quản lý nhân viên và vận hành trạm
- Theo dõi và báo cáo hoạt động hệ thống
- Tích hợp thanh toán VNPay cho nạp tiền ví

---

## II. Functional Requirements

### 1. Authentication & Authorization Features

#### a. User Registration

**Function Trigger:**
- Người dùng truy cập trang Landing Page (`/`)
- Click nút "Đăng ký" hoặc "Đăng nhập" → Modal hiển thị
- Chọn tab "Đăng ký" trong AuthModal

**Function Description:**
- **Actors/Roles:** Guest (chưa đăng nhập)
- **Purpose:** Tạo tài khoản mới cho người dùng (Driver, Staff, Admin)
- **Interface:** Modal dialog với form đăng ký
- **Data Processing:**
  - Nhận thông tin: email, password, full_name, phone
  - Validate: email format, password (tối thiểu 6 ký tự), phone format
  - Hash password bằng bcrypt
  - Tạo user trong database với role mặc định là DRIVER
  - Tạo Wallet tự động cho user mới (balance = 0)
  - Trả về access token và refresh token

**Screen Layout:**
**[File: AuthModal.tsx - Modal "Đăng ký/Đăng nhập"]**
```
┌─────────────────────────────────────┐
│  EV Battery Swap - Đăng ký          │
├─────────────────────────────────────┤
│  [Đăng nhập] [Đăng ký] ← Tab        │
│                                     │
│  Email: [________________]          │
│  Mật khẩu: [________________] [👁]  │
│  Họ tên: [________________]        │
│  Số điện thoại: [________________]  │
│                                     │
│  [Đăng ký]                         │
│  Hoặc đăng nhập với Google          │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Email: format hợp lệ, chưa tồn tại trong hệ thống
  - Password: tối thiểu 6 ký tự
  - Phone: format số điện thoại Việt Nam (10-11 số)
  - Full name: không được để trống
- **Business Logic:**
  - Nếu email đã tồn tại → Báo lỗi "Email đã được sử dụng"
  - Nếu validation fail → Hiển thị lỗi cụ thể
  - Nếu thành công → Tự động đăng nhập và redirect đến dashboard theo role
- **Abnormal Cases:**
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"
  - Server error (500) → Hiển thị "Lỗi hệ thống, vui lòng liên hệ admin"
  - Rate limiting (429) → Hiển thị "Bạn đã đăng ký quá nhiều lần, vui lòng thử lại sau"

#### b. User Login

**Function Trigger:**
- Người dùng truy cập trang Landing Page (`/`)
- Click nút "Đăng nhập" → Modal hiển thị
- Chọn tab "Đăng nhập" trong AuthModal

**Function Description:**
- **Actors/Roles:** Guest (chưa đăng nhập)
- **Purpose:** Xác thực người dùng và cấp quyền truy cập
- **Interface:** Modal dialog với form đăng nhập
- **Data Processing:**
  - Nhận thông tin: email, password
  - Verify password với bcrypt
  - Tạo JWT access token (15 phút) và refresh token (7 ngày)
  - Lưu refresh token vào database và httpOnly cookie
  - Trả về user info và tokens

**Screen Layout:**
**[File: AuthModal.tsx - Modal "Đăng ký/Đăng nhập"]**
```
┌─────────────────────────────────────┐
│  EV Battery Swap - Đăng nhập         │
├─────────────────────────────────────┤
│  [Đăng nhập] [Đăng ký] ← Tab        │
│                                     │
│  Email: [________________]          │
│  Mật khẩu: [________________] [👁]  │
│                                     │
│  [Đăng nhập]                       │
│  Hoặc đăng nhập với Google          │
│  Quên mật khẩu?                     │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Email: format hợp lệ, phải tồn tại trong hệ thống
  - Password: không được để trống
- **Business Logic:**
  - Nếu email không tồn tại → Báo lỗi "Email hoặc mật khẩu không đúng"
  - Nếu password sai → Báo lỗi "Email hoặc mật khẩu không đúng" (không tiết lộ email có tồn tại)
  - Nếu thành công → Lưu tokens vào localStorage, redirect đến dashboard theo role:
    - DRIVER → `/driver/vehicles`
    - STAFF → `/staff/home`
    - ADMIN → `/admin/home`
- **Abnormal Cases:**
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"
  - Rate limiting (429) → Hiển thị "Bạn đã đăng nhập quá nhiều lần, vui lòng thử lại sau vài phút"
  - Account bị khóa → Hiển thị "Tài khoản của bạn đã bị khóa"

#### c. User Profile Management

**Function Trigger:**
- Driver: Click "Hồ sơ" trong sidebar → `/driver/profile`
- Staff: Click "Hồ sơ cá nhân" trong sidebar → `/staff/profile`
- Admin: Click avatar → Profile dropdown (nếu có)

**Function Description:**
- **Actors/Roles:** Driver, Staff, Admin
- **Purpose:** Xem và cập nhật thông tin cá nhân
- **Interface:** Trang profile với form chỉnh sửa
- **Data Processing:**
  - Load thông tin user từ API: full_name, email, phone, avatar
  - Load statistics: total swaps, monthly swaps, monthly cost (cho Driver)
  - Update profile: full_name, phone, avatar (upload lên Cloudinary)
  - Change password: old password, new password

**Screen Layout:**
**[File: DriverProfile.tsx - Trang "Hồ sơ" (Driver)]**
```
┌─────────────────────────────────────┐
│  Hồ sơ cá nhân                       │
├─────────────────────────────────────┤
│  [Avatar] [📷]                      │
│  Tên: [________________] [✏️]      │
│  Email: user@example.com (readonly)  │
│  Số điện thoại: [________________]  │
│                                     │
│  Thống kê:                          │
│  - Tổng số lần đổi pin: 25          │
│  - Đổi pin tháng này: 5             │
│  - Chi phí tháng này: 500,000đ      │
│                                     │
│  [Đổi mật khẩu]                     │
│  [Lưu thay đổi]                     │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Full name: không được để trống, tối đa 100 ký tự
  - Phone: format số điện thoại Việt Nam
  - Avatar: file ảnh (jpg, png), tối đa 5MB
  - Old password: phải đúng với password hiện tại
  - New password: tối thiểu 6 ký tự, khác old password
- **Business Logic:**
  - Chế độ xem: Hiển thị thông tin user và statistics
  - Chế độ chỉnh sửa: Click "✏️" → Form chỉnh sửa
  - Upload avatar: Upload lên Cloudinary, cập nhật URL vào database
  - Change password: Verify old password → Hash new password → Update database
  - Nếu thành công → Hiển thị thông báo "Cập nhật thành công"
- **Abnormal Cases:**
  - Avatar upload fail → Hiển thị "Lỗi upload ảnh, vui lòng thử lại"
  - Old password sai → Hiển thị "Mật khẩu cũ không đúng"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

### 2. Driver Features - Vehicle Management & Station Finding

#### a. Vehicle Management

**Function Trigger:**
- Driver đăng nhập → Redirect đến `/driver/vehicles` (trang mặc định)
- Click "Xe của tôi" trong sidebar → `/driver/vehicles`

**Function Description:**
- **Actors/Roles:** Driver
- **Purpose:** Quản lý danh sách xe của driver (CRUD: Create, Read, Update, Delete)
- **Interface:** Trang danh sách xe với card layout, form thêm/sửa
- **Data Processing:**
  - Load danh sách vehicles từ API: license_plate, vehicle_type, make, model, year, battery_model, current_battery_code
  - Load vehicle options từ API: brands, vehicleModels, batteryModels
  - Create vehicle: Tạo vehicle mới với thông tin đầy đủ
  - Update vehicle: Cập nhật thông tin vehicle
  - Delete vehicle: Xóa vehicle (chỉ khi không có booking đang active)

**Screen Layout:**
**[File: VehicleManagement.tsx - Trang "Xe của tôi"]**
```
┌─────────────────────────────────────┐
│  Xe của tôi              [+ Thêm xe] │
├─────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐         │
│  │ 🚗 ABC- │  │ 🚗 XYZ- │         │
│  │   1234  │  │   5678  │         │
│  │ Tesla   │  │ BYD     │         │
│  │ Pin:    │  │ Pin:    │         │
│  │ BAT001  │  │ BAT002  │         │
│  │ [✏️][🗑️]│  │ [✏️][🗑️]│         │
│  └─────────┘  └─────────┘         │
│                                     │
│  [Modal: Thêm/Sửa xe]              │
│  - Biển số: [________]             │
│  - Loại xe: [Car ▼]                │
│  - Hãng: [Tesla ▼]                 │
│  - Model: [Model 3 ▼]              │
│  - Năm: [2023]                     │
│  - Model pin: [BAT001 ▼]           │
│  - Mã pin hiện tại: [________]     │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - License plate: Không được để trống, format hợp lệ (VD: 30A-12345)
  - Vehicle type: Phải chọn (car, motorcycle, scooter)
  - Battery model: Phải chọn từ danh sách có sẵn
  - Year: Năm hợp lệ (1900 - năm hiện tại)
- **Business Logic:**
  - **Create:**
    - Validate form → Gọi API POST `/api/driver/vehicles`
    - Nếu thành công → Refresh danh sách, đóng modal
    - Nếu license plate đã tồn tại → Báo lỗi "Biển số đã được đăng ký"
  - **Update:**
    - Click "✏️" → Mở modal với dữ liệu hiện tại
    - Validate form → Gọi API PUT `/api/driver/vehicles/:id`
    - Nếu thành công → Refresh danh sách, đóng modal
  - **Delete:**
    - Click "🗑️" → Xác nhận xóa
    - Kiểm tra vehicle có booking active không
    - Nếu có booking active → Không cho xóa, báo lỗi "Không thể xóa xe đang có đặt chỗ"
    - Nếu không → Gọi API DELETE `/api/driver/vehicles/:id`
    - Nếu thành công → Refresh danh sách
- **Abnormal Cases:**
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"
  - License plate trùng → Hiển thị "Biển số đã được đăng ký"
  - Vehicle đang có booking → Không cho xóa
  - API error (500) → Hiển thị "Lỗi hệ thống, vui lòng thử lại sau"

#### b. Station Finding (Tìm trạm thay pin)

**Function Trigger:**
- Driver click "Tìm trạm thay pin" trong sidebar → `/driver/stations`
- Tự động lấy vị trí GPS của user khi vào trang

**Function Description:**
- **Actors/Roles:** Driver
- **Purpose:** Tìm kiếm và xem danh sách trạm đổi pin gần nhất
- **Interface:** Trang danh sách trạm với map view, search bar, filter
- **Data Processing:**
  - Lấy vị trí GPS của user (nếu cho phép)
  - Gọi API GET `/api/driver/stations/nearby?lat=...&lng=...` để lấy trạm gần nhất
  - Hoặc search theo tên/địa chỉ: GET `/api/stations/public?search=...`
  - Tính khoảng cách từ user đến từng trạm (Track-Asia API)
  - Hiển thị thông tin: tên, địa chỉ, khoảng cách, số pin có sẵn, rating

**Screen Layout:**
**[File: StationFinding.tsx - Trang "Tìm trạm thay pin"]**
```
┌─────────────────────────────────────┐
│  Tìm trạm thay pin                   │
│  [🔍 Tìm kiếm...]                    │
├─────────────────────────────────────┤
│  📍 Trạm A - Quận 1                  │
│  📍 123 Đường ABC, Quận 1            │
│  📏 2.5 km | ⭐ 4.5 | 🔋 15 pin      │
│  [Xem chi tiết] [Đặt lịch]          │
│                                     │
│  📍 Trạm B - Quận 2                  │
│  📍 456 Đường XYZ, Quận 2            │
│  📏 5.0 km | ⭐ 4.8 | 🔋 8 pin       │
│  [Xem chi tiết] [Đặt lịch]          │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - GPS location: Nếu không lấy được → Sử dụng vị trí mặc định (TP.HCM: 10.762622, 106.660172)
  - Search query: Tối đa 100 ký tự
- **Business Logic:**
  - **Auto-load nearby stations:**
    - Lấy GPS location → Gọi API `/api/driver/stations/nearby`
    - Sort theo khoảng cách (gần nhất trước)
    - Hiển thị tối đa 20 trạm
  - **Search stations:**
    - User nhập search query → Debounce 500ms
    - Gọi API `/api/stations/public?search=...`
    - Hiển thị kết quả tìm kiếm
  - **Calculate distance:**
    - Gọi Track-Asia API để tính khoảng cách đường bộ
    - Hiển thị khoảng cách (km) và thời gian di chuyển (phút)
  - **Click "Xem chi tiết":**
    - Navigate đến `/driver/station/:id` (Station Detail page)
  - **Click "Đặt lịch":**
    - Navigate đến `/driver/station/:id/book-battery` (Booking page)
- **Abnormal Cases:**
  - GPS permission denied → Sử dụng vị trí mặc định, hiển thị cảnh báo
  - GPS timeout → Sử dụng vị trí mặc định
  - Không tìm thấy trạm → Hiển thị "Không tìm thấy trạm nào"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

#### c. Station Detail

**Function Trigger:**
- Driver click "Xem chi tiết" trong Station Finding → `/driver/station/:id`
- Driver click vào trạm trong danh sách → `/driver/station/:id`

**Function Description:**
- **Actors/Roles:** Driver
- **Purpose:** Xem thông tin chi tiết trạm, pricing, available batteries, ratings
- **Interface:** Trang chi tiết trạm với thông tin đầy đủ
- **Data Processing:**
  - Load station details: name, address, phone, hours, images
  - Load battery inventory: số lượng pin theo model, status (full, charging)
  - Load pricing: giá đổi pin theo model
  - Load ratings: đánh giá từ users khác
  - Calculate distance và directions từ user location

**Screen Layout:**
**[File: StationDetail.tsx - Trang "Chi tiết trạm"]**
```
┌─────────────────────────────────────┐
│  [← Quay lại]                        │
│                                     │
│  📍 Trạm A - Quận 1                 │
│  📍 123 Đường ABC, Quận 1            │
│  📏 2.5 km | ⏱️ 5 phút               │
│  ⭐ 4.5 (120 đánh giá)               │
│                                     │
│  [Hình ảnh trạm]                    │
│                                     │
│  Thông tin:                         │
│  📞 0901234567                      │
│  🕐 7:00 - 22:00                    │
│                                     │
│  Giá đổi pin:                       │
│  - Tesla Model 3: 100,000đ          │
│  - BYD Battery: 80,000đ             │
│                                     │
│  Pin có sẵn:                        │
│  - Tesla Model 3: 10 pin (full)     │
│  - BYD Battery: 5 pin (full)        │
│                                     │
│  [Chỉ đường] [Đặt lịch ngay]        │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Station ID: Phải tồn tại trong database
- **Business Logic:**
  - **Load station info:**
    - Gọi API GET `/api/driver/stations/:id`
    - Hiển thị thông tin: name, address, phone, operating hours, images
  - **Load battery inventory:**
    - Gọi API GET `/api/driver/stations/:id/batteries` (nếu có)
    - Hiển thị số lượng pin theo model và status
  - **Load pricing:**
    - Gọi API GET `/api/pricing` hoặc từ station data
    - Hiển thị giá đổi pin theo model
  - **Calculate distance:**
    - Lấy user location → Gọi Track-Asia API
    - Hiển thị khoảng cách và thời gian di chuyển
  - **Click "Chỉ đường":**
    - Mở Google Maps hoặc ứng dụng maps với directions
  - **Click "Đặt lịch ngay":**
    - Navigate đến `/driver/station/:id/book-battery`
- **Abnormal Cases:**
  - Station không tồn tại → Hiển thị "Trạm không tồn tại", redirect về danh sách
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"
  - Station đã bị xóa → Hiển thị "Trạm đã bị xóa"

### 3. Driver Features - Booking System

#### a. Create Booking (Đặt lịch đổi pin)

**Function Trigger:**
- Driver click "Đặt lịch" trong Station Detail → `/driver/station/:id/book-battery`
- Driver chọn "Đặt lịch ngay" (Instant Booking) hoặc "Đặt lịch trước" (Scheduled Booking)

**Function Description:**
- **Actors/Roles:** Driver
- **Purpose:** Tạo booking đổi pin (Scheduled hoặc Instant)
- **Interface:** Trang đặt lịch với form chọn vehicle, battery model, thời gian
- **Data Processing:**
  - Load vehicles của driver
  - Load battery inventory tại trạm (theo model)
  - Load pricing và subscription
  - Check wallet balance
  - Create booking: POST `/api/driver/bookings` hoặc `/api/driver/bookings/instant`
  - Lock wallet amount hoặc lock subscription

**Screen Layout:**
**[File: BookBatteryPage.tsx - Trang "Đặt lịch đổi pin"]**
```
┌─────────────────────────────────────┐
│  Đặt lịch đổi pin                   │
│  Trạm: Trạm A - Quận 1             │
├─────────────────────────────────────┤
│  Chọn xe: [Tesla Model 3 ▼]        │
│  Model pin: [Tesla Battery ▼]      │
│                                     │
│  Loại đặt chỗ:                      │
│  ○ Đặt lịch trước                   │
│    Thời gian: [📅 2025-01-15]       │
│    Giờ: [🕐 14:00]                  │
│  ● Đặt ngay (15 phút)               │
│                                     │
│  Giá: 100,000đ                      │
│  Số dư ví: 500,000đ                 │
│  [Có gói dịch vụ] → Miễn phí        │
│                                     │
│  [Xác nhận đặt chỗ]                 │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Vehicle: Phải chọn vehicle
  - Battery model: Phải chọn model pin tương thích với vehicle
  - Scheduled time: Phải trong khoảng 30 phút - 12 giờ từ hiện tại
  - Instant booking: Phải có pin available ngay
  - Wallet balance: Phải >= giá tiền (nếu không dùng subscription)
- **Business Logic:**
  - **Scheduled Booking:**
    - Chọn thời gian (30 phút - 12 giờ sau)
    - Check pin available tại thời điểm đó
    - Lock wallet amount hoặc lock subscription
    - Tạo booking với status `pending`
  - **Instant Booking:**
    - Chọn "Đặt ngay" → Booking ngay trong 15 phút
    - Check pin available ngay
    - Lock wallet amount hoặc lock subscription
    - Tạo booking với status `pending`, `is_instant = true`
  - **Pricing:**
    - Nếu có subscription active và compatible → Dùng subscription (miễn phí)
    - Nếu không → Tính giá theo battery model, trừ từ wallet
  - **Wallet Lock:**
    - Lock số tiền = giá đổi pin
    - Nếu không đủ tiền → Báo lỗi "Số dư không đủ, vui lòng nạp thêm"
- **Abnormal Cases:**
  - Không đủ pin available → Hiển thị "Không còn pin, vui lòng chọn thời gian khác"
  - Wallet không đủ → Hiển thị "Số dư không đủ, vui lòng nạp thêm"
  - Thời gian không hợp lệ → Hiển thị "Thời gian phải trong khoảng 30 phút - 12 giờ"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

#### b. Booking History (Lịch sử đặt chỗ)

**Function Trigger:**
- Driver click "Đơn đặt chỗ" trong sidebar → `/driver/bookings`

**Function Description:**
- **Actors/Roles:** Driver
- **Purpose:** Xem danh sách tất cả bookings (pending, confirmed, completed, cancelled)
- **Interface:** Trang danh sách booking với filter, search, pagination
- **Data Processing:**
  - Load bookings từ API: GET `/api/driver/bookings?status=...&page=...`
  - Filter theo status: pending, confirmed, completed, cancelled
  - Search theo booking code, station name
  - Pagination: 10 items per page

**Screen Layout:**
**[File: BookingHistory.tsx - Trang "Đơn đặt chỗ"]**
```
┌─────────────────────────────────────┐
│  Đơn đặt chỗ                         │
│  [🔍 Tìm kiếm...] [Tất cả ▼]       │
├─────────────────────────────────────┤
│  📅 15/01/2025 14:00                │
│  Trạm A - Quận 1                    │
│  Xe: Tesla Model 3 (ABC-1234)       │
│  Pin hiện tại: BAT001                │
│  [Đang chờ xác nhận]                │
│  [Hủy đặt chỗ]                      │
│                                     │
│  ✅ 14/01/2025 10:00                │
│  Trạm B - Quận 2                    │
│  Xe: BYD (XYZ-5678)                 │
│  Pin cũ: BAT002 → Pin mới: BAT003   │
│  [Đã hoàn thành]                    │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Status filter: pending, confirmed, completed, cancelled, all
- **Business Logic:**
  - **Load bookings:**
    - Gọi API GET `/api/driver/bookings?status=...&page=...&limit=10`
    - Sort theo `created_at DESC` (mới nhất trước)
    - Hiển thị: booking code, station, vehicle, scheduled time, status
  - **Display current battery:**
    - Hiển thị mã pin hiện tại của vehicle (nếu có)
  - **Filter & Search:**
    - Filter theo status → Reload danh sách
    - Search theo booking code hoặc station name → Debounce 500ms
  - **Pagination:**
    - Hiển thị 10 items per page
    - Có nút "Trang trước" / "Trang sau"
  - **Cancel booking:**
    - Click "Hủy đặt chỗ" → Xác nhận
    - Gọi API PUT `/api/driver/bookings/:id/cancel`
    - Nếu hủy < 15 phút trước giờ hẹn → Trừ phí hủy 20K
    - Nếu hủy >= 15 phút → Hoàn tiền đầy đủ
- **Abnormal Cases:**
  - Không có booking → Hiển thị "Chưa có đặt chỗ nào"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"
  - Booking đã completed → Không cho hủy

#### c. Cancel Booking (Hủy đặt chỗ)

**Function Trigger:**
- Driver click "Hủy đặt chỗ" trong Booking History
- Driver click "Hủy" trong booking detail

**Function Description:**
- **Actors/Roles:** Driver
- **Purpose:** Hủy booking đã tạo (chỉ khi status = pending hoặc confirmed)
- **Interface:** Dialog xác nhận hủy
- **Data Processing:**
  - Check thời gian hủy (so với scheduled time)
  - Calculate cancellation fee (20K nếu < 15 phút)
  - Gọi API PUT `/api/driver/bookings/:id/cancel`
  - Release wallet lock hoặc subscription lock
  - Refund wallet (trừ phí hủy nếu có)

**Function Details:**
- **Validation:**
  - Booking status: Chỉ hủy được khi status = `pending` hoặc `confirmed`
  - Booking time: Phải trước giờ hẹn
- **Business Logic:**
  - **Check cancellation time:**
    - Nếu hủy < 15 phút trước giờ hẹn → Trừ phí hủy 20K
    - Nếu hủy >= 15 phút → Không trừ phí
  - **Release lock:**
    - Release wallet lock (hoàn tiền vào ví, trừ phí hủy nếu có)
    - Release subscription lock (nếu dùng subscription)
  - **Update booking:**
    - Set status = `cancelled`
    - Ghi note: "Cancelled by user at [time]"
  - **Send notification:**
    - Gửi thông báo "Đặt chỗ đã được hủy" cho driver
- **Abnormal Cases:**
  - Booking đã completed → Không cho hủy, báo "Không thể hủy đặt chỗ đã hoàn thành"
  - Booking đã cancelled → Báo "Đặt chỗ đã được hủy trước đó"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

### 4. Driver Features - Wallet, Payment & Subscriptions

#### a. Wallet Management (Quản lý ví)

**Function Trigger:**
- Driver click "Ví của tôi" trong sidebar → `/driver/wallet`

**Function Description:**
- **Actors/Roles:** Driver
- **Purpose:** Xem số dư ví, lịch sử giao dịch, nạp tiền
- **Interface:** Trang ví với số dư, danh sách giao dịch, nút nạp tiền
- **Data Processing:**
  - Load wallet balance: GET `/api/driver/wallet/balance`
  - Load wallet transactions: GET `/api/driver/wallet/transactions?page=...&limit=10`
  - Load top-up packages: GET `/api/topup-packages?is_active=true`
  - Hiển thị: số dư, danh sách giao dịch (nạp tiền, thanh toán, hoàn tiền)

**Screen Layout:**
**[File: Wallet.tsx - Trang "Ví của tôi"]**
```
┌─────────────────────────────────────┐
│  Ví của tôi            [Nạp tiền]   │
├─────────────────────────────────────┤
│  Số dư: 500,000đ                    │
│  [🔄 Làm mới]                       │
│                                     │
│  Lịch sử giao dịch:                 │
│  ┌─────────────────────────────┐   │
│  │ ⬇️ Nạp tiền: Gói 200K       │   │
│  │    +200,000đ | 15/01/2025   │   │
│  ├─────────────────────────────┤   │
│  │ ⬆️ Thanh toán đổi pin        │   │
│  │    -100,000đ | 14/01/2025   │   │
│  ├─────────────────────────────┤   │
│  │ ⬇️ Hoàn tiền hủy đặt chỗ     │   │
│  │    +100,000đ | 13/01/2025   │   │
│  └─────────────────────────────┘   │
│                                     │
│  [< Trang trước] [1] [Trang sau >] │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Wallet balance: Phải >= 0
- **Business Logic:**
  - **Load balance:**
    - Gọi API GET `/api/driver/wallet/balance`
    - Hiển thị số dư với format VND (VD: 500,000đ)
  - **Load transactions:**
    - Gọi API GET `/api/driver/wallet/transactions?page=1&limit=10`
    - Hiển thị: loại giao dịch (nạp tiền/thanh toán/hoàn tiền), số tiền, thời gian
    - Sort theo `created_at DESC` (mới nhất trước)
  - **Transaction types:**
    - `topup`: Nạp tiền (màu xanh, icon ⬇️)
    - `payment`: Thanh toán đổi pin (màu đỏ, icon ⬆️)
    - `refund`: Hoàn tiền (màu xanh, icon ⬇️)
  - **Pagination:**
    - 10 items per page
    - Có nút "Trang trước" / "Trang sau"
  - **Click "Nạp tiền":**
    - Mở TopUpModal để chọn gói nạp tiền
- **Abnormal Cases:**
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"
  - Balance < 0 → Hiển thị cảnh báo "Số dư âm, vui lòng liên hệ admin"

#### b. Top-Up Wallet (Nạp tiền vào ví)

**Function Trigger:**
- Driver click "Nạp tiền" trong Wallet page → Mở TopUpModal
- Driver click "Nạp tiền" trong các trang khác (nếu số dư không đủ)

**Function Description:**
- **Actors/Roles:** Driver
- **Purpose:** Nạp tiền vào ví thông qua VNPay
- **Interface:** Modal chọn gói nạp tiền, redirect đến VNPay
- **Data Processing:**
  - Load top-up packages: GET `/api/topup-packages?is_active=true`
  - Chọn gói → Gọi API POST `/api/driver/wallet/topup` với `package_id`
  - Backend tạo payment URL VNPay → Redirect user đến VNPay
  - Sau khi thanh toán → VNPay redirect về `/payment/success` hoặc `/payment/error`
  - Backend xử lý return URL → Cập nhật wallet balance

**Screen Layout:**
**[File: TopUpModal.tsx - Modal "Nạp tiền"]**
```
┌─────────────────────────────────────┐
│  Nạp tiền vào ví                    │
├─────────────────────────────────────┤
│  Chọn gói nạp tiền:                 │
│                                     │
│  ┌─────────┐  ┌─────────┐         │
│  │ 200,000đ│  │ 500,000đ│         │
│  │ Nhận    │  │ Nhận    │         │
│  │ 200,000đ│  │ 550,000đ│         │
│  │         │  │ (+50K)  │         │
│  │ [Chọn]  │  │ [Chọn]  │         │
│  └─────────┘  └─────────┘         │
│                                     │
│  Hoặc nhập số tiền:                 │
│  [________] VND                     │
│                                     │
│  [Hủy] [Thanh toán VNPay]           │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Package ID: Phải chọn gói hoặc nhập số tiền
  - Amount: Nếu nhập số tiền → Tối thiểu 10,000đ, tối đa 10,000,000đ
- **Business Logic:**
  - **Load packages:**
    - Gọi API GET `/api/topup-packages?is_active=true`
    - Hiển thị danh sách gói với bonus (VD: Nạp 500K nhận 550K)
  - **Select package:**
    - Click gói → Chọn package_id
    - Hoặc nhập số tiền tùy ý
  - **Create payment:**
    - Gọi API POST `/api/driver/wallet/topup` với `package_id` hoặc `amount`
    - Backend tạo payment URL VNPay
    - Redirect user đến VNPay để thanh toán
  - **Payment return:**
    - VNPay redirect về `/payment/success` hoặc `/payment/error`
    - Backend xử lý return URL → Verify signature → Update wallet balance
    - Nếu thành công → Hiển thị "Nạp tiền thành công", refresh wallet balance
    - Nếu thất bại → Hiển thị "Thanh toán thất bại"
- **Abnormal Cases:**
  - VNPay timeout → Hiển thị "Thanh toán quá thời gian, vui lòng thử lại"
  - Payment failed → Hiển thị "Thanh toán thất bại, vui lòng thử lại"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

#### c. Service Packages (Gói dịch vụ)

**Function Trigger:**
- Driver click "Gói dịch vụ" trong sidebar → `/driver/subscriptions`

**Function Description:**
- **Actors/Roles:** Driver
- **Purpose:** Xem danh sách gói dịch vụ, đăng ký gói, hủy gói
- **Interface:** Trang danh sách gói với card layout, subscription status
- **Data Processing:**
  - Load packages: GET `/api/packages?is_active=true`
  - Load current subscription: GET `/api/driver/subscriptions?status=active`
  - Subscribe package: POST `/api/driver/subscriptions/packages/:id/subscribe`
  - Cancel subscription: PUT `/api/driver/subscriptions/:id/cancel`

**Screen Layout:**
**[File: ServicePackages.tsx - Trang "Gói dịch vụ"]**
```
┌─────────────────────────────────────┐
│  Gói dịch vụ                        │
├─────────────────────────────────────┤
│  Gói hiện tại:                      │
│  ┌─────────────────────────────┐  │
│  │ Gói Premium (30 ngày)         │  │
│  │ Còn lại: 15 ngày              │  │
│  │ Số lần đổi: 20/∞              │  │
│  │ [Hủy gói]                     │  │
│  └─────────────────────────────┘  │
│                                     │
│  Danh sách gói:                     │
│  ┌─────────┐  ┌─────────┐         │
│  │ Gói Basic│  │ Gói Pro │         │
│  │ 500K/30d │  │ 1M/30d  │         │
│  │ 10 lần   │  │ ∞ lần   │         │
│  │ [Đăng ký]│  │ [Đăng ký]│        │
│  └─────────┘  └─────────┘         │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Package ID: Phải chọn gói active
  - Wallet balance: Phải >= giá gói (nếu thanh toán bằng ví)
- **Business Logic:**
  - **Load packages:**
    - Gọi API GET `/api/packages?is_active=true`
    - Hiển thị: tên gói, giá, thời hạn, số lần đổi pin (limited/unlimited)
  - **Load current subscription:**
    - Gọi API GET `/api/driver/subscriptions?status=active`
    - Hiển thị: tên gói, ngày hết hạn, số lần đổi còn lại
  - **Subscribe package:**
    - Click "Đăng ký" → Xác nhận
    - Gọi API POST `/api/driver/subscriptions/packages/:id/subscribe`
    - Trừ tiền từ wallet (nếu không đủ → Báo lỗi)
    - Tạo subscription với status `active`
    - Nếu thành công → Refresh danh sách, hiển thị "Đăng ký thành công"
  - **Cancel subscription:**
    - Click "Hủy gói" → Hiển thị dialog xác nhận với thông tin hoàn tiền
    - Gọi API PUT `/api/driver/subscriptions/:id/cancel`
    - Tính proportional refund (theo tỷ lệ sử dụng)
    - Trừ cancellation fee 3%
    - Minimum refund 10,000đ
    - Hoàn tiền vào wallet
    - Set subscription status = `cancelled`
- **Abnormal Cases:**
  - Wallet không đủ → Hiển thị "Số dư không đủ, vui lòng nạp thêm"
  - Đã có subscription active → Không cho đăng ký gói mới, báo "Bạn đã có gói đang hoạt động"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

#### d. Transaction History (Lịch sử giao dịch đổi pin)

**Function Trigger:**
- Driver click "Giao dịch" trong sidebar → `/driver/transactions`

**Function Description:**
- **Actors/Roles:** Driver
- **Purpose:** Xem lịch sử giao dịch đổi pin (completed transactions)
- **Interface:** Trang danh sách transaction với filter, search, pagination
- **Data Processing:**
  - Load transactions: GET `/api/driver/transactions?page=...&limit=10&status=...`
  - Filter theo status: all, completed, pending, failed
  - Hiển thị: transaction code, station, vehicle, battery codes, amount, date, rating

**Screen Layout:**
**[File: TransactionHistory.tsx - Trang "Giao dịch"]**
```
┌─────────────────────────────────────┐
│  Giao dịch            [Tất cả ▼]    │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ TXN-001 | 15/01/2025 14:00   │   │
│  │ Trạm A - Quận 1              │   │
│  │ Xe: Tesla Model 3 (ABC-1234) │   │
│  │ Pin: BAT001 → BAT002          │   │
│  │ 100,000đ | ✅ Hoàn thành      │   │
│  │ [Đánh giá]                    │   │
│  ├─────────────────────────────┤   │
│  │ TXN-002 | 14/01/2025 10:00   │   │
│  │ Trạm B - Quận 2              │   │
│  │ Xe: BYD (XYZ-5678)           │   │
│  │ Pin: BAT003 → BAT004          │   │
│  │ 80,000đ | ✅ Hoàn thành      │   │
│  │ ⭐ 5.0 (Đã đánh giá)          │   │
│  └─────────────────────────────┘   │
│                                     │
│  [< Trang trước] [1] [Trang sau >] │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Status filter: all, completed, pending, failed
- **Business Logic:**
  - **Load transactions:**
    - Gọi API GET `/api/driver/transactions?page=1&limit=10&status=...`
    - Sort theo `swap_at DESC` hoặc `created_at DESC` (mới nhất trước)
    - Hiển thị: transaction code, station name, vehicle info, battery codes (old → new), amount, date, payment status
  - **Filter & Search:**
    - Filter theo status → Reload danh sách
    - Search theo transaction code hoặc station name (nếu có)
  - **Display battery codes:**
    - Hiển thị mã pin cũ và mới: "BAT001 → BAT002"
  - **Rating:**
    - Nếu chưa đánh giá → Hiển thị nút "Đánh giá"
    - Click "Đánh giá" → Mở RatingModal
    - Nếu đã đánh giá → Hiển thị số sao (VD: ⭐ 5.0)
  - **Pagination:**
    - 10 items per page
    - Có nút "Trang trước" / "Trang sau"
- **Abnormal Cases:**
  - Không có transaction → Hiển thị "Chưa có giao dịch nào"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

### 5. Driver Features - Support & Ratings

#### a. Support Tickets (Hỗ trợ)

**Function Trigger:**
- Driver click "Hỗ trợ" trong sidebar → `/driver/support`

**Function Description:**
- **Actors/Roles:** Driver
- **Purpose:** Tạo và quản lý ticket hỗ trợ (báo cáo vấn đề, khiếu nại)
- **Interface:** Trang danh sách ticket với form tạo mới, filter, search
- **Data Processing:**
  - Load tickets: GET `/api/support?status=...`
  - Create ticket: POST `/api/support` với subject, description, category, priority
  - Filter theo status: all, open, in_progress, resolved, closed
  - Search theo ticket number hoặc subject

**Screen Layout:**
**[File: SupportTickets.tsx - Trang "Hỗ trợ"]**
```
┌─────────────────────────────────────┐
│  Hỗ trợ                [+ Tạo ticket]│
│  [🔍 Tìm kiếm...] [Tất cả ▼]       │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ #TKT-001 | 15/01/2025       │   │
│  │ Vấn đề về Pin: Pin không sạc │   │
│  │ Trạng thái: [Đang xử lý]    │   │
│  │ Ưu tiên: Trung bình          │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Modal: Tạo ticket mới]            │
│  - Danh mục: [Vấn đề về Pin ▼]     │
│  - Mô tả: [________________]        │
│  │        [________________]        │
│  │        [________________]        │
│  [Hủy] [Gửi ticket]                 │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Category: Phải chọn (battery_issue, station_issue, payment_issue, service_complaint, other)
  - Description: Không được để trống, tối thiểu 10 ký tự
  - Subject: Tự động tạo từ category + phần đầu description
- **Business Logic:**
  - **Load tickets:**
    - Gọi API GET `/api/support?status=...`
    - Hiển thị: ticket number, subject, category, priority, status, created_at
    - Sort theo `created_at DESC` (mới nhất trước)
  - **Create ticket:**
    - Click "+ Tạo ticket" → Mở dialog
    - Chọn category → Nhập description
    - Tự động tạo subject: "{Category}: {Description preview}"
    - Priority mặc định: `medium`
    - Gọi API POST `/api/support` với {subject, description, category, priority}
    - Nếu thành công → Refresh danh sách, đóng dialog
  - **Filter & Search:**
    - Filter theo status → Reload danh sách
    - Search theo ticket number hoặc subject → Debounce 500ms
- **Abnormal Cases:**
  - Description quá ngắn → Hiển thị "Mô tả phải có ít nhất 10 ký tự"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"
  - Create fail → Hiển thị "Tạo ticket thất bại, vui lòng thử lại"

#### b. Station Rating (Đánh giá trạm)

**Function Trigger:**
- Driver click "Đánh giá dịch vụ" trong sidebar → `/driver/ratings`
- Driver click "Đánh giá" trong Transaction History → Mở RatingModal

**Function Description:**
- **Actors/Roles:** Driver
- **Purpose:** Đánh giá trạm sau khi hoàn thành giao dịch đổi pin
- **Interface:** 
  - Trang danh sách đánh giá đã tạo (StationRating.tsx)
  - Modal đánh giá (RatingModal.tsx) - mở từ Transaction History
- **Data Processing:**
  - Load ratings: GET `/api/ratings` (ratings của user)
  - Create rating: POST `/api/ratings` với station_id, transaction_id, rating (1-5), comment
  - Hiển thị: station name, transaction code, rating, comment, date

**Screen Layout:**
**[File: StationRating.tsx - Trang "Đánh giá dịch vụ"]**
```
┌─────────────────────────────────────┐
│  Đánh giá dịch vụ                   │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ ⭐⭐⭐⭐⭐ 5.0                │   │
│  │ Trạm A - Quận 1              │   │
│  │ TXN-001 | 15/01/2025 14:00   │   │
│  │ "Dịch vụ tốt, nhân viên thân │   │
│  │  thiện"                      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ⭐⭐⭐⭐ 4.0                  │   │
│  │ Trạm B - Quận 2              │   │
│  │ TXN-002 | 14/01/2025 10:00   │   │
│  │ "Tốt nhưng hơi xa"           │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Screen Layout (Modal):**
**[File: RatingModal.tsx - Modal "Đánh giá"]**
```
┌─────────────────────────────────────┐
│  Đánh giá dịch vụ                   │
│  Trạm: Trạm A - Quận 1             │
│  Giao dịch: TXN-001                │
├─────────────────────────────────────┤
│  Chọn số sao:                       │
│  ⭐ ⭐ ⭐ ⭐ ⭐ (hover để chọn)     │
│                                     │
│  Nhận xét (tùy chọn):              │
│  [________________]                 │
│  [________________]                 │
│                                     │
│  [Hủy] [Gửi đánh giá]               │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Rating: Phải chọn từ 1-5 sao
  - Comment: Tùy chọn, tối đa 500 ký tự
  - Transaction ID: Phải tồn tại và đã completed
  - Station ID: Phải tồn tại
- **Business Logic:**
  - **Load ratings:**
    - Gọi API GET `/api/ratings` (chỉ ratings của user hiện tại)
    - Hiển thị: số sao, station name, transaction code, comment, date
    - Sort theo `created_at DESC` (mới nhất trước)
  - **Create rating:**
    - Click "Đánh giá" trong Transaction History → Mở RatingModal
    - Chọn số sao (1-5) → Nhập comment (tùy chọn)
    - Gọi API POST `/api/ratings` với {station_id, transaction_id, rating, comment}
    - Nếu thành công → Refresh danh sách, đóng modal
    - Mỗi transaction chỉ được đánh giá 1 lần
  - **Display rating:**
    - Hiển thị số sao dạng icon (⭐⭐⭐⭐⭐)
    - Hiển thị comment nếu có
    - Hiển thị station name và transaction code
- **Abnormal Cases:**
  - Chưa chọn số sao → Hiển thị "Vui lòng chọn số sao đánh giá"
  - Transaction đã được đánh giá → Không cho đánh giá lại, báo "Giao dịch này đã được đánh giá"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"
  - Transaction chưa completed → Không cho đánh giá, báo "Chỉ có thể đánh giá giao dịch đã hoàn thành"

### 6. Staff Features - Dashboard, Inventory & Transactions

#### a. Staff Dashboard (Tổng quan)

**Function Trigger:**
- Staff đăng nhập → Redirect đến `/staff/home`
- Staff click "Tổng quan" trong sidebar → `/staff/home`

**Function Description:**
- **Actors/Roles:** Staff
- **Purpose:** Xem tổng quan trạm: số pin, booking queue, giao dịch gần đây
- **Interface:** Dashboard với statistics cards, booking queue, recent transactions
- **Data Processing:**
  - Load batteries: GET `/api/staff/batteries` → Tính stats (total, available, charging, maintenance, damaged)
  - Load pending bookings: GET `/api/staff/bookings?status=pending&limit=10`
  - Load recent completed bookings: GET `/api/staff/bookings?status=completed&page=1&limit=5`
  - Auto-refresh mỗi 30 giây (có thể bật/tắt)

**Screen Layout:**
**[File: StaffHome.tsx - Trang "Tổng quan" (Staff)]**
```
┌─────────────────────────────────────┐
│  Tổng quan - Trạm A                 │
│  [🔄 Tự động làm mới: BẬT]           │
├─────────────────────────────────────┤
│  Thống kê pin:                       │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ 50  │ │ 30  │ │ 10  │           │
│  │ Tổng│ │ Sẵn │ │ Đang│           │
│  │     │ │ sàng│ │ sạc │           │
│  └─────┘ └─────┘ └─────┘           │
│                                     │
│  Hàng đợi hiện tại: 5 đặt chỗ       │
│  ┌─────────────────────────────┐   │
│  │ #BK-001 | 15/01 14:00        │   │
│  │ Xe: ABC-1234 | [Xác nhận]    │   │
│  └─────────────────────────────┘   │
│                                     │
│  Giao dịch gần đây:                 │
│  ┌─────────────────────────────┐   │
│  │ #TXN-001 | 15/01 13:00       │   │
│  │ Pin: BAT001 → BAT002          │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Staff phải có `station_id` (được assign vào trạm)
- **Business Logic:**
  - **Load statistics:**
    - Tính tổng số pin, pin sẵn sàng (full), đang sạc (charging), bảo trì (maintenance), hỏng (damaged)
    - Tính tỷ lệ sử dụng pin: `(total - available) / total * 100`
  - **Load booking queue:**
    - Lấy bookings với status `pending` → Sort theo `scheduled_at ASC` (sớm nhất trước)
    - Hiển thị tối đa 10 bookings
  - **Load recent transactions:**
    - Lấy bookings với status `completed` → Sort theo `swap_at DESC` (mới nhất trước)
    - Pagination: 5 items per page
  - **Auto-refresh:**
    - Mặc định bật, refresh mỗi 30 giây
    - Có nút bật/tắt auto-refresh
    - Hiển thị thời gian refresh cuối cùng
- **Abnormal Cases:**
  - Staff chưa được assign trạm → Hiển thị "Bạn chưa được gán vào trạm nào"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

#### b. Battery Inventory (Kho pin)

**Function Trigger:**
- Staff click "Kho pin" trong sidebar → `/staff/inventory`

**Function Description:**
- **Actors/Roles:** Staff
- **Purpose:** Quản lý pin tại trạm (CRUD: Create, Read, Update, Delete)
- **Interface:** Trang danh sách pin với filter, search, sort, pagination
- **Data Processing:**
  - Load batteries: GET `/api/staff/batteries` → Filter, search, sort, paginate
  - Add battery: POST `/api/staff/batteries` với battery_code, model, status, current_charge
  - Update battery: PUT `/api/staff/batteries/:id` với status, current_charge, health_percentage
  - Delete battery: DELETE `/api/staff/batteries/:id`

**Screen Layout:**
**[File: BatteryInventory.tsx - Trang "Kho pin"]**
```
┌─────────────────────────────────────┐
│  Kho pin                [+ Thêm pin]│
│  [🔍 Tìm kiếm...] [Tất cả ▼]        │
├─────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐         │
│  │ BAT001  │  │ BAT002  │         │
│  │ Model:  │  │ Model:  │         │
│  │ Tesla   │  │ BYD     │         │
│  │ Status: │  │ Status: │         │
│  │ Full    │  │ Charging│         │
│  │ 100%    │  │ 75%     │         │
│  │ [✏️][🗑️]│  │ [✏️][🗑️]│         │
│  └─────────┘  └─────────┘         │
│                                     │
│  [< Trang trước] [1] [Trang sau >] │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Battery code: Không được để trống, format hợp lệ, không trùng
  - Model: Phải chọn từ danh sách có sẵn
  - Status: full, charging, in_use, reserved, damaged, maintenance
  - Current charge: 0-100%
  - Health percentage: 0-100% (tùy chọn)
- **Business Logic:**
  - **Load batteries:**
    - Gọi API GET `/api/staff/batteries`
    - Filter theo status, model
    - Search theo battery code
    - Sort theo field (code, model, status, charge, created_at, health)
    - Pagination: 12 items per page
  - **Add battery:**
    - Click "+ Thêm pin" → Mở AddBatteryDialog
    - Nhập battery code, chọn model, status, charge
    - Gọi API POST `/api/staff/batteries`
    - Nếu thành công → Refresh danh sách
  - **Update battery:**
    - Click "✏️" → Mở dialog chỉnh sửa
    - Cập nhật status, charge, health
    - Gọi API PUT `/api/staff/batteries/:id`
    - Nếu thành công → Refresh danh sách
  - **Delete battery:**
    - Click "🗑️" → Xác nhận xóa
    - Gọi API DELETE `/api/staff/batteries/:id`
    - Nếu pin đang `in_use` hoặc `reserved` → Không cho xóa
- **Abnormal Cases:**
  - Battery code trùng → Hiển thị "Mã pin đã tồn tại"
  - Pin đang sử dụng → Không cho xóa, báo "Không thể xóa pin đang sử dụng"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

#### c. Swap Transactions (Giao dịch thay pin)

**Function Trigger:**
- Staff click "Giao dịch thay pin" trong sidebar → `/staff/transactions`

**Function Description:**
- **Actors/Roles:** Staff
- **Purpose:** Xử lý bookings: xác nhận, hoàn thành, hủy
- **Interface:** Trang danh sách booking với filter, search, sort, actions
- **Data Processing:**
  - Load bookings: GET `/api/staff/bookings?status=...&page=...&limit=10`
  - Confirm booking: POST `/api/staff/bookings/:id/confirm` với phone verification
  - Complete booking: POST `/api/staff/bookings/:id/complete` với old_battery_code, new_battery_code
  - Cancel booking: PUT `/api/staff/bookings/:id/cancel` với reason
  - Load available batteries: GET `/api/staff/bookings/:id/available-batteries`

**Screen Layout:**
**[File: SwapTransactions.tsx - Trang "Giao dịch thay pin"]**
```
┌─────────────────────────────────────┐
│  Giao dịch thay pin                  │
│  [🔍 Tìm kiếm...] [Tất cả ▼]        │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ #BK-001 | 15/01 14:00        │   │
│  │ Xe: ABC-1234 | Tesla Model 3 │   │
│  │ Khách: Nguyễn Văn A          │   │
│  │ [Đang chờ xác nhận]          │   │
│  │ [Xác nhận] [Hủy]             │   │
│  ├─────────────────────────────┤   │
│  │ #BK-002 | 15/01 13:00        │   │
│  │ Xe: XYZ-5678 | BYD           │   │
│  │ Pin cũ: BAT001               │   │
│  │ Pin mới: [BAT002 ▼]          │   │
│  │ [Hoàn thành]                 │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Phone verification: Phải nhập đúng số điện thoại của driver
  - Old battery code: Phải tồn tại và đang `in_use` trên vehicle
  - New battery code: Phải compatible với vehicle, status = `full`, available
  - Cancel reason: Không được để trống khi hủy
- **Business Logic:**
  - **Load bookings:**
    - Gọi API GET `/api/staff/bookings?status=...&page=1&limit=1000` (fetch tất cả để client-side filter)
    - Filter theo status: all, pending, confirmed, completed, cancelled
    - Search theo booking code, user name, vehicle license plate
    - Sort theo field (scheduled_at, created_at, user_name, booking_code)
    - Sort order: ASC/DESC
  - **Confirm booking:**
    - Click "Xác nhận" → Mở dialog
    - Nhập số điện thoại driver để verify
    - Gọi API POST `/api/staff/bookings/:id/confirm` với `phone`
    - Nếu thành công → Set status = `confirmed`, refresh danh sách
  - **Complete booking:**
    - Click "Hoàn thành" → Mở dialog
    - Auto-fill old battery code từ vehicle (nếu có)
    - Load available batteries: GET `/api/staff/bookings/:id/available-batteries`
    - Chọn new battery code từ dropdown (compatible, full, available)
    - Gọi API POST `/api/staff/bookings/:id/complete` với `old_battery_code`, `new_battery_code`
    - Update battery status:
      - Old battery → `charging` (nếu good) hoặc `damaged`/`maintenance` (nếu có vấn đề)
      - New battery → `in_use`
    - Trừ tiền từ wallet hoặc trừ subscription
    - Set status = `completed`, tạo transaction
  - **Cancel booking:**
    - Click "Hủy" → Mở dialog
    - Nhập lý do hủy
    - Gọi API PUT `/api/staff/bookings/:id/cancel` với `reason`
    - Release wallet lock hoặc subscription lock
    - Set status = `cancelled`
  - **Auto-refresh:**
    - Mặc định bật, refresh mỗi 30 giây
- **Abnormal Cases:**
  - Phone không đúng → Hiển thị "Số điện thoại không khớp"
  - Old battery không tồn tại → Hiển thị "Mã pin cũ không tồn tại"
  - New battery không available → Hiển thị "Pin không còn sẵn sàng"
  - Wallet không đủ → Hiển thị "Số dư ví không đủ" (nhưng vẫn hoàn thành nếu dùng subscription)
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

### 7. Staff Features - Schedule & Profile

#### a. Work Schedule (Lịch làm việc)

**Function Trigger:**
- Staff click "Lịch làm việc" trong sidebar → `/staff/schedule`

**Function Description:**
- **Actors/Roles:** Staff
- **Purpose:** Xem lịch làm việc được Admin assign, cập nhật trạng thái ca làm việc
- **Interface:** Trang lịch với calendar view, danh sách ca làm việc, filter
- **Data Processing:**
  - Load schedules: GET `/api/staff/schedules?status=...&date_from=...&date_to=...`
  - Update schedule status: PUT `/api/staff/schedules/:id/status` với status (completed, absent, cancelled)
  - Hiển thị: shift_start, shift_end, status, station name, total hours

**Screen Layout:**
**[File: WorkSchedule.tsx - Trang "Lịch làm việc"]**
```
┌─────────────────────────────────────┐
│  Lịch làm việc                       │
│  [Tất cả ▼] [Từ ngày] [Đến ngày]    │
├─────────────────────────────────────┤
│  [Calendar - Highlight ngày có ca]  │
│                                     │
│  Danh sách ca làm việc:             │
│  ┌─────────────────────────────┐   │
│  │ 15/01/2025 | 7:00 - 15:00    │   │
│  │ Trạm A - Quận 1              │   │
│  │ [Đã hoàn thành]              │   │
│  ├─────────────────────────────┤   │
│  │ 16/01/2025 | 15:00 - 22:00  │   │
│  │ Trạm A - Quận 1              │   │
│  │ [Đã lên lịch]                │   │
│  └─────────────────────────────┘   │
│                                     │
│  Tổng giờ làm việc tuần này: 40h    │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Status: scheduled, completed, absent, cancelled
  - Date range: date_from <= date_to
- **Business Logic:**
  - **Load schedules:**
    - Gọi API GET `/api/staff/schedules?status=...&date_from=...&date_to=...`
    - Filter theo status, date range
    - Highlight ngày có ca trong calendar
    - Sort theo `shift_start ASC` (sớm nhất trước)
  - **Update status:**
    - Click vào ca làm việc → Có thể cập nhật status (nếu chưa quá thời gian)
    - Gọi API PUT `/api/staff/schedules/:id/status` với status mới
    - Nếu thành công → Refresh danh sách
  - **Calculate total hours:**
    - Tính tổng giờ làm việc tuần này (chỉ tính ca `completed`)
    - Hiển thị tổng giờ
- **Abnormal Cases:**
  - Không có lịch → Hiển thị "Chưa có lịch làm việc"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

#### b. Personal Profile (Hồ sơ cá nhân)

**Function Trigger:**
- Staff click "Hồ sơ cá nhân" trong sidebar → `/staff/profile`

**Function Description:**
- **Actors/Roles:** Staff
- **Purpose:** Xem và cập nhật thông tin cá nhân, đổi mật khẩu
- **Interface:** Trang profile với form chỉnh sửa (tương tự Driver Profile)
- **Data Processing:**
  - Load profile: GET `/api/auth/me` → Hiển thị full_name, email, phone, avatar
  - Update profile: PUT `/api/auth/profile` với full_name, phone, avatar
  - Change password: POST `/api/auth/change-password` với current_password, new_password

**Screen Layout:**
**[File: PersonalProfile.tsx - Trang "Hồ sơ cá nhân" (Staff)]**
```
┌─────────────────────────────────────┐
│  Hồ sơ cá nhân                       │
├─────────────────────────────────────┤
│  [Avatar] [📷]                      │
│  Tên: [________________] [✏️]      │
│  Email: user@example.com (readonly)  │
│  Số điện thoại: [________________]  │
│                                     │
│  [Đổi mật khẩu]                     │
│  [Lưu thay đổi]                     │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Full name: Không được để trống, tối thiểu 2 ký tự
  - Phone: Format số điện thoại Việt Nam
  - Avatar: File ảnh (jpg, png), tối đa 5MB
  - Current password: Phải đúng với password hiện tại
  - New password: Tối thiểu 6 ký tự, khác current password
  - Confirm password: Phải khớp với new password
- **Business Logic:**
  - **Load profile:**
    - Gọi API GET `/api/auth/me`
    - Hiển thị thông tin user
  - **Update profile:**
    - Click "✏️" → Chế độ chỉnh sửa
    - Upload avatar → Upload lên Cloudinary
    - Click "Lưu thay đổi" → Gọi API PUT `/api/auth/profile`
    - Nếu thành công → Refresh profile, hiển thị "Cập nhật thành công"
  - **Change password:**
    - Click "Đổi mật khẩu" → Mở dialog
    - Nhập current password, new password, confirm password
    - Gọi API POST `/api/auth/change-password`
    - Nếu thành công → Đóng dialog, hiển thị "Đổi mật khẩu thành công"
- **Abnormal Cases:**
  - Current password sai → Hiển thị "Mật khẩu hiện tại không đúng"
  - New password không khớp → Hiển thị "Mật khẩu mới không khớp"
  - Avatar upload fail → Hiển thị "Lỗi upload ảnh, vui lòng thử lại"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

### 8. Admin Features - Dashboard, Station & Pricing Management

#### a. Admin Dashboard (Bảng điều khiển)

**Function Trigger:**
- Admin đăng nhập → Redirect đến `/admin/home`
- Admin click "Bảng điều khiển" trong sidebar → `/admin/home`

**Function Description:**
- **Actors/Roles:** Admin
- **Purpose:** Xem tổng quan hệ thống: statistics, trends, charts
- **Interface:** Dashboard với statistics cards, charts, recent activities
- **Data Processing:**
  - Load stats: GET `/api/admin/dashboard/stats?period=day|week|month`
  - Hiển thị: total users, total stations, total bookings, total revenue, trends

**Screen Layout:**
**[File: AdminHome.tsx - Trang "Bảng điều khiển" (Admin)]**
```
┌─────────────────────────────────────┐
│  Bảng điều khiển    [Ngày ▼]       │
├─────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 1000│ │  50 │ │ 500 │ │ 50M │  │
│  │ Users│ │Sta- │ │Book-│ │Revenue│ │
│  │ +5%  │ │tions│ │ings │ │ +10% │  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│                                     │
│  [Charts: Bookings, Revenue]        │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Period: day, week, month
- **Business Logic:**
  - **Load statistics:**
    - Gọi API GET `/api/admin/dashboard/stats?period=...`
    - Hiển thị: total users, total stations, total bookings, total revenue
    - Tính trends (so với kỳ trước): +X% hoặc -X%
  - **Charts:**
    - Hiển thị biểu đồ bookings theo thời gian
    - Hiển thị biểu đồ revenue theo thời gian
- **Abnormal Cases:**
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

#### b. Station Management (Quản lý trạm)

**Function Trigger:**
- Admin click "Quản lý trạm" trong sidebar → `/admin/stations`

**Function Description:**
- **Actors/Roles:** Admin
- **Purpose:** Quản lý trạm (CRUD: Create, Read, Update, Delete)
- **Interface:** Trang danh sách trạm với form thêm/sửa, filter, search
- **Data Processing:**
  - Load stations: GET `/api/admin/stations?search=...&status=...`
  - Create station: POST `/api/admin/stations` với name, address, phone, images
  - Update station: PUT `/api/admin/stations/:id` với thông tin cập nhật
  - Delete station: DELETE `/api/admin/stations/:id`

**Screen Layout:**
**[File: StationManagement.tsx - Trang "Quản lý trạm"]**
```
┌─────────────────────────────────────┐
│  Quản lý trạm          [+ Thêm trạm]│
│  [🔍 Tìm kiếm...] [Tất cả ▼]        │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ Trạm A - Quận 1              │   │
│  │ 📍 123 Đường ABC             │   │
│  │ 📞 0901234567                │   │
│  │ 🔋 15 pin | ⭐ 4.5           │   │
│  │ [✏️] [🗑️] [👁️]              │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Name: Không được để trống
  - Address: Không được để trống
  - Phone: Format số điện thoại Việt Nam
  - Images: File ảnh (jpg, png), tối đa 5MB mỗi ảnh
- **Business Logic:**
  - **Load stations:**
    - Gọi API GET `/api/admin/stations?search=...&status=...`
    - Filter theo status, search theo tên/địa chỉ
    - Hiển thị: name, address, phone, battery stats, rating
  - **Create/Update station:**
    - Click "+ Thêm trạm" hoặc "✏️" → Mở StationForm
    - Upload images lên Cloudinary
    - Gọi API POST/PUT `/api/admin/stations`
    - Nếu thành công → Refresh danh sách
  - **Delete station:**
    - Click "🗑️" → Xác nhận xóa
    - Gọi API DELETE `/api/admin/stations/:id`
    - Nếu trạm có bookings active → Không cho xóa
- **Abnormal Cases:**
  - Station có bookings active → Không cho xóa, báo "Không thể xóa trạm đang có đặt chỗ"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

#### c. Battery Pricing Management (Quản lý giá pin)

**Function Trigger:**
- Admin click "Quản lý giá pin" trong sidebar → `/admin/battery-pricing`

**Function Description:**
- **Actors/Roles:** Admin
- **Purpose:** Quản lý giá đổi pin theo model (CRUD)
- **Interface:** Trang danh sách pricing với form thêm/sửa, tabs (Pricing, Transfer, Warehouse)
- **Data Processing:**
  - Load pricings: GET `/api/admin/pricing?is_active=...`
  - Create pricing: POST `/api/admin/pricing` với battery_model, price, is_active
  - Update pricing: PUT `/api/admin/pricing/:id` với price, is_active
  - Delete pricing: DELETE `/api/admin/pricing/:id`

**Screen Layout:**
**[File: BatteryPricingManagement.tsx - Trang "Quản lý giá pin"]**
```
┌─────────────────────────────────────┐
│  Quản lý giá pin                    │
│  [Pricing] [Transfer] [Warehouse]   │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ Tesla Model 3 Battery        │   │
│  │ 100,000đ | ✅ Active         │   │
│  │ [✏️] [🗑️]                   │   │
│  ├─────────────────────────────┤   │
│  │ BYD Battery                  │   │
│  │ 80,000đ | ✅ Active          │   │
│  │ [✏️] [🗑️]                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  [+ Thêm giá mới]                   │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Battery model: Không được để trống, không trùng
  - Price: Phải > 0, tối thiểu 10,000đ
  - Is active: Boolean
- **Business Logic:**
  - **Load pricings:**
    - Gọi API GET `/api/admin/pricing?is_active=...`
    - Filter theo is_active, search theo model
    - Hiển thị: battery_model, price, is_active
  - **Create/Update pricing:**
    - Click "+ Thêm giá mới" hoặc "✏️" → Mở form
    - Chọn battery model, nhập price, chọn is_active
    - Gọi API POST/PUT `/api/admin/pricing`
    - Nếu thành công → Refresh danh sách
  - **Delete pricing:**
    - Click "🗑️" → Xác nhận xóa
    - Gọi API DELETE `/api/admin/pricing/:id`
- **Abnormal Cases:**
  - Battery model trùng → Hiển thị "Model pin đã có giá"
  - Price <= 0 → Hiển thị "Giá phải lớn hơn 0"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

### 9. Admin Features - User, Staff & Package Management

#### a. User Management (Quản lý người dùng)

**Function Trigger:**
- Admin click "Quản lý người dùng" trong sidebar → `/admin/users`

**Function Description:**
- **Actors/Roles:** Admin
- **Purpose:** Quản lý users (CRUD: Create, Read, Update, Delete), update role, status
- **Interface:** Trang danh sách users với form thêm/sửa, filter, search
- **Data Processing:**
  - Load users: GET `/api/admin/users?role=...&status=...&search=...`
  - Create user: POST `/api/admin/users` với email, full_name, password, role, phone
  - Update user role: PUT `/api/admin/users/:id/role` với role mới
  - Update user status: PUT `/api/admin/users/:id/status` với status (active, inactive)
  - Delete user: DELETE `/api/admin/users/:id`

**Screen Layout:**
**[File: UserManagement.tsx - Trang "Quản lý người dùng"]**
```
┌─────────────────────────────────────┐
│  Quản lý người dùng  [+ Thêm user]  │
│  [🔍 Tìm kiếm...] [Tất cả ▼]        │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ Nguyễn Văn A                 │   │
│  │ user@example.com             │   │
│  │ DRIVER | ✅ Active            │   │
│  │ [Đổi role] [Khóa] [🗑️]       │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Email: Format hợp lệ, không trùng
  - Full name: Không được để trống
  - Password: Tối thiểu 6 ký tự
  - Role: DRIVER, STAFF, ADMIN
  - Phone: Format số điện thoại Việt Nam
- **Business Logic:**
  - **Load users:**
    - Gọi API GET `/api/admin/users?role=...&status=...&search=...`
    - Filter theo role, status, search theo email/name
    - Hiển thị: full_name, email, role, status
  - **Create user:**
    - Click "+ Thêm user" → Mở dialog
    - Nhập email, full_name, password, chọn role, phone
    - Gọi API POST `/api/admin/users`
    - Nếu thành công → Refresh danh sách
  - **Update role/status:**
    - Click "Đổi role" hoặc "Khóa" → Cập nhật
    - Gọi API PUT `/api/admin/users/:id/role` hoặc `/api/admin/users/:id/status`
  - **Delete user:**
    - Click "🗑️" → Xác nhận xóa
    - Gọi API DELETE `/api/admin/users/:id`
- **Abnormal Cases:**
  - Email trùng → Hiển thị "Email đã được sử dụng"
  - User có bookings active → Không cho xóa
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

#### b. Staff Management (Quản lý nhân viên)

**Function Trigger:**
- Admin click "Quản lý nhân viên" trong sidebar → `/admin/employees`

**Function Description:**
- **Actors/Roles:** Admin
- **Purpose:** Quản lý staff (CRUD), assign staff vào trạm
- **Interface:** Trang danh sách staff với form thêm/sửa, filter
- **Data Processing:**
  - Load staff: GET `/api/admin/staff?station_id=...&search=...`
  - Create staff: POST `/api/admin/staff` với user_id, station_id
  - Update staff: PUT `/api/admin/staff/:id` với station_id
  - Delete staff: DELETE `/api/admin/staff/:id`

**Screen Layout:**
**[File: StaffManagement.tsx - Trang "Quản lý nhân viên"]**
```
┌─────────────────────────────────────┐
│  Quản lý nhân viên   [+ Thêm nhân viên]│
│  [🔍 Tìm kiếm...]                    │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ Nguyễn Văn B                 │   │
│  │ staff@example.com             │   │
│  │ Trạm A - Quận 1              │   │
│  │ [✏️] [🗑️]                   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - User ID: Phải tồn tại và role = STAFF
  - Station ID: Phải tồn tại
- **Business Logic:**
  - **Load staff:**
    - Gọi API GET `/api/admin/staff?station_id=...&search=...`
    - Filter theo station, search theo name/email
    - Hiển thị: full_name, email, station name
  - **Create/Update staff:**
    - Click "+ Thêm nhân viên" hoặc "✏️" → Mở StaffForm
    - Chọn user (role = STAFF), chọn station
    - Gọi API POST/PUT `/api/admin/staff`
    - Nếu thành công → Refresh danh sách
  - **Delete staff:**
    - Click "🗑️" → Xác nhận xóa
    - Gọi API DELETE `/api/admin/staff/:id`
- **Abnormal Cases:**
  - User không phải STAFF → Hiển thị "User phải có role STAFF"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

#### c. Service Package Management (Quản lý gói dịch vụ)

**Function Trigger:**
- Admin click "Quản lý gói dịch vụ" trong sidebar → `/admin/service-packages`

**Function Description:**
- **Actors/Roles:** Admin
- **Purpose:** Quản lý service packages (CRUD)
- **Interface:** Trang danh sách packages với form thêm/sửa, filter
- **Data Processing:**
  - Load packages: GET `/api/admin/packages?is_active=...`
  - Create package: POST `/api/admin/packages` với name, description, price, duration_days, swap_limit, battery_models
  - Update package: PUT `/api/admin/packages/:id` với thông tin cập nhật
  - Delete package: DELETE `/api/admin/packages/:id`

**Screen Layout:**
**[File: AdminServicePackageManagement.tsx - Trang "Quản lý gói dịch vụ"]**
```
┌─────────────────────────────────────┐
│  Quản lý gói dịch vụ  [+ Thêm gói]  │
│  [🔍 Tìm kiếm...] [Tất cả ▼]        │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ Gói Premium                  │   │
│  │ 1,000,000đ / 30 ngày         │   │
│  │ ∞ lần đổi pin                │   │
│  │ ✅ Active                    │   │
│  │ [✏️] [🗑️]                   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Name: Không được để trống
  - Price: Phải > 0
  - Duration days: Phải > 0
  - Swap limit: null (unlimited) hoặc > 0
  - Battery models: Array of strings (tùy chọn)
- **Business Logic:**
  - **Load packages:**
    - Gọi API GET `/api/admin/packages?is_active=...`
    - Filter theo is_active, search theo name
    - Hiển thị: name, price, duration, swap_limit, is_active
  - **Create/Update package:**
    - Click "+ Thêm gói" hoặc "✏️" → Mở form
    - Nhập name, description, price, duration_days, swap_limit, battery_models
    - Gọi API POST/PUT `/api/admin/packages`
    - Nếu thành công → Refresh danh sách
  - **Delete package:**
    - Click "🗑️" → Xác nhận xóa
    - Gọi API DELETE `/api/admin/packages/:id`
    - Nếu package có subscriptions active → Không cho xóa
- **Abnormal Cases:**
  - Package có subscriptions active → Không cho xóa, báo "Không thể xóa gói đang có người đăng ký"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

#### d. Top-Up Package Management (Quản lý gói nạp tiền)

**Function Trigger:**
- Admin click "Quản lý gói nạp tiền" trong sidebar → `/admin/topup-packages`

**Function Description:**
- **Actors/Roles:** Admin
- **Purpose:** Quản lý top-up packages (CRUD)
- **Interface:** Trang danh sách top-up packages với form thêm/sửa
- **Data Processing:**
  - Load packages: GET `/api/admin/topup-packages?is_active=...`
  - Create package: POST `/api/admin/topup-packages` với name, description, topup_amount, bonus_amount, is_active
  - Update package: PUT `/api/admin/topup-packages/:id` với thông tin cập nhật
  - Delete package: DELETE `/api/admin/topup-packages/:id`

**Screen Layout:**
**[File: TopUpPackageManagement.tsx - Trang "Quản lý gói nạp tiền"]**
```
┌─────────────────────────────────────┐
│  Quản lý gói nạp tiền  [+ Thêm gói] │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ Gói 500K                     │   │
│  │ Nạp 500,000đ → Nhận 550,000đ│   │
│  │ (+50,000đ bonus)             │   │
│  │ ✅ Active                    │   │
│  │ [✏️] [🗑️]                   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Name: Không được để trống
  - Topup amount: Phải > 0, tối thiểu 10,000đ
  - Bonus amount: >= 0
  - Is active: Boolean
- **Business Logic:**
  - **Load packages:**
    - Gọi API GET `/api/admin/topup-packages?is_active=...`
    - Filter theo is_active, search theo name
    - Hiển thị: name, topup_amount, bonus_amount, is_active
  - **Create/Update package:**
    - Click "+ Thêm gói" hoặc "✏️" → Mở form
    - Nhập name, description, topup_amount, bonus_amount, is_active
    - Gọi API POST/PUT `/api/admin/topup-packages`
    - Nếu thành công → Refresh danh sách
  - **Delete package:**
    - Click "🗑️" → Xác nhận xóa
    - Gọi API DELETE `/api/admin/topup-packages/:id`
- **Abnormal Cases:**
  - Topup amount <= 0 → Hiển thị "Số tiền nạp phải lớn hơn 0"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

### 10. Admin Features - Support, Reports & Analytics

#### a. Support Management (Quản lý hỗ trợ)

**Function Trigger:**
- Admin click "Quản lý hỗ trợ" trong sidebar → `/admin/support`

**Function Description:**
- **Actors/Roles:** Admin
- **Purpose:** Quản lý support tickets từ users, assign staff, reply, update status
- **Interface:** Trang danh sách tickets với filter, search, detail view, reply form
- **Data Processing:**
  - Load tickets: GET `/api/admin/support?status=...&priority=...&assigned_to=...`
  - Get ticket details: GET `/api/admin/support/:id` với replies
  - Assign ticket: PUT `/api/admin/support/:id/assign` với staff_id
  - Reply ticket: POST `/api/admin/support/:id/reply` với message
  - Update status: PUT `/api/admin/support/:id/status` với status (open, in_progress, resolved, closed)

**Screen Layout:**
**[File: AdminSupportManagement.tsx - Trang "Quản lý hỗ trợ"]**
```
┌─────────────────────────────────────┐
│  Quản lý hỗ trợ                    │
│  [🔍 Tìm kiếm...] [Tất cả ▼]       │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ #TKT-001 | Vấn đề về Pin     │   │
│  │ User: Nguyễn Văn A          │   │
│  │ Trạng thái: [Đang xử lý]    │   │
│  │ Gán cho: Nhân viên B        │   │
│  │ [Xem chi tiết] [Phản hồi]   │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Modal: Chi tiết ticket]           │
│  - Mô tả: ...                      │
│  - Phản hồi: [________________]     │
│  - [Gửi phản hồi]                   │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Status: open, in_progress, resolved, closed
  - Priority: low, medium, high, urgent
  - Reply message: Không được để trống
- **Business Logic:**
  - **Load tickets:**
    - Gọi API GET `/api/admin/support?status=...&priority=...&assigned_to=...`
    - Filter theo status, priority, assigned staff
    - Search theo ticket number, subject, user name
    - Sort theo `created_at DESC` (mới nhất trước)
  - **Assign ticket:**
    - Click "Gán cho" → Chọn staff
    - Gọi API PUT `/api/admin/support/:id/assign` với staff_id
    - Nếu thành công → Refresh danh sách
  - **Reply ticket:**
    - Click "Phản hồi" → Mở dialog
    - Nhập message → Gọi API POST `/api/admin/support/:id/reply`
    - Nếu thành công → Refresh ticket details, gửi notification cho user
  - **Update status:**
    - Click "Cập nhật trạng thái" → Chọn status mới
    - Gọi API PUT `/api/admin/support/:id/status`
    - Nếu thành công → Refresh danh sách
- **Abnormal Cases:**
  - Reply message trống → Hiển thị "Vui lòng nhập phản hồi"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

#### b. Reports & Analytics (Báo cáo & Phân tích)

**Function Trigger:**
- Admin click "Báo cáo & Phân tích" trong sidebar → `/admin/reports`

**Function Description:**
- **Actors/Roles:** Admin
- **Purpose:** Xem báo cáo và phân tích hệ thống: statistics, charts, trends
- **Interface:** Trang báo cáo với statistics cards, charts, filters
- **Data Processing:**
  - Load stats: GET `/api/admin/dashboard/stats?period=day|week|month`
  - Load battery stats: GET `/api/admin/dashboard/batteries`
  - Hiển thị: total users, total stations, total bookings, total revenue, trends, charts

**Screen Layout:**
**[File: ReportsAnalytics.tsx - Trang "Báo cáo & Phân tích"]**
```
┌─────────────────────────────────────┐
│  Báo cáo & Phân tích  [Tháng ▼]     │
├─────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 1000│ │  50 │ │ 500 │ │ 50M │  │
│  │ Users│ │Sta- │ │Book-│ │Revenue│ │
│  │ +5%  │ │tions│ │ings │ │ +10% │  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│                                     │
│  [Charts: Bookings, Revenue, Users]│
│  [Battery Statistics]               │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Period: day, week, month
- **Business Logic:**
  - **Load statistics:**
    - Gọi API GET `/api/admin/dashboard/stats?period=...`
    - Hiển thị: total users, total stations, total bookings, total revenue
    - Tính trends (so với kỳ trước): +X% hoặc -X%
  - **Charts:**
    - Hiển thị biểu đồ bookings theo thời gian
    - Hiển thị biểu đồ revenue theo thời gian
    - Hiển thị biểu đồ users theo thời gian
  - **Battery statistics:**
    - Gọi API GET `/api/admin/dashboard/batteries`
    - Hiển thị: total batteries, available, charging, in_use, maintenance, damaged
- **Abnormal Cases:**
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

#### c. Staff Schedule Management (Quản lý lịch làm việc nhân viên)

**Function Trigger:**
- Admin click "Lịch làm việc" trong sidebar → `/admin/schedules`

**Function Description:**
- **Actors/Roles:** Admin
- **Purpose:** Quản lý lịch làm việc của staff: tạo, cập nhật, xóa ca làm việc
- **Interface:** Trang danh sách schedules với calendar view, form thêm/sửa
- **Data Processing:**
  - Load schedules: GET `/api/admin/staff-schedules?staff_id=...&station_id=...&status=...&date_from=...&date_to=...`
  - Create schedule: POST `/api/admin/staff-schedules` với staff_id, station_id, shift_start, shift_end
  - Update schedule: PUT `/api/admin/staff-schedules/:id` với shift_start, shift_end, status
  - Delete schedule: DELETE `/api/admin/staff-schedules/:id`

**Screen Layout:**
**[File: AdminStaffScheduleManagement.tsx - Trang "Lịch làm việc"]**
```
┌─────────────────────────────────────┐
│  Lịch làm việc nhân viên            │
│  [+ Tạo lịch] [Danh sách] [Lịch]   │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ 15/01/2025 | 7:00 - 15:00    │   │
│  │ Nhân viên: Nguyễn Văn B      │   │
│  │ Trạm: Trạm A - Quận 1        │   │
│  │ [Đã lên lịch]                │   │
│  │ [✏️] [🗑️]                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Modal: Tạo/Sửa lịch]              │
│  - Nhân viên: [Chọn ▼]             │
│  - Trạm: [Chọn ▼]                  │
│  - Ngày: [📅 15/01/2025]           │
│  - Ca: [7:00] - [15:00]            │
└─────────────────────────────────────┘
```

**Function Details:**
- **Validation:**
  - Staff ID: Phải tồn tại và role = STAFF
  - Station ID: Phải tồn tại
  - Shift start: Phải < shift_end
  - Shift end: Phải > shift_start
  - Status: scheduled, completed, absent, cancelled
- **Business Logic:**
  - **Load schedules:**
    - Gọi API GET `/api/admin/staff-schedules?staff_id=...&station_id=...&status=...&date_from=...&date_to=...`
    - Filter theo staff, station, status, date range
    - Sort theo `shift_start ASC` (sớm nhất trước)
  - **Create schedule:**
    - Click "+ Tạo lịch" → Mở form
    - Chọn staff, station, ngày, giờ bắt đầu, giờ kết thúc
    - Gọi API POST `/api/admin/staff-schedules`
    - Nếu thành công → Refresh danh sách
  - **Update schedule:**
    - Click "✏️" → Mở form với dữ liệu hiện tại
    - Cập nhật shift_start, shift_end, status
    - Gọi API PUT `/api/admin/staff-schedules/:id`
    - Nếu thành công → Refresh danh sách
  - **Delete schedule:**
    - Click "🗑️" → Xác nhận xóa
    - Gọi API DELETE `/api/admin/staff-schedules/:id`
    - Nếu thành công → Refresh danh sách
- **Abnormal Cases:**
  - Shift start >= shift_end → Hiển thị "Giờ bắt đầu phải nhỏ hơn giờ kết thúc"
  - Schedule trùng lịch → Hiển thị "Nhân viên đã có ca làm việc trong khoảng thời gian này"
  - Network error → Hiển thị "Lỗi kết nối, vui lòng thử lại"

---

## 🏗️ Technology Stack

### Backend:
- **Node.js 20+** + **Express.js** - Server framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication (Access + Refresh tokens)
- **VNPay** - Payment gateway (sandbox/production)
- **Track-Asia** - Maps API (directions, distance, duration)
- **Cloudinary** - File upload (avatars, station images)
- **Socket.IO** - Real-time notifications
- **Node-cron** - Background jobs (auto-cancel bookings, reminders)
- **Bcrypt** - Password hashing
- **Joi** - Request validation

### Frontend:
- **React 18** + **TypeScript** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library (Radix UI)
- **React Router** - Navigation
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Lucide React** - Icons
- **Recharts** - Charts & graphs

---

## 📁 Project Structure

```
SWP392_Group4/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── controllers/        # API controllers (27 files)
│   │   ├── services/           # Business logic (8 files)
│   │   ├── routes/             # API routes (34 files)
│   │   ├── middlewares/        # Express middlewares (3 files)
│   │   ├── utils/              # Utility functions (4 files)
│   │   ├── validators/         # Request validators (3 files)
│   │   ├── config/             # Configuration (vnpay.config.ts)
│   │   └── server.ts            # Main server file
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   ├── migrations/         # Database migrations
│   │   └── seed.ts             # Database seeding
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                    # Environment variables
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/         # React components (98 files)
│   │   │   ├── admin/          # Admin dashboard components
│   │   │   ├── driver/         # Driver interface components
│   │   │   ├── staff/           # Staff interface components
│   │   │   ├── ui/              # Reusable UI components (shadcn/ui)
│   │   │   └── figma/           # Figma design components
│   │   ├── services/           # API service layer (23 files)
│   │   ├── config/             # Configuration (api.ts)
│   │   ├── contexts/           # React contexts
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Utility functions
│   │   ├── styles/              # CSS styles
│   │   └── scripts/             # Build scripts
│   ├── public/                  # Static assets
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── vercel.json              # Vercel deployment config
│
├── README.md                    # Main project README
├── PROJECT_DOCUMENTATION.md     # This file
└── .gitignore
```

---

## 🚀 Quick Start

### Prerequisites:
- **Node.js** 20+
- **PostgreSQL** 14+
- **npm** 10+
- **Git**

### Backend Setup:

```bash
cd backend
npm install
cp env.example .env
# Configure .env with your credentials
npx prisma db push
npx prisma generate
npx prisma db seed
npm run dev
```

### Frontend Setup:

```bash
cd frontend
npm install
npm run dev
```

### Access URLs:
- **Backend API:** http://localhost:3000
- **Frontend App:** http://localhost:5173
- **API Health:** http://localhost:3000/health
- **Swagger Docs:** http://localhost:3000/api-docs

---

## 🔐 Authentication & Authorization

### User Roles:
- **👑 Admin** - System management (users, stations, staff, pricing, packages)
- **👨‍💼 Staff** - Station operations (batteries, bookings, schedules)
- **🚗 Driver** - End users (vehicles, bookings, wallet, subscriptions)

### Authentication Flow:
1. **Registration/Login:** Email + Password → Access Token + Refresh Token
2. **Token Storage:** 
   - Access Token → localStorage (15 minutes expiry)
   - Refresh Token → localStorage + httpOnly cookie (7 days expiry)
3. **Auto-Refresh:** Frontend tự động refresh token khi sắp hết hạn (2 phút trước)
4. **401 Handling:** Retry request với token mới, nếu fail → redirect to login

### Security Features:
- JWT tokens với expiration
- Refresh token rotation
- Password hashing với bcrypt
- Rate limiting trên auth endpoints
- CORS configuration
- Helmet security headers

---

## 💰 Payment System

### Wallet System:
- **Wallet-based ONLY** - Users phải nạp tiền vào ví trước khi đặt lịch
- **TopUp Packages** - Gói nạp tiền với bonus (ví dụ: Nạp 200K nhận 200K, Nạp 500K nhận 550K)
- **Auto-payment** - Tự động trừ tiền từ ví khi hoàn thành đổi pin
- **Insufficient Funds** - Báo lỗi nếu số dư < giá tiền (phải nạp thêm)

### VNPay Integration:
- **Sandbox/Production** - Hỗ trợ cả 2 môi trường
- **Hosted Checkout** - Redirect user đến VNPay để thanh toán
- **Return URL** - Xử lý kết quả thanh toán sau khi user quay lại
- **Signature Verification** - HMAC SHA512 với URL encoding
- **Payment Status** - pending → completed/failed

### Subscription Packages:
- **Service Packages** - Gói dịch vụ đổi pin (unlimited hoặc limited swaps)
- **Proportional Refund** - Hoàn tiền theo tỷ lệ khi hủy gói
- **Cancellation Fee** - Phí hủy 3%
- **Minimum Refund** - Tối thiểu 10,000 VND

---

## 📋 Booking System

### Booking Types:
1. **Scheduled Booking** - Đặt lịch trước (30 phút - 12 giờ)
2. **Instant Booking** - Đặt ngay (15 phút reservation)

### Booking Flow:
1. **Driver tạo booking** → Status: `pending`
2. **Staff xác nhận** (phone verification) → Status: `confirmed`
3. **Staff hoàn thành** (nhập battery codes) → Status: `completed`
4. **Auto-cancel** nếu quá thời gian → Status: `cancelled`

### Booking Features:
- **Auto-cancel expired bookings** - Tự động hủy booking quá hạn
- **Reminders** - Thông báo 30 phút & 10 phút trước giờ hẹn
- **Cancellation Fee** - Phí 20K nếu hủy < 15 phút trước giờ hẹn
- **Battery Locking** - Tự động giữ pin cho booking (status: `reserved`)

### Staff Operations:
- **Phone Verification** - Xác nhận bằng số điện thoại (không cần PIN)
- **Auto-fill Old Battery** - Tự động lấy mã pin cũ từ vehicle
- **Dropdown New Battery** - Dropdown danh sách pin mới (compatible, full, available)
- **Battery Status Update** - Cập nhật status pin sau khi đổi (old → charging/damaged/maintenance, new → in_use)

---

## 🔋 Battery Management

### Battery Status:
- **full** - Pin đầy, sẵn sàng đổi (current_charge = 100%)
- **charging** - Đang sạc
- **in_use** - Đang được sử dụng trên xe
- **reserved** - Đã được giữ cho booking
- **damaged** - Pin hỏng
- **maintenance** - Đang bảo trì

### Battery Operations:
- **Capacity Warning** - Cảnh báo nếu capacity >= 90%, từ chối nếu >= 100%
- **Battery Inventory** - Quản lý theo model (available, charging, total)
- **Status Management** - full → charging → in_use
- **Damaged Battery** - Không cho sạc nếu damaged/maintenance
- **Battery History** - Lịch sử sử dụng pin
- **Battery Transfer** - Chuyển pin giữa các trạm

### Battery Display:
- **Driver Booking History** - Hiển thị mã pin hiện tại của vehicle
- **Staff Booking List** - Hiển thị mã pin cũ và mới cho completed transactions
- **Staff Swap Modal** - Auto-fill old battery code, dropdown new battery code

---

## 📊 Pricing System

### Battery Pricing:
- **Dynamic Pricing** - Giá theo model pin (ví dụ: Tesla Model 3 Battery = 100K, BYD Battery = 80K)
- **Admin Management** - Admin có thể CRUD pricing cho từng model
- **Public API** - Driver có thể xem pricing trước khi đặt

### TopUp Packages:
- **Bonus System** - Gói nạp tiền có bonus (ví dụ: 200K → 200K, 500K → 550K)
- **Active/Inactive** - Admin có thể bật/tắt gói
- **Admin Management** - CRUD top-up packages

---

## 🔔 Notification System

### Notification Types:
- **Booking Reminders** - 30 phút & 10 phút trước giờ hẹn
- **Payment Success** - Thông báo thanh toán thành công
- **Booking Status** - Cập nhật trạng thái booking
- **System Notifications** - Thông báo hệ thống

### Notification Delivery:
- **Socket.IO** - Real-time notifications
- **In-app Notifications** - Hiển thị trong app
- **Mark as Read** - Đánh dấu đã đọc
- **Mark All Read** - Đánh dấu tất cả đã đọc

---

## 🗺️ Maps Integration

### Track-Asia API:
- **Directions** - Lấy chỉ đường từ điểm A đến điểm B
- **Distance & Duration** - Tính khoảng cách và thời gian (road distance)
- **Straight-line Distance** - Tính khoảng cách đường thẳng (Haversine formula)

### Features:
- **Nearby Stations** - Tìm trạm gần nhất
- **Route Planning** - Lập kế hoạch đường đi
- **Distance Calculation** - Tính toán khoảng cách

---

## 📡 API Endpoints

### Authentication:
- `POST /api/auth/register` - Đăng ký user
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Lấy thông tin user
- `POST /api/auth/refresh` - Refresh access token
- `PUT /api/auth/profile` - Cập nhật profile
- `POST /api/auth/change-password` - Đổi mật khẩu
- `POST /api/auth/upload-avatar` - Upload avatar

### Driver APIs:
- `GET /api/driver/vehicles` - Danh sách xe (CRUD)
- `GET /api/driver/stations/nearby` - Trạm gần nhất
- `GET /api/driver/stations/:id` - Chi tiết trạm
- `GET /api/driver/bookings` - Danh sách booking (CRUD)
- `POST /api/driver/bookings` - Tạo booking
- `POST /api/driver/bookings/instant` - Đặt ngay
- `PUT /api/driver/bookings/:id/cancel` - Hủy booking
- `GET /api/driver/wallet/balance` - Số dư ví
- `GET /api/driver/wallet/transactions` - Lịch sử giao dịch
- `POST /api/driver/wallet/topup` - Nạp tiền (VNPay)
- `GET /api/driver/subscriptions` - Danh sách gói đã đăng ký
- `POST /api/driver/subscriptions/packages/:id/subscribe` - Đăng ký gói
- `PUT /api/driver/subscriptions/:id/cancel` - Hủy gói (proportional refund)
- `GET /api/driver/notifications` - Thông báo
- `PUT /api/driver/notifications/:id/read` - Đánh dấu đã đọc
- `PUT /api/driver/notifications/read-all` - Đánh dấu tất cả đã đọc
- `GET /api/driver/transactions` - Lịch sử giao dịch đổi pin

### Staff APIs:
- `GET /api/staff/batteries` - Danh sách pin tại trạm (CRUD)
- `POST /api/staff/batteries` - Thêm pin mới
- `PUT /api/staff/batteries/:id` - Cập nhật pin
- `DELETE /api/staff/batteries/:id` - Xóa pin
- `GET /api/staff/bookings` - Danh sách booking tại trạm
- `GET /api/staff/bookings/:id` - Chi tiết booking
- `GET /api/staff/bookings/:id/available-batteries` - Danh sách pin có sẵn để đổi
- `POST /api/staff/bookings/:id/confirm` - Xác nhận booking (phone verify)
- `POST /api/staff/bookings/:id/complete` - Hoàn thành booking (battery codes)
- `PUT /api/staff/bookings/:id/cancel` - Hủy booking
- `GET /api/staff/schedules` - Lịch làm việc
- `PUT /api/staff/schedules/:id/status` - Cập nhật trạng thái lịch

### Admin APIs:
- `GET /api/admin/users` - Danh sách users (CRUD)
- `GET /api/admin/stations` - Danh sách trạm (CRUD + image upload)
- `GET /api/admin/staff` - Danh sách nhân viên (CRUD)
- `GET /api/admin/batteries` - Danh sách pin (CRUD)
- `GET /api/admin/pricing` - Danh sách pricing (CRUD)
- `GET /api/admin/topup-packages` - Danh sách gói nạp tiền (CRUD)
- `GET /api/admin/packages` - Danh sách gói dịch vụ (CRUD)
- `GET /api/admin/dashboard/stats` - Thống kê dashboard
- `GET /api/admin/dashboard/batteries` - Thống kê pin
- `GET /api/admin/support` - Quản lý support tickets
- `GET /api/admin/staff-schedules` - Quản lý lịch làm việc
- `GET /api/admin/battery-transfers` - Quản lý chuyển pin

### Payment APIs:
- `POST /api/payments/vnpay/create` - Tạo payment URL
- `GET /api/payments/vnpay/return` - Xử lý return từ VNPay

### Public APIs:
- `GET /api/stations/public` - Danh sách trạm công khai
- `GET /api/stations/public/nearby` - Trạm gần nhất
- `GET /api/stations/public/:id` - Chi tiết trạm công khai
- `GET /api/pricing` - Danh sách pricing công khai

### Maps APIs:
- `GET /api/maps/directions` - Lấy chỉ đường (Track-Asia)
- `GET /api/maps/distance` - Tính khoảng cách & thời gian (road distance)
- `POST /api/maps/calculate-distance` - Tính khoảng cách đường thẳng (Haversine)

---

## 🔧 Environment Variables

### Backend (.env):

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ev_battery_swap"

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# VNPay
VNPAY_TMN_CODE=your-tmn-code
VNPAY_HASH_SECRET=your-hash-secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://your-backend-url.com/api/payments/vnpay/return

# Maps
TRACKASIA_ACCESS_TOKEN=your-trackasia-token

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend (.env hoặc Vercel Environment Variables):

```env
VITE_API_URL=https://ev-battery-backend.onrender.com/api
```

---

## 🧪 Testing

### Swagger Documentation:
- **Swagger UI:** `http://localhost:3000/api-docs`
- Tất cả endpoints được document với examples
- Test endpoints trực tiếp từ Swagger UI

### Health Check:
```bash
curl http://localhost:3000/health
```

### API Testing Examples:
```bash
# Authentication
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User","phone":"0901234567"}'

# Public Stations
curl http://localhost:3000/api/stations/public
```

---

## 🚀 Deployment

### Backend Deployment (Render):
1. Connect GitHub repository
2. Set environment variables trong Render dashboard
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Set `NPM_CONFIG_PRODUCTION=false` để install devDependencies

### Frontend Deployment (Vercel):
1. Connect GitHub repository
2. Set environment variable: `VITE_API_URL=https://ev-battery-backend.onrender.com/api`
3. Build command: `npm run build`
4. Output directory: `dist`

### Production URLs:
- **Backend:** https://ev-battery-backend.onrender.com
- **Frontend:** https://swp392-ev.vercel.app

---

## 📈 Key Features Summary

### ✅ Completed Features:

1. **🔐 Authentication System**
   - JWT Access + Refresh tokens
   - Auto-refresh token khi sắp hết hạn
   - Role-based access control (DRIVER, STAFF, ADMIN)

2. **💰 Payment System**
   - Wallet-based payment
   - VNPay integration (sandbox/production)
   - Top-up packages với bonus
   - Subscription packages với proportional refund

3. **📋 Booking System**
   - Scheduled & Instant bookings
   - Auto-cancel expired bookings
   - Booking reminders
   - Battery locking

4. **🔋 Battery Management**
   - Battery inventory by model
   - Status management (full, charging, in_use, reserved, damaged, maintenance)
   - Auto-fill old battery code trong staff modal
   - Dropdown new battery code (compatible, full, available)

5. **👨‍💼 Staff Operations**
   - Phone verification (không cần PIN)
   - Complete booking với battery codes
   - Battery status update sau khi đổi

6. **📊 Admin Dashboard**
   - User management
   - Station management
   - Staff management
   - Battery management
   - Pricing management
   - Package management
   - Dashboard statistics

7. **🔔 Notification System**
   - Real-time notifications với Socket.IO
   - Booking reminders
   - Payment notifications

8. **🗺️ Maps Integration**
   - Track-Asia API integration
   - Directions, distance, duration
   - Nearby stations

9. **☁️ File Upload**
   - Cloudinary integration
   - Avatar upload
   - Station image upload

10. **⏰ Background Jobs**
    - Auto-cancel expired bookings
    - Booking reminders (30 min & 10 min before)

---

## 🔄 Recent Updates (2025)

### Token Refresh Flow:
- ✅ Backend trả `refreshToken` trong response body (login/register)
- ✅ Frontend lưu `refreshToken` vào localStorage
- ✅ Auto-refresh token khi sắp hết hạn (2 phút trước)
- ✅ Retry với token mới khi nhận 401

### Battery Swap Modal:
- ✅ Auto-fill old battery code từ vehicle
- ✅ Dropdown new battery code (compatible, full, available)
- ✅ Display battery codes trong booking history và transaction list

### Subscription Cancellation:
- ✅ Proportional refund (theo tỷ lệ sử dụng)
- ✅ Cancellation fee 3%
- ✅ Minimum refund 10,000 VND

### Booking Management:
- ✅ Auto-refresh mỗi 30 giây trong staff console
- ✅ Sort by created_at desc để hiển thị booking mới nhất
- ✅ Display current battery code trong driver booking history

---

## 📝 Development Commands

### Backend:
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npx prisma studio    # Database GUI
npx prisma db push   # Push schema changes
npx prisma generate  # Generate Prisma client
npx prisma db seed   # Seed database
```

### Frontend:
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## 👥 Team

- **Backend Development:** Node.js + TypeScript + Prisma
- **Frontend Development:** React + TypeScript + Tailwind
- **Database Design:** PostgreSQL + Prisma ORM
- **API Integration:** VNPay + Track-Asia + Cloudinary + Socket.IO

---

## 📄 License

This project is part of **SWP392 - Software Engineering Project** at **FPT University**.

---

## 📞 Support

For technical support or questions:
- **Email:** thanhldse170144@fpt.edu.vn
- **GitHub:** [Repository URL]
- **Documentation:** This file

---

**📝 Last Updated:** November 2025  
**✅ Status:** Production Ready - 100% Complete  
**📊 Total Endpoints:** ~125 API endpoints  
**🔧 Code Quality:** Optimized (Prisma singleton, utility functions, parallel queries)  
**👨‍💻 Maintainer:** SWP392 Group 4  
**🏢 Organization:** FPT University - SWP392 Group 4

