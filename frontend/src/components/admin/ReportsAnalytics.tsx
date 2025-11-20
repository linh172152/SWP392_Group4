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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-white">
                    Báo Cáo & Phân Tích
                  </CardTitle>
                  <p className="text-blue-100 text-sm mt-1">
                    Thống kê hiệu suất hệ thống theo thời gian thực
                  </p>
                </div>
              </div>

              {/* Period Selector */}
              <div className="flex gap-2 bg-white/10 backdrop-blur-md rounded-lg p-1 border border-white/20">
                {(["day", "week", "month"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                      period === p
                        ? "bg-white text-blue-600 shadow-md"
                        : "text-white hover:bg-white/10"
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
              <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Kỳ báo cáo: {stats.period}
                  </span>
                </div>
              </div>
            )}
          </CardHeader>
        </Card>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-lg">
            <p className="text-red-700 font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && stats && (
          <>
            {/* Revenue Section */}
            <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-white">
                      Phân Tích Doanh Thu
                    </CardTitle>
                    <p className="text-green-100 text-sm">
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
            <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-white">
                      Thống Kê Đặt Chỗ
                    </CardTitle>
                    <p className="text-blue-100 text-sm">
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
              <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white">
                        Giao Dịch
                      </CardTitle>
                      <p className="text-indigo-100 text-sm">
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
                <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Building className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-white">
                          Trạm
                        </CardTitle>
                        <p className="text-blue-100 text-sm">
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
                <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-white">
                          Người Dùng
                        </CardTitle>
                        <p className="text-slate-200 text-sm">
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
              <BarChart3 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg font-medium">
                Không có dữ liệu phân tích
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Thử chọn khoảng thời gian khác
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReportsAnalytics;
