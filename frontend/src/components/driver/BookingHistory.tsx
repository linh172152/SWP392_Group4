import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  Package,
  Zap,
  Battery,
} from "lucide-react";
import API_ENDPOINTS, { fetchWithAuth } from "../../config/api";
import { BatterySpinner, BatteryLoading } from "../ui/battery-loading";
import { ErrorDisplay } from "../ui/error-display";
import { Skeleton } from "../ui/skeleton";

interface PricingPreview {
  currency: string;
  base_price: number | null;
  estimated_price: number | null;
  pricing_source: "subscription" | "wallet" | "unavailable";
  has_active_subscription: boolean;
  is_covered_by_subscription: boolean;
  subscription?: {
    subscription_id: string;
    package_id: string;
    package_name: string;
    package_duration_days: number;
    package_battery_capacity_kwh: number;
    package_swap_limit: number | null;
    remaining_swaps: number | null;
    ends_at: string;
    auto_renew: boolean;
  };
  message: string;
}

interface HoldSummary {
  battery_code?: string | null;
  use_subscription: boolean;
  subscription_unlimited?: boolean;
  subscription_remaining_after?: number | null;
  subscription_name?: string | null;
  wallet_amount_locked?: number;
  wallet_balance_after?: number | null;
  hold_expires_at?: string | null;
}

interface BookingItem {
  booking_id: string;
  booking_code: string;
  scheduled_at: string;
  created_at: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  station?: {
    name: string;
    address: string;
    station_id?: string;
    latitude?: string | number;
    longitude?: string | number;
  };
  vehicle?: {
    vehicle_id?: string;
    license_plate: string;
    vehicle_type: string;
    make?: string;
    model?: string;
    year?: number;
    current_battery?: {
      battery_id: string;
      battery_code: string;
      status: string;
      current_charge: number;
    } | null;
  };
  transaction?: {
    transaction_id?: string;
    transaction_code?: string;
    amount?: number;
    payment_status?: string;
  };
  pricing_preview?: PricingPreview;
  hold_summary?: HoldSummary;
  use_subscription?: boolean;
  locked_subscription_id?: string | null;
  locked_wallet_amount?: number;
  hold_expires_at?: string | null;
  [key: string]: any; // Allow additional fields from API
}

