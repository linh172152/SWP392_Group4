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
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Package,
  Zap,
  Battery,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import API_ENDPOINTS, { fetchWithAuth } from "../../config/api";
import { BatterySpinner, BatteryLoading } from "../ui/battery-loading";
import { ErrorDisplay } from "../ui/error-display";
import { Skeleton } from "../ui/skeleton";
import authService from "../../services/auth.service";

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
  status: "pending" | "confirmed" | "completed" | "cancelled";
  is_instant?: boolean; // Flag instant booking
  station?: { name: string; address: string };
  vehicle?: {
    license_plate: string;
    vehicle_type: string;
    model?: string;
    current_battery?: {
      battery_id: string;
      battery_code: string;
      status: string;
      current_charge: number;
    } | null;
  };
  transaction?: {
    amount?: number;
    payment_status?: string;
  };
  pricing_preview?: PricingPreview;
  hold_summary?: HoldSummary;
  use_subscription?: boolean;
  locked_subscription_id?: string | null;
  locked_wallet_amount?: number;
  hold_expires_at?: string | null;
  battery_model?: string; // Battery model for this booking
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
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<BookingItem | null>(
    null
  );
  const [cancelConfirmMessage, setCancelConfirmMessage] = useState("");
  const [voucherDialogOpen, setVoucherDialogOpen] = useState(false);
  const [selectedBookingForVoucher, setSelectedBookingForVoucher] =
    useState<BookingItem | null>(null);
  const [userInfo, setUserInfo] = useState<{
    full_name?: string;
    phone?: string;
  } | null>(null);

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
        return "Đã xác nhận";
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
    // QUAN TRỌNG: Ưu tiên dùng hold_summary.use_subscription - đây là thông tin chính xác từ BE khi booking được tạo
    // hold_summary chứa quyết định cuối cùng của driver khi đặt chỗ
    if (
      booking.hold_summary &&
      booking.hold_summary.use_subscription !== undefined
    ) {
      return booking.hold_summary.use_subscription === true;
    }

    // Fallback: Dùng use_subscription field trực tiếp từ booking (nếu có)
    // Đây là field driver đã chọn khi đặt chỗ
    if (booking.use_subscription !== undefined) {
      return booking.use_subscription === true;
    }

    // Nếu không có thông tin rõ ràng, mặc định là KHÔNG dùng subscription
    // (vì driver phải chủ động chọn dùng gói)
    return false;
  };

  // Lấy giá hiển thị từ booking.use_subscription, locked_wallet_amount, transaction, hoặc pricing_preview
  const getDisplayPrice = (
    booking: BookingItem
  ): { price: number | null; isFree: boolean; message?: string } => {
    // QUAN TRỌNG: Ưu tiên dùng booking.use_subscription và booking.locked_wallet_amount từ database
    // Đây là thông tin chính xác về quyết định của driver khi đặt chỗ

    // Nếu driver đã chọn dùng subscription → miễn phí
    if (booking.use_subscription === true) {
      // Có thể có hold_summary với subscription_name (khi mới tạo booking)
      const subscriptionName = booking.hold_summary?.subscription_name;
      return {
        price: 0,
        isFree: true,
        message: subscriptionName
          ? `Sử dụng gói "${subscriptionName}"`
          : "Miễn phí - Sử dụng gói dịch vụ",
      };
    }

    // Nếu driver KHÔNG chọn dùng subscription
    if (booking.use_subscription === false) {
      // Nếu có locked_wallet_amount > 0 → đã trừ tiền từ ví
      if (booking.locked_wallet_amount && booking.locked_wallet_amount > 0) {
        return {
          price: booking.locked_wallet_amount,
          isFree: false,
          message: `Đã trừ từ ví: ${Number(
            booking.locked_wallet_amount
          ).toLocaleString("vi-VN")}₫`,
        };
      }

      // Nếu booking đã completed → dùng transaction amount
      if (
        booking.status === "completed" &&
        booking.transaction?.amount !== undefined
      ) {
        // Nếu transaction amount = 0 → có thể là lỗi hoặc đã refund, nhưng vẫn hiển thị 0
        return {
          price: booking.transaction.amount,
          isFree: false,
        };
      }

      // Nếu chưa trừ tiền (chưa complete) → dùng pricing_preview hoặc hiển thị "sẽ trừ"
      if (
        booking.pricing_preview?.estimated_price !== null &&
        booking.pricing_preview?.estimated_price !== undefined
      ) {
        return {
          price: booking.pricing_preview.estimated_price,
          isFree: false,
          message: "Sẽ trừ từ ví khi hoàn tất đổi pin",
        };
      }

      // Chưa có giá cụ thể
      return {
        price: null,
        isFree: false,
        message: "Sẽ trừ từ ví khi hoàn tất đổi pin",
      };
    }

    // Fallback: Nếu không có use_subscription field (booking cũ)
    // Dùng transaction amount nếu đã completed
    if (
      booking.status === "completed" &&
      booking.transaction?.amount !== undefined
    ) {
      // Nếu transaction amount = 0 và có locked_subscription_id → đã dùng subscription
      if (booking.transaction.amount === 0 && booking.locked_subscription_id) {
        return {
          price: 0,
          isFree: true,
          message: "Miễn phí - Đã sử dụng gói dịch vụ",
        };
      }

      return {
        price: booking.transaction.amount,
        isFree: false,
      };
    }

    // Fallback: Dùng pricing_preview nếu có
    if (booking.pricing_preview) {
      const preview = booking.pricing_preview;

      // Chỉ coi là miễn phí nếu pricing_preview nói rõ là subscription
      if (
        preview.is_covered_by_subscription &&
        preview.pricing_source === "subscription"
      ) {
        return { price: 0, isFree: true, message: preview.message };
      }

      return {
        price: preview.estimated_price,
        isFree: false,
        message: preview.message || "Sẽ trừ từ ví khi hoàn tất đổi pin",
      };
    }

    // Chưa có giá
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

  const handleOpenCancelDialog = (id: string) => {
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

    // Tạo message xác nhận
    const confirmMessage =
      cancelCheck.minutesUntilScheduled &&
      cancelCheck.minutesUntilScheduled < 30
        ? `Bạn có chắc muốn hủy đặt chỗ này? Còn ${Math.round(
            cancelCheck.minutesUntilScheduled
          )} phút nữa đến giờ hẹn.`
        : "Bạn có chắc muốn hủy đặt chỗ này?";

    setBookingToCancel(booking);
    setCancelConfirmMessage(confirmMessage);
    setCancelDialogOpen(true);
  };

  const cancelBooking = async () => {
    if (!bookingToCancel) return;

    setLoading(true);
    setError("");
    setCancelDialogOpen(false);

    try {
      const res = await fetchWithAuth(
        `${API_ENDPOINTS.DRIVER.BOOKINGS}/${bookingToCancel.booking_id}/cancel`,
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
      setBookingToCancel(null);
      setCancelConfirmMessage("");
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

  const exportConfirmationVoucher = async (booking: BookingItem) => {
    setSelectedBookingForVoucher(booking);
    setVoucherDialogOpen(true);
    
    // Load user info for voucher
    try {
      const profileData = await authService.getProfile();
      const u = profileData.data?.user || profileData.data;
      setUserInfo({
        full_name: u.full_name || "",
        phone: u.phone || "",
      });
    } catch (e) {
      // Fallback to localStorage if API fails
      const storedUser = localStorage.getItem("ev_swap_user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserInfo({
          full_name: user.name || user.full_name || "",
          phone: user.phone || "",
        });
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
            Đơn đặt chỗ
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Quản lý và theo dõi các đơn đặt chỗ đổi pin của bạn
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
            <RefreshCw className="mr-2 h-4 w-4" />
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
                <div className="space-y-4">
                  {/* Header: Tên trạm và Status badges */}
                  <div className="flex items-start space-x-3">
                    <div className="p-3 gradient-primary rounded-lg shadow-lg flex-shrink-0">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {booking.station?.name || "—"}
                        </h3>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1">
                            {getStatusLabel(booking.status)}
                          </span>
                        </Badge>
                        {booking.is_instant && (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md">
                            <Zap className="h-3 w-3 mr-1" />
                            Đổi pin ngay
                          </Badge>
                        )}
                        {isUsingSubscription(booking) && (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">
                            <Package className="h-3 w-3 mr-1" />
                            <Zap className="h-3 w-3 mr-1" />
                            Miễn phí - Gói dịch vụ
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        {booking.station?.address || "—"}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <p className="flex items-center gap-1">
                          <Car className="h-4 w-4" />
                          {booking.vehicle?.license_plate}{" "}
                          {booking.vehicle?.model
                            ? `(${booking.vehicle.model})`
                            : ""}
                        </p>
                        {booking.vehicle?.current_battery?.battery_code && (
                          <p className="flex items-center gap-1">
                            <Battery className="h-4 w-4" />
                            Mã Pin:{" "}
                            <span className="font-mono font-semibold text-slate-900 dark:text-white">
                              {booking.vehicle.current_battery.battery_code}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hold Summary - Thông tin giữ chỗ */}
                  {booking.hold_summary &&
                    (booking.status === "pending" ||
                      booking.status === "confirmed") && (
                      <div className="p-3 bg-blue-50/50 dark:bg-blue-500/10 rounded-lg border border-blue-200/50 dark:border-blue-500/20">
                        <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-2">
                          📌 Pin đã được giữ chỗ
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {booking.hold_summary.battery_code && (
                            <p className="text-blue-700 dark:text-blue-400">
                              Mã pin:{" "}
                              <span className="font-mono font-semibold">
                                {booking.hold_summary.battery_code}
                              </span>
                            </p>
                          )}
                          {booking.hold_summary.hold_expires_at && (
                            <p className="text-blue-700 dark:text-blue-400">
                              Hết hạn giữ chỗ:{" "}
                              {new Date(
                                booking.hold_summary.hold_expires_at
                              ).toLocaleString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {(() => {
                                const expiresAt = new Date(
                                  booking.hold_summary.hold_expires_at
                                );
                                const now = new Date();
                                const minutesLeft =
                                  (expiresAt.getTime() - now.getTime()) /
                                  (1000 * 60);
                                if (minutesLeft > 0 && minutesLeft <= 15) {
                                  return (
                                    <span className="text-amber-600 dark:text-amber-400 ml-1">
                                      ⚠️ Còn {Math.round(minutesLeft)} phút
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </p>
                          )}
                          {booking.hold_summary.use_subscription &&
                            booking.hold_summary.subscription_name && (
                              <p className="text-green-700 dark:text-green-400 sm:col-span-2">
                                ✓ Sử dụng gói:{" "}
                                {booking.hold_summary.subscription_name}
                                {booking.hold_summary.subscription_unlimited
                                  ? " (Không giới hạn)"
                                  : booking.hold_summary
                                      .subscription_remaining_after !== null
                                  ? ` (Còn ${booking.hold_summary.subscription_remaining_after} lượt)`
                                  : ""}
                              </p>
                            )}
                          {!booking.hold_summary.use_subscription &&
                            booking.hold_summary.wallet_amount_locked && (
                              <p className="text-slate-700 dark:text-slate-300 sm:col-span-2">
                                💰 Đã trừ:{" "}
                                {Number(
                                  booking.hold_summary.wallet_amount_locked
                                ).toLocaleString("vi-VN")}{" "}
                                đ
                                {booking.hold_summary.wallet_balance_after !==
                                  null && (
                                  <span className="ml-2">
                                    (Số dư:{" "}
                                    {Number(
                                      booking.hold_summary.wallet_balance_after
                                    ).toLocaleString("vi-VN")}{" "}
                                    đ)
                                  </span>
                                )}
                              </p>
                            )}
                        </div>
                      </div>
                    )}

                  {/* Thông tin đặt chỗ: Ngày, giờ, chi phí, mã */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        Ngày đặt
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
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
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        Giờ đặt
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
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
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        Chi phí
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
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
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        Mã đặt chỗ
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white font-mono">
                        {booking.booking_code}
                      </p>
                    </div>
                  </div>

                  {/* Nút hành động - Căn phải */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-200 dark:border-slate-700 justify-end items-end">
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
                              onClick={() =>
                                handleOpenCancelDialog(booking.booking_id)
                              }
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
                    {(booking.status === "confirmed" || false) && (
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

      {/* Cancel Booking Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Xác nhận hủy đặt chỗ
            </AlertDialogTitle>
            <AlertDialogDescription>
              {cancelConfirmMessage || "Bạn có chắc muốn hủy đặt chỗ này?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={cancelBooking}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {loading ? "Đang xử lý..." : "Xác nhận hủy"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Voucher Dialog */}
      <Dialog open={voucherDialogOpen} onOpenChange={setVoucherDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-slate-900 dark:text-white">
              PHIẾU XÁC NHẬN ĐẶT CHỖ
            </DialogTitle>
            <DialogDescription className="sr-only">
              Phiếu xác nhận để xuất trình tại trạm
            </DialogDescription>
          </DialogHeader>

          {selectedBookingForVoucher && (
            <div className="space-y-5 mt-4">
              {/* Mã đặt chỗ - Phần quan trọng nhất */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-center shadow-lg">
                <p className="text-blue-100 text-xs mb-2 uppercase tracking-wide">
                  Mã đơn hàng
                </p>
                <p className="text-white text-4xl font-bold font-mono tracking-wider">
                  {selectedBookingForVoucher.booking_code}
                </p>
              </div>

              {/* Thông tin cần thiết cho check-in */}
              <div className="space-y-4">
                {/* Thông tin tài xế */}
                {(userInfo?.full_name || userInfo?.phone) && (
                  <>
                    {userInfo.full_name && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Tài xế:
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {userInfo.full_name}
                        </span>
                      </div>
                    )}
                    {userInfo.phone && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Số điện thoại:
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {userInfo.phone}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Tên trạm */}
                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Trạm:
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedBookingForVoucher.station?.name || "—"}
                  </span>
                </div>

                {/* Thông tin xe */}
                {selectedBookingForVoucher.vehicle?.license_plate && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Biển số:
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {selectedBookingForVoucher.vehicle.license_plate}
                    </span>
                  </div>
                )}

                {/* Model Pin */}
                {selectedBookingForVoucher.battery_model && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Model Pin:
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {selectedBookingForVoucher.battery_model}
                    </span>
                  </div>
                )}

                {/* Thời gian đặt - Thời gian hẹn */}
                {(selectedBookingForVoucher.created_at ||
                  selectedBookingForVoucher.scheduled_at) &&
                  (() => {
                    const createdDate = selectedBookingForVoucher.created_at
                      ? new Date(selectedBookingForVoucher.created_at)
                      : null;
                    const scheduledDate = selectedBookingForVoucher.scheduled_at
                      ? new Date(selectedBookingForVoucher.scheduled_at)
                      : null;

                    // Kiểm tra xem có cùng ngày không
                    const isSameDay =
                      createdDate &&
                      scheduledDate &&
                      createdDate.toDateString() === scheduledDate.toDateString();

                    return (
                      <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Thời gian:
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white text-right">
                          {isSameDay && createdDate ? (
                            <>
                              {createdDate.toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}{" "}
                              - Đặt:{" "}
                              {createdDate.toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              - Hẹn:{" "}
                              {scheduledDate.toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </>
                          ) : (
                            <>
                              {createdDate && (
                                <span>
                                  Đặt:{" "}
                                  {createdDate.toLocaleString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                              {createdDate && scheduledDate && (
                                <span className="mx-2">-</span>
                              )}
                              {scheduledDate && (
                                <span>
                                  Hẹn:{" "}
                                  {scheduledDate.toLocaleString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })()}

                {/* Instant booking badge */}
                {selectedBookingForVoucher.is_instant && (
                  <div className="flex justify-center py-2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                      Đổi pin ngay
                    </Badge>
                  </div>
                )}
              </div>

              {/* Lưu ý ngắn gọn */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  Vui lòng xuất trình mã đơn hàng khi đến trạm
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingHistory;
