import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { getDashboardStats } from '../../services/report.service';
import type { DashboardStats } from '../../services/report.service';
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
} from 'lucide-react';

const ReportsAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');

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
        throw new Error(res?.message || 'Failed to load statistics');
      }
    } catch (err: any) {
      console.error('Load stats error:', err);
      setError(err.message || 'Không thể tải dữ liệu thống kê');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-white tracking-tight">
                    Reports & Analytics
                  </h1>
                  <p className="text-indigo-100 text-lg mt-1">
                    Real-time system performance metrics
                  </p>
                </div>
              </div>

              {/* Period Selector */}
              <div className="flex gap-2 bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/20">
                {(['day', 'week', 'month'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      period === p
                        ? 'bg-white text-indigo-600 shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {p === 'day' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
                  </button>
                ))}
              </div>
            </div>

            {stats && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="h-5 w-5" />
                  <span className="font-semibold">Period: {stats.period}</span>
                </div>
              </div>
            )}
          </div>

          {/* Decorative shapes */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"></div>
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
            {/* Revenue Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Revenue Analytics</h2>
                    <p className="text-green-100">Financial performance overview</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Revenue */}
                  <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-slate-700">Total Revenue</span>
                        {getTrendIcon(stats.revenue.trend)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-black text-green-600 mb-2">
                        {formatCurrency(stats.revenue.total)}
                      </p>
                      <p className={`text-sm font-semibold ${getTrendColor(stats.revenue.trend)}`}>
                        {stats.revenue.trend} trend
                      </p>
                    </CardContent>
                  </Card>

                  {/* Daily Average */}
                  <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader>
                      <CardTitle className="text-slate-700">Daily Average</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-black text-blue-600">
                        {formatCurrency(stats.revenue.daily_average)}
                      </p>
                      <p className="text-sm text-slate-600 mt-2">per day</p>
                    </CardContent>
                  </Card>

                  {/* Payment Methods */}
                  <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-700">
                        <CreditCard className="h-5 w-5" />
                        Payment Methods
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(stats.revenue.by_payment_method).map(([method, amount]) => (
                          <div key={method} className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600 capitalize">
                              {method}
                            </span>
                            <span className="text-sm font-bold text-purple-600">
                              {formatCurrency(amount as number)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Bookings Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Booking Statistics</h2>
                    <p className="text-blue-100">Service usage metrics</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Total Bookings */}
                  <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-600">Total Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-black text-blue-600">{stats.bookings.total}</p>
                        {getTrendIcon(stats.bookings.trend)}
                      </div>
                      <p className={`text-xs font-semibold mt-1 ${getTrendColor(stats.bookings.trend)}`}>
                        {stats.bookings.trend}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Completed */}
                  <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Completed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-black text-green-600">{stats.bookings.completed}</p>
                    </CardContent>
                  </Card>

                  {/* Pending */}
                  <Card className="border-2 border-yellow-100 bg-gradient-to-br from-yellow-50 to-orange-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        Pending
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-black text-yellow-600">{stats.bookings.pending}</p>
                    </CardContent>
                  </Card>

                  {/* Cancelled */}
                  <Card className="border-2 border-red-100 bg-gradient-to-br from-red-50 to-pink-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm text-slate-600">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Cancelled
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-black text-red-600">{stats.bookings.cancelled}</p>
                    </CardContent>
                  </Card>

                  {/* Cancellation Rate */}
                  <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-red-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-600">Cancel Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-black text-orange-600">
                        {stats.bookings.cancellation_rate}%
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Transactions & Stations Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transactions Section */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Transactions</h2>
                      <p className="text-purple-100 text-sm">Payment overview</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardHeader>
                      <CardTitle className="text-slate-700">Total Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-black text-purple-600">{stats.transactions.total}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50">
                    <CardHeader>
                      <CardTitle className="text-slate-700">Average Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-black text-pink-600">
                        {formatCurrency(stats.transactions.average_amount)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-700">
                        <Zap className="h-5 w-5" />
                        By Battery Model
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(stats.transactions.by_battery_model).map(([model, count]) => (
                          <div key={model} className="flex justify-between items-center p-2 bg-white rounded-lg">
                            <span className="text-sm font-medium text-slate-700">{model}</span>
                            <span className="text-sm font-bold text-indigo-600">{count} txns</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Stations & Users Section */}
              <div className="space-y-6">
                {/* Stations */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Building className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Stations</h2>
                        <p className="text-cyan-100 text-sm">Network status</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="border-2 border-cyan-100 bg-gradient-to-br from-cyan-50 to-blue-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-slate-600">Active Stations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-black text-cyan-600">{stats.stations.active}</p>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-slate-600">Total Bookings</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-black text-blue-600">{stats.stations.total_bookings}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {stats.stations.most_popular && (
                      <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-slate-700">
                            <Award className="h-5 w-5 text-yellow-500" />
                            Most Popular
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="font-bold text-lg text-slate-800">
                            {stats.stations.most_popular.name}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            {stats.stations.most_popular.bookings_count} bookings
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Users */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-500 to-green-600 p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Users</h2>
                        <p className="text-teal-100 text-sm">Community growth</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="border-2 border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xs text-slate-600">Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xl font-black text-teal-600">{stats.users.total}</p>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xs text-slate-600">Active</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xl font-black text-green-600">{stats.users.active_this_month}</p>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xs text-slate-600">New</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xl font-black text-blue-600">{stats.users.new_this_month}</p>
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
              <p className="text-slate-500 text-lg font-medium">No analytics data available</p>
              <p className="text-slate-400 text-sm mt-2">Try selecting a different time period</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReportsAnalytics;
