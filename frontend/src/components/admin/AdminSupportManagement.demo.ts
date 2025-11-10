/**
 * Demo và Test cho Admin Support Management System
 * 
 * Hệ thống quản lý hỗ trợ đã được hoàn thành với các tính năng:
 * 
 * 1. ✅ Admin Support Service (admin-support.service.ts)
 *    - getAdminTickets: Lấy danh sách tất cả ticket
 *    - getAdminTicketDetails: Chi tiết ticket với replies
 *    - assignTicket: Gán ticket cho staff
 *    - replyToTicket: Admin phản hồi ticket
 *    - updateTicketStatus: Cập nhật trạng thái ticket
 * 
 * 2. ✅ Admin Support Management Component
 *    - Dashboard với thống kê ticket
 *    - Danh sách ticket với filters (status, priority, assigned)
 *    - Tìm kiếm ticket
 *    - Modal chi tiết ticket với history replies
 *    - Modal gán nhân viên
 *    - Modal phản hồi
 *    - Modal cập nhật trạng thái
 * 
 * 3. ✅ Routing và Navigation
 *    - Route: /admin/support
 *    - Navigation link trong AdminLayout
 * 
 * 4. ✅ Toast Notification System
 *    - Simple toast service thay thế react-hot-toast
 *    - Success, Error, Info notifications
 * 
 * Cách sử dụng:
 * 1. Đăng nhập với role ADMIN
 * 2. Truy cập /admin/support
 * 3. Xem danh sách tickets, lọc theo trạng thái/mức độ
 * 4. Click vào ticket để xem chi tiết
 * 5. Gán nhân viên, phản hồi, cập nhật trạng thái
 * 
 * Backend APIs được sử dụng:
 * - GET /api/admin/support - Lấy danh sách tickets
 * - GET /api/admin/support/:id - Chi tiết ticket  
 * - POST /api/admin/support/:id/assign - Gán nhân viên
 * - POST /api/admin/support/:id/reply - Phản hồi ticket
 * - PUT /api/admin/support/:id/status - Cập nhật trạng thái
 * 
 * Các trạng thái ticket:
 * - open: Mở (mới tạo)
 * - in_progress: Đang xử lý
 * - resolved: Đã giải quyết
 * - closed: Đã đóng
 * 
 * Các mức độ ưu tiên:
 * - low: Thấp
 * - medium: Trung bình
 * - high: Cao
 * - urgent: Khẩn cấp
 */

// Test data structure expected from backend:
export const mockSupportTicket = {
  ticket_id: "ticket_123",
  title: "Không thể đổi pin tại trạm ABC",
  description: "Tôi đã đến trạm ABC nhưng máy không hoạt động...",
  status: "open" as const,
  priority: "high" as const,
  category: "technical",
  user_id: "user_456",
  assigned_to: null,
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z",
  user: {
    user_id: "user_456",
    full_name: "Nguyen Van A",
    email: "nguyenvana@example.com",
    phone: "0987654321"
  },
  assigned_staff: null,
  replies: [],
  _count: {
    replies: 0
  }
};

export const mockSupportReply = {
  reply_id: "reply_789",
  ticket_id: "ticket_123", 
  user_id: "admin_001",
  message: "Chúng tôi đã kiểm tra và sẽ sửa chữa máy trong vòng 2 giờ tới.",
  is_admin_reply: true,
  created_at: "2024-01-15T11:00:00Z",
  user: {
    user_id: "admin_001",
    full_name: "Admin Name",
    email: "admin@example.com"
  }
};

console.log("Admin Support Management System đã sẵn sàng!");
console.log("Truy cập /admin/support để sử dụng");