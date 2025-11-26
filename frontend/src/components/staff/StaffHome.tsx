import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Battery, 
  Zap, 
  Clock, 
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Activity,
  RefreshCw,
  Play,
  Pause,
  CheckCircle2,
  Wrench,
  AlertTriangle
} from 'lucide-react';
import { getStationBatteries, getStationBookings, Battery as BatteryType, StaffBooking } from '../../services/staff.service';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '../ui/pagination';
import { useToast } from '../../hooks/use-toast';
import { parseError, logError } from '../../utils/errorHandler';

const StaffHome: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [batteries, setBatteries] = useState<BatteryType[]>([]);
  const [recentBookings, setRecentBookings] = useState<StaffBooking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<StaffBooking[]>([]);
  const [stationName, setStationName] = useState<string>('Trạm');
  
  // Pagination for recent transactions
  const [recentTransactionsPage, setRecentTransactionsPage] = useState(1);
  const [recentTransactionsPageSize] = useState(5);
  const [recentTransactionsTotal, setRecentTransactionsTotal] = useState(0);
  const [recentTransactionsTotalPages, setRecentTransactionsTotalPages] = useState(1);
  
  // Auto-refresh state
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  
  const { toast } = useToast();

  // Tính toán stats từ batteries
  const totalBatteries = batteries.length;
  const availableBatteries = batteries.filter(b => b.status === 'full').length;
  const chargingBatteries = batteries.filter(b => b.status === 'charging').length;
  const maintenanceBatteries = batteries.filter(b => b.status === 'maintenance').length;
  const damagedBatteries = batteries.filter(b => b.status === 'damaged').length;
  const currentQueue = pendingBookings.length;

  const batteryUtilization = totalBatteries > 0 
    ? Math.round(((totalBatteries - availableBatteries) / totalBatteries) * 100)
    : 0;

  const loadData = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      // Load batteries
      const batteriesRes = await getStationBatteries();
      if (batteriesRes.success && batteriesRes.data) {
        setBatteries(batteriesRes.data);
        if (batteriesRes.data.length > 0 && batteriesRes.data[0].station) {
          setStationName(batteriesRes.data[0].station.name);
        }
      }

      // Load recent completed bookings (giao dịch gần đây) with pagination
      const completedBookingsRes = await getStationBookings({ 
        status: 'completed', 
        page: recentTransactionsPage,
        limit: recentTransactionsPageSize
      });
      if (completedBookingsRes.success && completedBookingsRes.data) {
        setRecentBookings(completedBookingsRes.data.bookings || []);
        if (completedBookingsRes.data.pagination) {
          setRecentTransactionsTotal(completedBookingsRes.data.pagination.total || 0);
          setRecentTransactionsTotalPages(completedBookingsRes.data.pagination.pages || 1);
        }
      }

      // Load pending bookings (hàng đợi hiện tại)
      const pendingBookingsRes = await getStationBookings({ 
        status: 'pending', 
        limit: 10 
      });
      if (pendingBookingsRes.success && pendingBookingsRes.data?.bookings) {
        setPendingBookings(pendingBookingsRes.data.bookings);
      }
      
      setLastRefreshTime(new Date());
    } catch (error: any) {
      logError(error, "StaffHome.fetchStats");
      if (!isAutoRefresh) {
        const errorInfo = parseError(error);
        toast({
          title: errorInfo.title,
          description: errorInfo.description,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Load data when pagination changes
  useEffect(() => {
    if (!loading) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentTransactionsPage]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      loadData(true);
    }, 30000); // Refresh every 30 seconds

    // Cleanup function - xóa interval khi component unmount hoặc autoRefreshEnabled thay đổi
    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefreshEnabled]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'glass border-0 bg-green-500/20 text-green-700 dark:text-green-400';
      case 'confirmed': return 'glass border-0 bg-blue-500/20 text-blue-700 dark:text-blue-400';
      case 'pending': return 'glass border-0 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
      case 'cancelled': return 'glass border-0 bg-red-500/20 text-red-700 dark:text-red-400';
      default: return 'glass border-0 bg-slate-500/20 text-slate-700 dark:text-slate-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'confirmed': return 'Đã xác nhận';
      case 'pending': return 'Chờ xử lý';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateDuration = (booking: StaffBooking) => {
    if (booking.transaction?.swap_started_at && booking.transaction?.swap_completed_at) {
      const start = new Date(booking.transaction.swap_started_at);
      const end = new Date(booking.transaction.swap_completed_at);
      const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      return `${minutes} phút`;
    }
    return '-';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-slate-600 dark:text-slate-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mb-2">
            Tổng quan trạm
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            {stationName} • Bảng điều khiển vận hành thời gian thực
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="glass border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-500/10 shadow-sm"
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            title={autoRefreshEnabled ? 'Tắt tự động làm mới' : 'Bật tự động làm mới'}
          >
            {autoRefreshEnabled ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Tắt tự động
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Bật tự động
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            className="glass border-green-200/50 dark:border-emerald-400/30 hover:bg-green-50/50 dark:hover:bg-emerald-500/10 shadow-sm"
            onClick={() => loadData(false)}
            disabled={loading || refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Key Metrics - Redesigned */}
<<<<<<< HEAD
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
=======
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
>>>>>>> 4b3d6fb84f5b1c133031087768f2b7b501caec88
        <Card className="glass-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Pin khả dụng</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {availableBatteries}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  / {totalBatteries} tổng số
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Battery className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Hàng đợi</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {currentQueue}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  đang chờ xử lý
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Đang sạc</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {chargingBatteries}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  pin đang sạc
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Activity className="h-6 w-6 text-white" />
<<<<<<< HEAD
=======
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Sử dụng</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {batteryUtilization}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  tỷ lệ sử dụng
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-white" />
>>>>>>> 4b3d6fb84f5b1c133031087768f2b7b501caec88
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Battery Status - Redesigned */}
        <Card className="glass-card border-0 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Battery className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900 dark:text-white">Trạng thái pin</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">Phân tích kho hiện tại</CardDescription>
              </div>
            </div>
          </CardHeader>
<<<<<<< HEAD
          <CardContent className="space-y-6">
            {totalBatteries === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Battery className="h-10 w-10 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
=======
          <CardContent className="space-y-5">
            {totalBatteries === 0 ? (
              <div className="text-center py-8">
                <Battery className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
>>>>>>> 4b3d6fb84f5b1c133031087768f2b7b501caec88
                  Chưa có dữ liệu pin
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
<<<<<<< HEAD
                  {/* Khả dụng */}
                  <div className="group relative p-4 rounded-xl bg-gradient-to-r from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 border border-green-200/50 dark:border-green-800/30 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Khả dụng</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400 block leading-none">
                          {availableBatteries}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={(availableBatteries / totalBatteries) * 100} 
                        className="h-2.5 bg-green-100/50 dark:bg-green-900/20"
                      />
                      <div 
                        className="absolute top-0 left-0 h-2.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${(availableBatteries / totalBatteries) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Đang sạc */}
                  <div className="group relative p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10 border border-blue-200/50 dark:border-blue-800/30 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Đang sạc</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 block leading-none">
                          {chargingBatteries}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={(chargingBatteries / totalBatteries) * 100} 
                        className="h-2.5 bg-blue-100/50 dark:bg-blue-900/20"
                      />
                      <div 
                        className="absolute top-0 left-0 h-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full transition-all duration-500"
                        style={{ width: `${(chargingBatteries / totalBatteries) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Bảo trì */}
                  <div className="group relative p-4 rounded-xl bg-gradient-to-r from-yellow-50/50 to-amber-50/30 dark:from-yellow-950/20 dark:to-amber-950/10 border border-yellow-200/50 dark:border-yellow-800/30 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                          <Wrench className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Bảo trì</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 block leading-none">
                          {maintenanceBatteries}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={(maintenanceBatteries / totalBatteries) * 100} 
                        className="h-2.5 bg-yellow-100/50 dark:bg-yellow-900/20"
                      />
                      <div 
                        className="absolute top-0 left-0 h-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${(maintenanceBatteries / totalBatteries) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Hỏng */}
                  <div className="group relative p-4 rounded-xl bg-gradient-to-r from-red-50/50 to-rose-50/30 dark:from-red-950/20 dark:to-rose-950/10 border border-red-200/50 dark:border-red-800/30 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                          <AlertTriangle className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Hỏng</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-red-600 dark:text-red-400 block leading-none">
                          {damagedBatteries}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={(damagedBatteries / totalBatteries) * 100} 
                        className="h-2.5 bg-red-100/50 dark:bg-red-900/20"
                      />
                      <div 
                        className="absolute top-0 left-0 h-2.5 bg-gradient-to-r from-red-500 to-rose-600 rounded-full transition-all duration-500"
                        style={{ width: `${(damagedBatteries / totalBatteries) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tổng số pin - Enhanced */}
                <div className="pt-5 border-t-2 border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50">
                    <div className="flex items-center gap-2">
                      <Battery className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tổng số pin</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                        {totalBatteries}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">pin</span>
                    </div>
=======
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Khả dụng</span>
                      </div>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">{availableBatteries}</span>
                    </div>
                    <Progress 
                      value={(availableBatteries / totalBatteries) * 100} 
                      className="h-3 bg-slate-200 dark:bg-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Đang sạc</span>
                      </div>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{chargingBatteries}</span>
                    </div>
                    <Progress 
                      value={(chargingBatteries / totalBatteries) * 100} 
                      className="h-3 bg-slate-200 dark:bg-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bảo trì</span>
                      </div>
                      <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{maintenanceBatteries}</span>
                    </div>
                    <Progress 
                      value={(maintenanceBatteries / totalBatteries) * 100} 
                      className="h-3 bg-slate-200 dark:bg-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Hỏng</span>
                      </div>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">{damagedBatteries}</span>
                    </div>
                    <Progress 
                      value={(damagedBatteries / totalBatteries) * 100} 
                      className="h-3 bg-slate-200 dark:bg-slate-700"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tổng số pin</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{totalBatteries}</span>
>>>>>>> 4b3d6fb84f5b1c133031087768f2b7b501caec88
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Bookings - New Section */}
        <Card className="glass-card border-0 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-900 dark:text-white">Hàng đợi</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {pendingBookings.length > 0 ? `${pendingBookings.length} booking đang chờ` : 'Không có booking nào'}
                  </CardDescription>
                </div>
              </div>
              {pendingBookings.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="glass border-green-200/50 dark:border-emerald-400/30 hover:bg-green-50/50 dark:hover:bg-emerald-500/10"
                  onClick={() => window.location.href = '/staff/transactions?status=pending'}
                >
                  Xem tất cả
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pendingBookings.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Không có booking nào đang chờ
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {pendingBookings.slice(0, 5).map((booking) => (
                  <div 
                    key={booking.booking_id} 
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200/50 dark:border-orange-700/50 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex-shrink-0">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                          {booking.user?.full_name || 'Khách hàng'}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                          {booking.booking_code} • {booking.vehicle?.license_plate || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {formatDate(booking.scheduled_at)} • {formatTime(booking.scheduled_at)}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-600">
                      Chờ xử lý
                    </Badge>
                  </div>
                ))}
                {pendingBookings.length > 5 && (
                  <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-2">
                    +{pendingBookings.length - 5} booking khác
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions - Redesigned */}
      <Card className="glass-card border-0 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900 dark:text-white">Giao dịch gần đây</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Các hoạt động thay pin mới nhất
                  {autoRefreshEnabled && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Activity className="h-3 w-3 animate-pulse" />
                      Tự động làm mới
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="glass border-green-200/50 dark:border-emerald-400/30 hover:bg-green-50/50 dark:hover:bg-emerald-500/10 shadow-sm"
              onClick={() => window.location.href = '/staff/transactions'}
            >
              Xem tất cả
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 mx-auto mb-3 text-slate-400" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Chưa có giao dịch nào
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div 
                    key={booking.booking_id} 
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50 hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                          {booking.user?.full_name || 'Khách hàng'}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                          <span>{booking.booking_code}</span>
                          <span>•</span>
                          <span>{booking.vehicle?.license_plate || booking.vehicle?.model || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(booking.scheduled_at)} • {formatTime(booking.scheduled_at)}</span>
                          {calculateDuration(booking) !== '-' && (
                            <>
                              <span>•</span>
                              <span>{calculateDuration(booking)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <Badge className={`${getStatusColor(booking.status)} flex items-center gap-1 flex-shrink-0`}>
                      {booking.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                      {booking.status === 'confirmed' && <Clock className="h-3 w-3" />}
                      {getStatusText(booking.status)}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Pagination for Recent Transactions */}
              {recentTransactionsTotalPages > 1 && (
                <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setRecentTransactionsPage(prev => Math.max(1, prev - 1))}
                          className={recentTransactionsPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, recentTransactionsTotalPages) }, (_, i) => {
                        let pageNum: number;
                        if (recentTransactionsTotalPages <= 5) {
                          pageNum = i + 1;
                        } else if (recentTransactionsPage <= 3) {
                          pageNum = i + 1;
                        } else if (recentTransactionsPage >= recentTransactionsTotalPages - 2) {
                          pageNum = recentTransactionsTotalPages - 4 + i;
                        } else {
                          pageNum = recentTransactionsPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setRecentTransactionsPage(pageNum)}
                              isActive={recentTransactionsPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {recentTransactionsTotalPages > 5 && recentTransactionsPage < recentTransactionsTotalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setRecentTransactionsPage(prev => Math.min(recentTransactionsTotalPages, prev + 1))}
                          className={recentTransactionsPage === recentTransactionsTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="text-center text-xs text-slate-600 dark:text-slate-400 mt-3">
                    Trang {recentTransactionsPage} / {recentTransactionsTotalPages} • Tổng {recentTransactionsTotal} giao dịch
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Last Refresh Time */}
      {lastRefreshTime && (
        <div className="text-center text-xs text-slate-500 dark:text-slate-500">
          Cập nhật lần cuối: {lastRefreshTime.toLocaleTimeString('vi-VN')}
        </div>
      )}
    </div>
  );
};

export default StaffHome;
