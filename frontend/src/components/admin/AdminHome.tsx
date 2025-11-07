import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { getDashboardStats } from '../../services/report.service';
import type { DashboardStats } from '../../services/report.service';
import { 
  Building, 
  Users, 
  Zap, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  BarChart3,
  Calendar,
  CreditCard,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react';

const AdminHome: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

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
        throw new Error(res?.message || 'Failed to load dashboard data');
      }
    } catch (err: any) {
      console.error('Load dashboard error:', err);
      setError(err.message || 'Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'N/A') return null;
    const value = parseFloat(trend);
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'N/A') return 'text-slate-500';
    const value = parseFloat(trend);
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-slate-600';
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-white tracking-tight">
                    Bảng điều khiển Admin
                  </h1>
                  <p className="text-blue-100 text-lg mt-1">
                    Tổng quan hoạt động và hiệu suất hệ thống
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={fetchStats}
                  disabled={loading}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Làm mới
                </Button>
              </div>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2 bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/20 w-fit">
              {(['day', 'week', 'month'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    period === p
                      ? 'bg-white text-indigo-600 shadow-lg'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {p === 'day' ? 'Hôm nay' : p === 'week' ? 'Tuần này' : 'Tháng này'}
                </button>
              ))}
            </div>

            {stats && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 mt-4">
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="h-5 w-5" />
                  <span className="font-semibold">Kỳ: {stats.period}</span>
                </div>
              </div>
            )}
          </div>

          {/* Decorative shapes */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
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
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Active Stations */}
              <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                      <Building className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Trạm Hoạt động</p>
                      <p className="text-3xl font-black text-blue-600">{stats.stations.active}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Users */}
              <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Tổng Người dùng</p>
                      <p className="text-3xl font-black text-green-600">{stats.users.total}</p>
                      <div className="flex items-center text-xs text-green-600 mt-1">
                        +{stats.users.new_this_month} mới
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Bookings */}
              <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl shadow-lg">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Tổng Đặt chỗ</p>
                      <p className="text-3xl font-black text-purple-600">{stats.bookings.total}</p>
                      <div className="flex items-center text-xs gap-1 mt-1">
                        {getTrendIcon(stats.bookings.trend)}
                        <span className={getTrendColor(stats.bookings.trend)}>
                          {stats.bookings.trend}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Revenue */}
              <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-yellow-50 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl shadow-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Tổng Doanh thu</p>
                      <p className="text-2xl font-black text-orange-600">
                        {formatCurrency(stats.revenue.total)}
                      </p>
                      <div className="flex items-center text-xs gap-1 mt-1">
                        {getTrendIcon(stats.revenue.trend)}
                        <span className={getTrendColor(stats.revenue.trend)}>
                          {stats.revenue.trend}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue & Bookings Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Details */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Chi tiết Doanh thu</h2>
                      <p className="text-green-100 text-sm">Phân tích tài chính</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-slate-700">Trung bình Hàng ngày</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-black text-blue-600">
                        {formatCurrency(stats.revenue.daily_average)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-slate-700">
                        <CreditCard className="h-5 w-5" />
                        Theo Phương thức
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(stats.revenue.by_payment_method).map(([method, amount]) => (
                          amount > 0 && (
                            <div key={method} className="flex justify-between items-center p-2 bg-white rounded-lg">
                              <span className="text-sm font-medium text-slate-600 capitalize">
                                {method === 'wallet' ? 'Ví' : method === 'cash' ? 'Tiền mặt' : method.toUpperCase()}
                              </span>
                              <span className="text-sm font-bold text-purple-600">
                                {formatCurrency(amount as number)}
                              </span>
                            </div>
                          )
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Booking Status */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Trạng thái Đặt chỗ</h2>
                      <p className="text-blue-100 text-sm">Phân tích hoạt động</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Hoàn thành
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-black text-green-600">{stats.bookings.completed}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-yellow-100 bg-gradient-to-br from-yellow-50 to-orange-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          Đang chờ
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-black text-yellow-600">{stats.bookings.pending}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-red-100 bg-gradient-to-br from-red-50 to-pink-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm text-slate-600">
                          <XCircle className="h-4 w-4 text-red-500" />
                          Đã hủy
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-black text-red-600">{stats.bookings.cancelled}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-red-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-slate-600">Tỷ lệ Hủy</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-black text-orange-600">
                          {stats.bookings.cancellation_rate}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions & Most Popular Station */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transactions */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Giao dịch</h2>
                      <p className="text-purple-100 text-sm">Tổng quan thanh toán</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-slate-600">Tổng số</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-black text-purple-600">{stats.transactions.total}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-slate-600">TB Số tiền</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-black text-pink-600">
                          {formatCurrency(stats.transactions.average_amount)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50">
                    <CardHeader>
                      <CardTitle className="text-slate-700">Theo Model Pin</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(stats.transactions.by_battery_model).map(([model, count]) => (
                          <div key={model} className="flex justify-between items-center p-2 bg-white rounded-lg">
                            <span className="text-sm font-medium text-slate-700">{model}</span>
                            <span className="text-sm font-bold text-indigo-600">{count} GD</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Most Popular Station & Users */}
              <div className="space-y-6">
                {/* Most Popular Station */}
                {stats.stations.most_popular && (
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-yellow-500 to-amber-600 p-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Award className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">Trạm Phổ biến Nhất</h2>
                          <p className="text-yellow-100 text-sm">Hiệu suất cao nhất</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl">
                              <Building className="h-8 w-8 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-xl text-slate-800">
                                {stats.stations.most_popular.name}
                              </p>
                              <p className="text-sm text-slate-600 mt-1">
                                {stats.stations.most_popular.bookings_count} đặt chỗ trong kỳ
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Users Stats */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-500 to-green-600 p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Người dùng</h2>
                        <p className="text-teal-100 text-sm">Cộng đồng & hoạt động</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="border-2 border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xs text-slate-600">Tổng</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-black text-teal-600">{stats.users.total}</p>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xs text-slate-600">Hoạt động</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-black text-green-600">{stats.users.active_this_month}</p>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xs text-slate-600">Mới</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-black text-blue-600">{stats.users.new_this_month}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && !stats && (
          <Card className="text-center py-12">
            <CardContent>
              <BarChart3 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg font-medium">Không có dữ liệu</p>
              <p className="text-slate-400 text-sm mt-2">Thử chọn khoảng thời gian khác</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminHome;