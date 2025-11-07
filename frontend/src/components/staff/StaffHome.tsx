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
  RefreshCw
} from 'lucide-react';
import { getStationBatteries, getStationBookings, Battery as BatteryType, StaffBooking } from '../../services/staff.service';

const StaffHome: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [batteries, setBatteries] = useState<BatteryType[]>([]);
  const [recentBookings, setRecentBookings] = useState<StaffBooking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<StaffBooking[]>([]);
  const [stationName, setStationName] = useState<string>('Trạm');

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load batteries
      const batteriesRes = await getStationBatteries();
      if (batteriesRes.success && batteriesRes.data) {
        setBatteries(batteriesRes.data);
        if (batteriesRes.data.length > 0 && batteriesRes.data[0].station) {
          setStationName(batteriesRes.data[0].station.name);
        }
      }

      // Load recent completed bookings (giao dịch gần đây)
      const completedBookingsRes = await getStationBookings({ 
        status: 'completed', 
        limit: 5 
      });
      if (completedBookingsRes.success && completedBookingsRes.data?.bookings) {
        setRecentBookings(completedBookingsRes.data.bookings);
      }

      // Load pending bookings (hàng đợi hiện tại)
      const pendingBookingsRes = await getStationBookings({ 
        status: 'pending', 
        limit: 10 
      });
      if (pendingBookingsRes.success && pendingBookingsRes.data?.bookings) {
        setPendingBookings(pendingBookingsRes.data.bookings);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-green-900 dark:from-white dark:to-green-100 bg-clip-text text-transparent">Tổng quan trạm</h1>
          <p className="text-slate-600 dark:text-slate-300">{stationName} - Bảng điều khiển vận hành thời gian thực</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="glass border-green-200/50 dark:border-emerald-400/30 hover:bg-green-50/50 dark:hover:bg-emerald-500/10"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới dữ liệu
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Battery className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Pin khả dụng</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{availableBatteries}/{totalBatteries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Hàng đợi hiện tại</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{currentQueue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Battery Status */}
      <Card className="glass-card border-0 glow">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Tổng quan trạng thái pin</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">Phân tích kho hiện tại</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {totalBatteries === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              Chưa có dữ liệu pin
            </p>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Khả dụng</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">{availableBatteries}</span>
                </div>
                <Progress value={(availableBatteries / totalBatteries) * 100} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Đang sạc</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{chargingBatteries}</span>
                </div>
                <Progress value={(chargingBatteries / totalBatteries) * 100} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bảo trì</span>
                  <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{maintenanceBatteries}</span>
                </div>
                <Progress value={(maintenanceBatteries / totalBatteries) * 100} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Hỏng</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">{damagedBatteries}</span>
                </div>
                <Progress value={(damagedBatteries / totalBatteries) * 100} className="h-2" />
              </div>

              <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Tỷ lệ sử dụng pin</span>
                  <span className="font-bold text-slate-900 dark:text-white">{batteryUtilization}%</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="glass-card border-0 glow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-900 dark:text-white">Giao dịch gần đây</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Các hoạt động thay pin mới nhất</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="glass border-green-200/50 dark:border-emerald-400/30 hover:bg-green-50/50 dark:hover:bg-emerald-500/10"
              onClick={() => window.location.href = '/staff/transactions'}
            >
              Xem tất cả
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              Chưa có giao dịch nào
            </p>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.booking_id} className="flex items-center justify-between p-4 glass rounded-lg glow-hover group">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {booking.user?.full_name || 'Khách hàng'}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {booking.vehicle?.license_plate || booking.vehicle?.model || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {formatTime(booking.scheduled_at)}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {calculateDuration(booking)}
                    </p>
                  </div>

                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status === 'completed' && <CheckCircle className="mr-1 h-3 w-3" />}
                    {booking.status === 'confirmed' && <Clock className="mr-1 h-3 w-3" />}
                    {getStatusText(booking.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffHome;
