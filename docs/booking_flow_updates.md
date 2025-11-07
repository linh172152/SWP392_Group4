# Booking & Swap Flow Updates

Tài liệu này tổng hợp những luồng cần bổ sung để đáp ứng góp ý về logic đặt pin, giữ kho và xử lý gói dịch vụ.

## 1. Giữ Pin Khi Đặt Booking

- `createBooking` phải chọn 1 pin khả dụng (ưu tiên `status = full`, fallback `charging` nếu kịp sạc) và chuyển sang `reserved`.
- Booking lưu các trường mới: `locked_battery_id`, `locked_subscription_id`, `locked_wallet_amount`, `use_subscription_flag`.
- Nếu booking bị hủy (driver hủy hoặc auto-cancel), chỉ trả pin về trạng thái ban đầu; lượt/tiền đã trừ sẽ **không hoàn**, đúng theo chính sách “driver không đến thì mất lượt/mất tiền”. Trường hợp admin duyệt refund đặc biệt, tiền hoàn sẽ được trả về ví (không khôi phục gói).
- Cần bao toàn tính đồng bộ: thao tác chọn pin và tạo booking phải nằm trong một Prisma `$transaction` duy nhất. Đối với PostgreSQL, nên dùng `SELECT ... FOR UPDATE` để khóa hàng pin, tránh hai booking giữ cùng một viên.
- Trạng thái pin mở rộng: `full` → `reserved` → `in_use` → `charging` (hoặc `maintenance`). Migration cần cập nhật enum/trạng thái tương ứng.

## 2. Trừ Gói / Ví Ngay Khi Đặt

- Nếu driver có gói hợp lệ và chọn dùng: trừ ngay 1 lượt (`locked_subscription_id`, `locked_swap_count = 1`) và cập nhật `remaining_swaps` trừ 1 sau khi booking tạo thành công.
- Nếu không dùng gói: trừ trực tiếp số tiền tương ứng khỏi ví (tạo transaction ngay thời điểm đặt, trạng thái `booking_hold`).
- Theo yêu cầu: khi booking bị hủy do driver không đến, lượt và tiền đã trừ **không hoàn lại**. Nếu admin cần hoàn đặc biệt phải thao tác thủ công; tiền hoàn sẽ chuyển về ví của driver (không trả lại lượt gói).
- Trường hợp ví không đủ: request bị từ chối ngay (HTTP 400). Thông báo rõ số dư cần thiết để driver nạp thêm trước khi đặt.
- Việc trừ gói/tiền phải nằm chung `$transaction` với bước tạo booking; nếu insert booking fail thì dữ liệu gói/ví cũng rollback.

## 3. Hoàn Tất Bởi Staff

- Staff xác nhận pin cũ (`old_battery_id`) và cập nhật trạng thái (ví dụ `charging`).
- Pin mới (`new_battery_id`) được giao cho driver, set `status = in_use`, đồng thời cập nhật `vehicle.current_battery_id`.
- Các khoản trừ gói/tiền đã xảy ra ở bước đặt nên khi complete chỉ cần ghi nhận `transaction` thành `completed`, tránh trừ lần nữa.
- Staff cần nhập hoặc xác nhận tình trạng pin trả về (SoH, ghi chú). Dữ liệu này dùng để giải thích khi được hỏi.
- Nếu driver đổi ý (muốn dùng/không dùng gói), staff phải xử lý theo quy trình admin (refund ví rồi trừ lại) vì hệ thống đã trừ ngay tại bước đặt.

## 4. Quy Tắc Gói Theo Dung Lượng/Model

- Cập nhật bảng gói dịch vụ để lưu giới hạn dung lượng hoặc danh sách model.
- `createBooking` và pricing preview phải kiểm tra rule này trước khi cho đặt.

## 5. Cho Phép Driver Bỏ Sử Dụng Gói

- Request đặt booking thêm flag `use_subscription`.
- Nếu flag = false, bỏ bước trừ gói và trừ tiền ví ngay.
- Staff có thể override khi check-in (nếu business cần, thao tác hoàn tiền/lượt thủ công).

## 6. Cron & Auto-Cancel

- Cron định kỳ (5 phút) rà booking pending quá thời hạn → auto-cancel, release pin và các hold.
- Đảm bảo không còn pin `reserved` cho booking đã complete/hủy.
- Cần xác định rõ thời gian giữ chỗ (ví dụ: auto-cancel nếu driver không check-in sau 15 phút kể từ `scheduled_at`). Thông số này nên được cấu hình để dễ điều chỉnh.
- Khi auto-cancel, gửi notification cho driver và staff, log lý do `auto_cancel_no_show` trong booking để phục vụ audit.

## 7. Lịch Sử Pin & Báo Cáo

- Booking lưu `old_battery_id`, `new_battery_id`, tình trạng pin trả về.
- (Tuỳ chọn) ghi log vào bảng `battery_history` để giải trình khi cần.
- Log nên chứa: `battery_id`, `station_id`, `action` (reserved/issued/returned), `actor` (driver/staff/admin), `timestamp`, ghi chú.

## 8. Huỷ Gói Dịch Vụ

- Khi huỷ gói, hoàn tiền lại ví (trừ khi có phí huỷ theo chính sách).
- Ghi rõ lý do trong `wallet_transaction` và cập nhật trạng thái gói.
- Thiết kế transaction type mới (`refund_subscription`) để phân biệt với hoàn tiền booking.
- Việc huỷ gói phải kiểm tra: gói chưa sử dụng lượt nào sau khi kích hoạt, hoặc đáp ứng điều kiện kinh doanh trước khi hoàn.

## 9. Swagger & Tài Liệu

- Cập nhật mô tả API `createBooking`, `completeBooking`, `cancelBooking`, `staff.completeBooking` để phản ánh luồng mới.
- Document rõ policy khi driver không đến, khi huỷ gói, và các rule dung lượng.
- Cập nhật schema response để hiển thị các field mới (`locked_battery_id`, `locked_wallet_amount`, `payment_status` mới như `booking_hold`).
- Bổ sung example/description về trạng thái refund manual để team QA dễ test.

---

**Thứ tự triển khai khuyến nghị**

1. Cập nhật schema/migration: thêm cột booking, trạng thái pin, bảng hold ví.
2. Điều chỉnh `createBooking` và auto-cancel để thực hiện hold, kèm concurrency lock.
3. Cập nhật `staff.completeBooking` cho logic release/consume hold và log pin chi tiết.
4. Bổ sung flag `use_subscription`, rule dung lượng gói và xử lý thông báo nếu thiếu số dư.
5. Cập nhật tài liệu Swagger + test lại toàn bộ flow (bao gồm trường hợp auto-cancel, refund thủ công).