const BookingHistory: React.FC = () => {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | BookingItem["status"]
  >("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);
  const [limit] = useState(10); // Số đơn mỗi trang
  const [activeSubscription, setActiveSubscription] = useState<any | null>(
    null
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        );
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "pending":
      case "confirmed":
      case "in_progress":
      default:
        return (
          <AlertCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50/80 dark:bg-green-500/10 text-green-800 dark:text-green-400 border-green-200/50 dark:border-green-500/20";
      case "cancelled":
        return "bg-red-50/80 dark:bg-red-500/10 text-red-800 dark:text-red-400 border-red-200/50 dark:border-red-500/20";
      case "pending":
        return "bg-amber-50/80 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20";
      case "confirmed":
        return "bg-blue-50/80 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20";
      case "in_progress":
        return "bg-blue-50/80 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20";
      default:
        return "bg-slate-50/80 dark:bg-slate-500/10 text-slate-800 dark:text-slate-400 border-slate-200/50 dark:border-slate-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Hoàn tất";
      case "cancelled":
        return "Đã hủy";
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận - Vui lòng đến trạm";
      case "in_progress":
        return "Đang thực hiện";
      default:
        return status;
    }
  };

  // Load subscription hiện tại để check gói dịch vụ
  const loadActiveSubscription = async () => {
    try {
      const url = new URL(API_ENDPOINTS.SUBSCRIPTIONS.BASE);
      url.searchParams.set("status", "active");
      const res = await fetchWithAuth(url.toString());
      const data = await res.json();
      if (res.ok && data.success) {
        const subscriptions = data.data.subscriptions || data.data || [];
        const activeSub = subscriptions.find((sub: any) => {
          const now = new Date();
          const endDate = new Date(sub.end_date);
          // TODO: BE chưa tự động update status = "expired"
          const isStillValid =
            sub.status === "active" &&
            endDate >= now &&
            (sub.remaining_swaps === null || sub.remaining_swaps > 0);
          return isStillValid;
        });
        setActiveSubscription(activeSub || null);
      }
    } catch (e) {
      // Không có subscription - không ảnh hưởng
      console.log("No active subscription:", e);
    }
  };

  const loadBookings = async (page: number = currentPage) => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(API_ENDPOINTS.DRIVER.BOOKINGS);
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("limit", limit.toString());
      const res = await fetchWithAuth(url.toString());
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Tải lịch sử đặt chỗ thất bại");

      // Debug: Log raw API response
      console.log(
        "[BookingHistory] Raw API response:",
        JSON.stringify(data, null, 2)
      );
      const rawBookings = data.data.bookings || data.data || [];
      console.log(
        "[BookingHistory] Raw bookings[0].vehicle:",
        rawBookings[0]?.vehicle
      );

      const items: BookingItem[] = rawBookings;
      // Debug: Log current_battery data
      console.log("[BookingHistory] Loaded bookings:", items.length);
      items.forEach((booking, idx) => {
        console.log(`[BookingHistory] Booking ${idx + 1}:`, {
          booking_code: booking.booking_code,
          vehicle_id: booking.vehicle?.license_plate,
          vehicle_full: booking.vehicle,
          current_battery: booking.vehicle?.current_battery,
          has_current_battery: !!booking.vehicle?.current_battery,
          battery_code: booking.vehicle?.current_battery?.battery_code,
        });
      });
      setBookings(items);
      // Cập nhật thông tin pagination từ response
      if (data.data.pagination) {
        setTotalPages(data.data.pagination.pages || 1);
        setTotalBookingsCount(data.data.pagination.total || 0);
      } else {
        // Fallback: Nếu BE không trả về pagination, tính từ số lượng bookings
        const total = items.length;
        const calculatedPages = Math.ceil(total / limit);
        setTotalPages(calculatedPages > 0 ? calculatedPages : 1);
        setTotalBookingsCount(total);
      }
    } catch (e: any) {
      setError(e.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra booking có sử dụng gói dịch vụ không
  const isUsingSubscription = (booking: BookingItem): boolean => {
    // Ưu tiên dùng pricing_preview từ BE (chính xác hơn)
    if (booking.pricing_preview) {
      return (
        booking.pricing_preview.is_covered_by_subscription &&
        booking.pricing_preview.pricing_source === "subscription"
      );
    }

    // Fallback: Case 1: Booking đã completed và có transaction với amount = 0 và payment_status = completed
    if (
      booking.status === "completed" &&
      booking.transaction?.amount === 0 &&
      booking.transaction?.payment_status === "completed"
    ) {
      return true;
    }
    // Case 2: Booking chưa completed nhưng user có subscription active tại thời điểm đặt
    if (
      (booking.status === "confirmed" || booking.status === "in_progress") &&
      activeSubscription
    ) {
      const bookingDate = new Date(booking.scheduled_at);
      const subStart = new Date(activeSubscription.start_date);
      const subEnd = new Date(activeSubscription.end_date);
      // Booking nằm trong thời gian subscription
      if (bookingDate >= subStart && bookingDate <= subEnd) {
        return true;
      }
    }
    return false;
  };

  // Lấy giá hiển thị từ pricing_preview hoặc transaction
  const getDisplayPrice = (
    booking: BookingItem
  ): { price: number | null; isFree: boolean; message?: string } => {
    // Ưu tiên dùng pricing_preview từ BE
    if (booking.pricing_preview) {
      const preview = booking.pricing_preview;
      if (
        preview.is_covered_by_subscription &&
        preview.pricing_source === "subscription"
      ) {
        return { price: 0, isFree: true, message: preview.message };
      }
      return {
        price: preview.estimated_price,
        isFree: false,
        message: preview.message,
      };
    }

    // Fallback: Dùng transaction amount
    if (
      booking.status === "completed" &&
      booking.transaction?.amount !== undefined
    ) {
      return {
        price: booking.transaction.amount,
        isFree: booking.transaction.amount === 0,
      };
    }

    // Chưa có giá (chưa complete)
    return { price: null, isFree: false };
  };

  // Kiểm tra xem có thể hủy booking không (dựa trên thời gian)
  const canCancelBooking = (
    booking: BookingItem
  ): {
    canCancel: boolean;
    reason?: string;
    minutesUntilScheduled?: number;
  } => {
    // Chỉ cho hủy booking pending hoặc confirmed
    if (booking.status !== "pending" && booking.status !== "confirmed") {
      return {
        canCancel: false,
        reason: "Chỉ có thể hủy đặt chỗ đang chờ xác nhận hoặc đã xác nhận",
      };
    }

    // Tính thời gian còn lại đến giờ hẹn
    const scheduledTime = new Date(booking.scheduled_at);
    const now = new Date();
    const minutesUntilScheduled =
      (scheduledTime.getTime() - now.getTime()) / (1000 * 60);

    // Nếu đã qua giờ hẹn → Không thể hủy (đã quá hạn)
    if (minutesUntilScheduled < 0) {
      return {
        canCancel: false,
        reason: "Không thể hủy đặt chỗ đã quá giờ hẹn",
      };
    }

    // Nếu < 15 phút trước giờ hẹn → Không cho hủy
    if (minutesUntilScheduled < 15) {
      return {
        canCancel: false,
        reason:
          "Không thể hủy đặt chỗ trong vòng 15 phút trước giờ hẹn. Vui lòng liên hệ nhân viên nếu cần hỗ trợ.",
        minutesUntilScheduled,
      };
    }

    return { canCancel: true, minutesUntilScheduled };
  };

  const cancelBooking = async (id: string) => {
    // Tìm booking để check thời gian
    const booking = bookings.find((b) => b.booking_id === id);
    if (!booking) {
      setError("Không tìm thấy đặt chỗ");
      return;
    }

    // Check xem có thể hủy không
    const cancelCheck = canCancelBooking(booking);
    if (!cancelCheck.canCancel) {
      setError(cancelCheck.reason || "Không thể hủy đặt chỗ này");
      return;
    }

    // Xác nhận trước khi hủy
    const confirmMessage =
      cancelCheck.minutesUntilScheduled &&
      cancelCheck.minutesUntilScheduled < 30
        ? `Bạn có chắc muốn hủy đặt chỗ này? Còn ${Math.round(
            cancelCheck.minutesUntilScheduled
          )} phút nữa đến giờ hẹn.`
        : "Bạn có chắc muốn hủy đặt chỗ này?";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(
        `${API_ENDPOINTS.DRIVER.BOOKINGS}/${id}/cancel`,
        { method: "PUT" }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        // Xử lý error message từ BE
        const errorMessage = data.message || "Hủy đặt chỗ thất bại";

        // Check error message cụ thể từ BE
        if (
          errorMessage.includes("15 minutes") ||
          errorMessage.includes("Cannot cancel booking within")
        ) {
          throw new Error(
            "Không thể hủy đặt chỗ trong vòng 15 phút trước giờ hẹn. Vui lòng liên hệ nhân viên nếu cần hỗ trợ."
          );
        }

        if (
          errorMessage.includes("not found") ||
          errorMessage.includes("cannot be cancelled")
        ) {
          throw new Error(
            "Không tìm thấy đặt chỗ hoặc không thể hủy đặt chỗ này."
          );
        }

        throw new Error(errorMessage);
      }

      // Success
      await loadBookings();
      // Có thể thêm toast notification ở đây nếu cần
    } catch (e: any) {
      setError(e.message || "Có lỗi xảy ra khi hủy đặt chỗ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset về trang 1 khi filter thay đổi
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    // Load subscription và bookings khi trang hoặc filter thay đổi
    loadActiveSubscription();
    loadBookings(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter]);

  const filteredBookings = bookings.filter((booking) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      (booking.station?.name || "").toLowerCase().includes(s) ||
      (booking.vehicle?.model || "").toLowerCase().includes(s) ||
      (booking.booking_code || "").toLowerCase().includes(s);
    return matchesSearch;
  });

  const totalBookings = totalBookingsCount; // Sử dụng total từ pagination thay vì length
  const completedBookings = bookings.filter(
    (b) => b.status === "completed"
  ).length; // Chỉ đếm trong trang hiện tại

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const exportConfirmationVoucher = (booking: BookingItem) => {
    // Tạo Confirmation Voucher - Phiếu xác nhận đặt chỗ để xuất trình tại trạm
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Phiếu xác nhận đặt chỗ - ${booking.booking_code}</title>
          <style>
            @media print {
              body { margin: 0; padding: 10px; }
              .no-print { display: none; }
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 20px;
              max-width: 600px;
              margin: 0 auto;
              background: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #3b82f6;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #1e40af;
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            .booking-code-box {
              background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
              color: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .booking-code-label {
              font-size: 14px;
              opacity: 0.9;
              margin-bottom: 8px;
            }
            .booking-code {
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 3px;
              font-family: 'Courier New', monospace;
            }
            .status-badge {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              margin-top: 10px;
              background: #10b981;
              color: white;
            }
            .section {
              margin: 20px 0;
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
            }
            .section h3 {
              margin: 0 0 12px 0;
              color: #1e40af;
              font-size: 16px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #475569;
              min-width: 120px;
            }
            .value {
              color: #1e293b;
              text-align: right;
              flex: 1;
            }
            .notice {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 6px;
              font-size: 13px;
              color: #92400e;
            }
            .notice strong {
              display: block;
              margin-bottom: 5px;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px dashed #cbd5e1;
              font-size: 11px;
              color: #64748b;
            }
            .qr-placeholder {
              text-align: center;
              margin: 20px 0;
              padding: 20px;
              background: #f1f5f9;
              border-radius: 8px;
            }
            .no-print {
              text-align: center;
              margin: 20px 0;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PHIẾU XÁC NHẬN ĐẶT CHỖ</h1>
            <div class="booking-code-box">
              <div class="booking-code-label">MÃ ĐƠN HÀNG</div>
              <div class="booking-code">${booking.booking_code}</div>
            </div>
            <div class="status-badge">${getStatusLabel(booking.status)}</div>
          </div>
          
          <div class="section">
            <h3>📍 Thông tin trạm</h3>
            <div class="info-row">
              <span class="label">Tên trạm:</span>
              <span class="value">${booking.station?.name || "—"}</span>
            </div>
            <div class="info-row">
              <span class="label">Địa chỉ:</span>
              <span class="value">${booking.station?.address || "—"}</span>
            </div>
          </div>

          <div class="section">
            <h3>🚗 Thông tin xe</h3>
            <div class="info-row">
              <span class="label">Biển số:</span>
              <span class="value">${
                booking.vehicle?.license_plate || "—"
              }</span>
            </div>
            <div class="info-row">
              <span class="label">Loại xe:</span>
              <span class="value">${booking.vehicle?.vehicle_type || "—"}</span>
            </div>
            ${
              booking.vehicle?.model
                ? `
            <div class="info-row">
              <span class="label">Model:</span>
              <span class="value">${booking.vehicle.model}</span>
            </div>
            `
                : ""
            }
          </div>

          <div class="section">
            <h3>📅 Thời gian</h3>
            <div class="info-row">
              <span class="label">Ngày đặt:</span>
              <span class="value">${
                booking.created_at
                  ? new Date(booking.created_at).toLocaleDateString("vi-VN")
                  : new Date(booking.scheduled_at).toLocaleDateString("vi-VN")
              }</span>
            </div>
            <div class="info-row">
              <span class="label">Giờ đặt:</span>
              <span class="value">${
                booking.created_at
                  ? new Date(booking.created_at).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : new Date(booking.scheduled_at).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
              }</span>
            </div>
            ${
              booking.scheduled_at &&
              booking.created_at &&
              new Date(booking.scheduled_at).getTime() !==
                new Date(booking.created_at).getTime()
                ? `
            <div class="info-row">
              <span class="label">Thời gian hẹn:</span>
              <span class="value">${new Date(
                booking.scheduled_at
              ).toLocaleString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}</span>
            </div>
            `
                : ""
            }
          </div>

          <div class="notice">
            <strong>⚠️ LƯU Ý QUAN TRỌNG</strong>
            Vui lòng xuất trình <strong>MÃ ĐƠN HÀNG: ${
              booking.booking_code
            }</strong> khi đến trạm để nhân viên xác thực và thực hiện đổi pin.
            <br><br>
            Phiếu này có thể được lưu dưới dạng ảnh hoặc in ra để sử dụng khi không có internet.
          </div>

          <div class="footer">
            <div>Xuất ngày: ${new Date().toLocaleString("vi-VN")}</div>
            <div style="margin-top: 5px;">EVSwap - Hệ thống đổi pin xe điện</div>
          </div>

          <div class="no-print">
            <p>Đang mở hộp thoại in... Nếu không tự động mở, vui lòng nhấn Ctrl+P (Windows) hoặc Cmd+P (Mac)</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
            Lịch sử Thay pin
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Xem lịch sử và chi tiết các lần thay pin
          </p>
        </div>
        <Button
          className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={() => loadBookings(currentPage)}
          disabled={loading}
        >
          {loading ? (
            <BatteryLoading size="sm" variant="rotate" className="mr-2" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          <span>Làm mới</span>
        </Button>
      </div>

      {error && (
        <ErrorDisplay
          error={error}
          onRetry={() => {
            setError("");
            loadBookings(currentPage);
          }}
          variant="inline"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 gradient-primary rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Tổng lần thay
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {totalBookings}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Đã hoàn thành
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {completedBookings}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-0 glow">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Tìm kiếm theo trạm, xe hoặc mã đặt chỗ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as any)}
            >
              <SelectTrigger className="w-full md:w-48 bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800 border-0">
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="pending">Chờ xác nhận</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading && bookings.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card border-0">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card
              key={booking.booking_id}
              className="glass-card border-0 glow-hover"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 gradient-primary rounded-lg shadow-lg">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 flex-wrap gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {booking.station?.name || "—"}
                        </h3>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1">
                            {getStatusLabel(booking.status)}
                          </span>
                        </Badge>
                        {isUsingSubscription(booking) && (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">
                            <Package className="h-3 w-3 mr-1" />
                            <Zap className="h-3 w-3 mr-1" />
                            Miễn phí - Gói dịch vụ
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {booking.station?.address || "—"}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <Car className="inline h-4 w-4 mr-1" />
                        {booking.vehicle?.license_plate}{" "}
                        {booking.vehicle?.model
                          ? `(${booking.vehicle.model})`
                          : ""}
                      </p>
                      {booking.vehicle?.current_battery?.battery_code && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Mã Pin hiện tại:{" "}
                          <span className="font-mono font-semibold text-slate-900 dark:text-white">
                            {booking.vehicle.current_battery.battery_code}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">
                        Ngày đặt
                      </p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {booking.created_at
                          ? new Date(booking.created_at).toLocaleDateString(
                              "vi-VN"
                            )
                          : new Date(booking.scheduled_at).toLocaleDateString(
                              "vi-VN"
                            )}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">
                        Giờ đặt
                      </p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {booking.created_at
                          ? new Date(booking.created_at).toLocaleTimeString(
                              "vi-VN",
                              { hour: "2-digit", minute: "2-digit" }
                            )
                          : new Date(booking.scheduled_at).toLocaleTimeString(
                              "vi-VN",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                      </p>
                      {booking.scheduled_at &&
                        booking.created_at &&
                        new Date(booking.scheduled_at).getTime() !==
                          new Date(booking.created_at).getTime() && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Hẹn:{" "}
                            {new Date(booking.scheduled_at).toLocaleTimeString(
                              "vi-VN",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </p>
                        )}
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">
                        Chi phí
                      </p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {(() => {
                          const priceInfo = getDisplayPrice(booking);
                          if (priceInfo.isFree) {
                            return (
                              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                <Zap className="h-4 w-4" />
                                Miễn phí
                              </span>
                            );
                          }
                          if (priceInfo.price !== null) {
                            return `${Number(priceInfo.price).toLocaleString(
                              "vi-VN"
                            )} đ`;
                          }
                          // Chưa có giá (chưa complete) - hiển thị estimated từ pricing_preview
                          if (
                            booking.pricing_preview?.estimated_price !== null &&
                            booking.pricing_preview?.estimated_price !==
                              undefined
                          ) {
                            return (
                              <span className="text-slate-500 dark:text-slate-400">
                                ~
                                {Number(
                                  booking.pricing_preview.estimated_price
                                ).toLocaleString("vi-VN")}{" "}
                                đ
                              </span>
                            );
                          }
                          return "Chưa thanh toán";
                        })()}
                      </p>
                      {booking.pricing_preview?.message &&
                        booking.status !== "completed" && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {booking.pricing_preview.message}
                          </p>
                        )}
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Mã</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {booking.booking_code}
                      </p>
                    </div>
                  </div>

                  {/* Nút hành động - Sắp xếp dọc: Hủy đặt chỗ ở trên, Xuất phiếu xác nhận ở dưới */}
                  <div className="flex flex-col gap-2">
                    {(booking.status === "pending" ||
                      booking.status === "confirmed") &&
                      (() => {
                        const cancelCheck = canCancelBooking(booking);
                        const isDisabled = !cancelCheck.canCancel || loading;

                        return (
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className={`glass border-red-200/50 dark:border-red-400/30 hover:bg-red-50/50 dark:hover:bg-red-500/10 ${
                                isDisabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              onClick={() => cancelBooking(booking.booking_id)}
                              disabled={isDisabled}
                              title={cancelCheck.reason}
                            >
                              Hủy đặt chỗ
                            </Button>
                            {!cancelCheck.canCancel && cancelCheck.reason && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                {cancelCheck.minutesUntilScheduled !==
                                  undefined &&
                                cancelCheck.minutesUntilScheduled < 15
                                  ? `⚠️ Còn ${Math.round(
                                      cancelCheck.minutesUntilScheduled
                                    )} phút - Không thể hủy`
                                  : "⚠️ " + cancelCheck.reason}
                              </p>
                            )}
                            {cancelCheck.canCancel &&
                              cancelCheck.minutesUntilScheduled !== undefined &&
                              cancelCheck.minutesUntilScheduled < 30 && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                  ⚠️ Còn{" "}
                                  {Math.round(
                                    cancelCheck.minutesUntilScheduled
                                  )}{" "}
                                  phút - Hủy ngay nếu cần
                                </p>
                              )}
                          </div>
                        );
                      })()}
                    {(booking.status === "confirmed" ||
                      booking.status === "in_progress") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-500 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        onClick={() => exportConfirmationVoucher(booking)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Xuất phiếu xác nhận
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredBookings.length === 0 && !loading && (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Không tìm thấy đặt chỗ
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls - Hiển thị khi có nhiều hơn 1 trang */}
      {totalPages > 1 && (
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Trang {currentPage} / {totalPages} • Tổng {totalBookingsCount}{" "}
                đơn
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loading}
                  className="glass border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || loading}
                  className="glass border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Sau
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookingHistory;
