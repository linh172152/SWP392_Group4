import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getDashboardStats } from "../../services/report.service";
import type { DashboardStats } from "../../services/report.service";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Building,
  CreditCard,
  Activity,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Award,
} from "lucide-react";

const ReportsAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboardStats(period);
      if (res && res.success) {
        setStats(res.data);
      } else {
        throw new Error(res?.message || "Failed to load statistics");
      }
    } catch (err: any) {
      console.error("Load stats error:", err);
      setError(err.message || "Không thể tải dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "N/A") return null;
    const value = parseFloat(trend);
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getTrendColor = (trend: string) => {
    if (trend === "N/A") return "text-slate-500";
    const value = parseFloat(trend);
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-slate-600";
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Báo Cáo & Phân Tích</h1>
          <p className="text-muted-foreground">
            Thống kê hiệu suất hệ thống theo thời gian thực
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-2">
          {(["day", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              disabled={loading}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {p === "day"
                ? "Hôm nay"
                : p === "week"
                ? "Tuần này"
                : "Tháng này"}
            </button>
          ))}
        </div>
      </div>

      {stats && (
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">
              Kỳ báo cáo: {stats.period}
            </span>
          </div>
        </div>
      )}
        {/* Error State */}
        {error && (
          <div className="bg-destructive/15 border border-destructive/20 p-4 rounded-lg">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && stats && (
          <>
            {/* Revenue Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl font-bold">
                      Phân Tích Doanh Thu
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                      Tổng quan hiệu suất tài chính
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Revenue */}
                  <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 dark:text-slate-300">
                          Tổng Doanh Thu
                        </span>
                        {getTrendIcon(stats.revenue.trend)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {formatCurrency(stats.revenue.total)}
                      </p>
                      <p
                        className={`text-xs font-medium ${getTrendColor(
                          stats.revenue.trend
                        )}`}
                      >
                        Xu hướng {stats.revenue.trend}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Daily Average */}
                  <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-700 dark:text-slate-300">
                        Trung Bình Ngày
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(stats.revenue.daily_average)}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        mỗi ngày
                      </p>
                    </CardContent>
                  </Card>

                  {/* Payment Methods */}
                  <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <CreditCard className="h-4 w-4" />
                        Phương Thức Thanh Toán
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(stats.revenue.by_payment_method).map(
                          ([method, amount]) => (
                            <div
                              key={method}
                              className="flex justify-between items-center py-1"
                            >
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
                                {method === "wallet"
                                  ? "Ví"
                                  : method === "cash"
                                  ? "Tiền mặt"
                                  : method.toUpperCase()}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {formatCurrency(amount as number)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Bookings Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl font-bold">
                      Thống Kê Đặt Chỗ
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                      Chỉ số sử dụng dịch vụ
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Total Bookings */}
                  <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-700 dark:text-slate-300">
                        Tổng Đặt Chỗ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {stats.bookings.total}
                        </p>
                        {getTrendIcon(stats.bookings.trend)}
                      </div>
                      <p
                        className={`text-xs font-medium mt-1 ${getTrendColor(
                          stats.bookings.trend
                        )}`}
                      >
                        {stats.bookings.trend}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Completed */}
                  <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Hoàn Thành
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.bookings.completed}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Pending */}
                  <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        Chờ Xử Lý
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {stats.bookings.pending}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Cancelled */}
                  <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Đã Hủy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {stats.bookings.cancelled}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Cancellation Rate */}
                  <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-700 dark:text-slate-300">
                        Tỷ Lệ Hủy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {stats.bookings.cancellation_rate}%
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Transactions & Stations Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transactions Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Activity className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle className="text-xl font-bold">
                        Giao Dịch
                      </CardTitle>
                      <p className="text-muted-foreground text-sm">
                        Tổng quan thanh toán
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-700 dark:text-slate-300">
                        Tổng Giao Dịch
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {stats.transactions.total}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-700 dark:text-slate-300">
                        Số Tiền Trung Bình
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(stats.transactions.average_amount)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <Zap className="h-4 w-4" />
                        Theo Mẫu Pin
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(
                          stats.transactions.by_battery_model
                        ).map(([model, count]) => (
                          <div
                            key={model}
                            className="flex justify-between items-center py-1.5 px-2 bg-white dark:bg-slate-700 rounded"
                          >
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {model}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {count} giao dịch
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Stations & Users Section */}
              <div className="space-y-6">
                {/* Stations */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Building className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-xl font-bold">
                          Trạm
                        </CardTitle>
                        <p className="text-muted-foreground text-sm">
                          Trạng thái mạng lưới
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-slate-700 dark:text-slate-300">
                            Trạm Hoạt Động
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {stats.stations.active}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-slate-700 dark:text-slate-300">
                            Tổng Đặt Chỗ
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {stats.stations.total_bookings}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {stats.stations.most_popular && (
                      <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <Award className="h-4 w-4 text-yellow-500" />
                            Phổ Biến Nhất
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="font-bold text-base text-slate-900 dark:text-slate-100">
                            {stats.stations.most_popular.name}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {stats.stations.most_popular.bookings_count} đặt chỗ
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>

                {/* Users */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Users className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-xl font-bold text-black">
                          Người Dùng
                        </CardTitle>
                        <p className="text-black-200 text-sm">
                          Tăng trưởng cộng đồng
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xs text-slate-700 dark:text-slate-300">
                            Tổng
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {stats.users.total}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xs text-slate-700 dark:text-slate-300">
                            Hoạt Động
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xl font-bold text-green-600 dark:text-green-400">
                            {stats.users.active_this_month}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xs text-slate-700 dark:text-slate-300">
                            Mới
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {stats.users.new_this_month}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && !stats && (
          <Card className="text-center py-12">
            <CardContent>
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg font-medium">
                Không có dữ liệu phân tích
              </p>
              <p className="text-muted-foreground/70 text-sm mt-2">
                Thử chọn khoảng thời gian khác
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default ReportsAnalytics;
