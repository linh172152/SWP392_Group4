# Hướng dẫn Test Code Cũ và Khôi Phục Code Mới

## Lưu ý quan trọng:
- `BookBatteryPage.tsx` là file **MỚI** bạn tạo, không có trong git history cũ
- Code cũ của các file driver khác có trong commit `c9e696d7` hoặc commit trước đó

## Cách 1: Clone repo mới và checkout code cũ

```bash
# 1. Clone repo về một thư mục mới
cd D:\KY_9\SWP392\testnew
git clone https://github.com/linh172152/SWP392_Group4.git SWP392_Group4_test_cu

# 2. Vào thư mục mới
cd SWP392_Group4_test_cu

# 3. Checkout về commit cũ (code trước khi pull)
git checkout c9e696d7

# Hoặc checkout về commit trước đó (không có BookBatteryPage.tsx)
git checkout 05ca20e4

# 4. Test code cũ của các file driver khác
```

## Cách 2: Trong repo hiện tại, tạo branch mới để test

```bash
# 1. Tạo branch mới từ commit cũ (không ảnh hưởng code hiện tại)
git checkout -b test-code-cu c9e696d7

# 2. Test code cũ
# ... test các file driver ...

# 3. Nếu không ưng, quay lại branch main
git checkout main

# 4. Copy file backup vào để dùng code mới
# Copy BACKUP_BookBatteryPage_20251104.tsx vào:
# frontend/src/components/driver/BookBatteryPage.tsx
```

## Cách 3: Copy file backup vào để test code mới

Nếu muốn test code mới của BookBatteryPage trong repo test:

```bash
# 1. Sau khi checkout commit cũ (cách 1 hoặc 2)
# 2. Copy file backup vào đúng vị trí
cp BACKUP_BookBatteryPage_20251104.tsx frontend/src/components/driver/BookBatteryPage.tsx

# Hoặc copy từ thư mục gốc
# D:\KY_9\SWP392\testnew\SWP392_Group4\BACKUP_BookBatteryPage_20251104.tsx
# → D:\KY_9\SWP392\testnew\SWP392_Group4_test_cu\frontend\src\components\driver\BookBatteryPage.tsx
```

## So sánh code cũ vs code mới:

### Code cũ (từ commit c9e696d7):
- Không có `BookBatteryPage.tsx`
- Có các file driver khác: `BookingHistory.tsx`, `PaymentInvoices.tsx`, `VehicleManagement.tsx`, etc.
- Có `BookingModal.tsx` (file mới từ team)

### Code mới (file backup):
- `BookBatteryPage.tsx` với đầy đủ tính năng:
  - Tự động đề xuất pin và xe
  - Chọn thời gian hẹn (30 phút - 12 giờ)
  - Dịch lỗi sang tiếng Việt
  - Validation đầy đủ
  - UI với badge "Đề xuất"

## Workflow đề xuất:

1. **Clone repo mới** để test code cũ (không ảnh hưởng code hiện tại)
2. **Test code cũ** của các file driver
3. **Nếu không ưng code cũ**, copy file backup vào để dùng code mới
4. **Nếu ưng code cũ**, có thể merge hoặc copy các file từ commit cũ

## Lệnh nhanh:

```bash
# Clone và checkout code cũ
git clone https://github.com/linh172152/SWP392_Group4.git SWP392_Group4_test_cu
cd SWP392_Group4_test_cu
git checkout c9e696d7

# Copy file backup vào (nếu cần)
cp ../SWP392_Group4/BACKUP_BookBatteryPage_20251104.tsx frontend/src/components/driver/BookBatteryPage.tsx
```

