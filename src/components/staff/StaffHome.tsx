import React from 'react';
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
  Calendar,
  RefreshCw
} from 'lucide-react';

// Dữ liệu mẫu cho tổng quan nhân viên
const stationStats = {
  totalBatteries: 32,
  availableBatteries: 18,
  chargingBatteries: 8,
  maintenanceBatteries: 3,
  damagedBatteries: 1,
  swapsToday: 47,
  avgSwapTime: '2.8 phút',
  uptime: 98.5,
  currentQueue: 3
};

const recentTransactions = [
  {
    id: 'TXN-001',
    customerName: 'Nguyễn Văn Minh',
    vehicle: 'Tesla Model 3',
    batteryOut: 'STD-001',
    batteryIn: 'STD-045',
    startTime: '14:30',
    duration: '2.5 phút',
    status: 'completed'
  },
  {
    id: 'TXN-002',
    customerName: 'Trần Thị Lan',
    vehicle: 'BYD Tang EV',
    batteryOut: 'LR-003',
    batteryIn: 'LR-012',
    startTime: '14:25',
    duration: '3.1 phút',
    status: 'completed'
  },
  {
    id: 'TXN-003',
    customerName: 'Lê Hoàng Nam',
    vehicle: 'Tesla Model Y',
    batteryOut: null,
    batteryIn: 'STD-023',
    startTime: '14:20',
    duration: '1.8 phút',
    status: 'in-progress'
  }
];

const maintenanceAlerts = [
  {
    id: 'ALT-001',
    type: 'warning',
    message: 'Cánh tay robot khu vực 3 cần hiệu chỉnh',
    time: '30 phút trước',
    priority: 'medium'
  },
  {
    id: 'ALT-002',
    type: 'info',
    message: 'Bảo trì định kỳ hệ thống làm mát lúc 6 giờ chiều',
    time: '2 giờ trước',
    priority: 'low'
  }
];

const StaffHome: React.FC = () => {
  const batteryUtilization = Math.round(((stationStats.totalBatteries - stationStats.availableBatteries) / stationStats.totalBatteries) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'glass border-0 bg-green-500/20 text-green-700 dark:text-green-400';
      case 'in-progress': return 'glass border-0 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
      case 'failed': return 'glass border-0 bg-red-500/20 text-red-700 dark:text-red-400';
      default: return 'glass border-0 bg-slate-500/20 text-slate-700 dark:text-slate-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'in-progress': return 'Đang thực hiện';
      case 'failed': return 'Thất bại';
      default: return status;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-green-900 dark:from-white dark:to-green-100 bg-clip-text text-transparent">Tổng quan trạm</h1>
          <p className="text-slate-600 dark:text-slate-300">Trung tâm EV Trung tâm - Bảng điều khiển vận hành thời gian thực</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="glass border-green-200/50 dark:border-emerald-400/30 hover:bg-green-50/50 dark:hover:bg-emerald-500/10">
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới dữ liệu
          </Button>
          <Button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <Activity className="mr-2 h-4 w-4" />
            Trạng thái hệ thống
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Battery className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Pin khả dụng</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stationStats.availableBatteries}/{stationStats.totalBatteries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Lần thay hôm nay</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stationStats.swapsToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Thời gian thay TB</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stationStats.avgSwapTime}</p>
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stationStats.currentQueue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Battery Status and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Battery Status */}
        <Card className="glass-card border-0 glow">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Tổng quan trạng thái pin</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Phân tích kho hiện tại</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Khả dụng</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">{stationStats.availableBatteries}</span>
              </div>
              <Progress value={(stationStats.availableBatteries / stationStats.totalBatteries) * 100} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Đang sạc</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{stationStats.chargingBatteries}</span>
              </div>
              <Progress value={(stationStats.chargingBatteries / stationStats.totalBatteries) * 100} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bảo trì</span>
                <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{stationStats.maintenanceBatteries}</span>
              </div>
              <Progress value={(stationStats.maintenanceBatteries / stationStats.totalBatteries) * 100} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Hỏng</span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">{stationStats.damagedBatteries}</span>
              </div>
              <Progress value={(stationStats.damagedBatteries / stationStats.totalBatteries) * 100} className="h-2" />
            </div>

            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">Tỷ lệ sử dụng pin</span>
                <span className="font-bold text-slate-900 dark:text-white">{batteryUtilization}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className="glass-card border-0 glow">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Cảnh báo hệ thống</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Thông báo gần đây và mục bảo trì</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {maintenanceAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 glass rounded-lg">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{alert.message}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{alert.time}</p>
                  </div>
                  <Badge variant="outline" className="text-xs glass border-slate-200/50 dark:border-slate-700/50">
                    {alert.priority === 'medium' ? 'Trung bình' : alert.priority === 'low' ? 'Thấp' : 'Cao'}
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Thời gian hoạt động hệ thống</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">30 ngày qua</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{stationStats.uptime}%</p>
                  <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +0.2%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="glass-card border-0 glow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-900 dark:text-white">Giao dịch gần đây</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Các hoạt động thay pin mới nhất</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="glass border-green-200/50 dark:border-emerald-400/30 hover:bg-green-50/50 dark:hover:bg-emerald-500/10">
              Xem tất cả
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 glass rounded-lg glow-hover group">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{transaction.customerName}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{transaction.vehicle}</p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Trao đổi pin</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {transaction.batteryOut || 'Mới'} → {transaction.batteryIn}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{transaction.startTime}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{transaction.duration}</p>
                </div>

                <Badge className={getStatusColor(transaction.status)}>
                  {transaction.status === 'completed' && <CheckCircle className="mr-1 h-3 w-3" />}
                  {transaction.status === 'in-progress' && <Clock className="mr-1 h-3 w-3" />}
                  {getStatusText(transaction.status)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="glass-card border-0 glow">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Thao tác nhanh</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">Các hoạt động trạm thường sử dụng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col glass border-green-200/50 dark:border-emerald-400/30 hover:bg-green-50/50 dark:hover:bg-emerald-500/10 hover:scale-105 transition-all duration-300">
              <Battery className="h-6 w-6 mb-2" />
              <span className="text-sm">Kiểm tra pin</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col glass border-blue-200/50 dark:border-blue-400/30 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 hover:scale-105 transition-all duration-300">
              <RefreshCw className="h-6 w-6 mb-2" />
              <span className="text-sm">Khởi động lại</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col glass border-purple-200/50 dark:border-purple-400/30 hover:bg-purple-50/50 dark:hover:bg-purple-500/10 hover:scale-105 transition-all duration-300">
              <Users className="h-6 w-6 mb-2" />
              <span className="text-sm">Lịch nhân viên</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col glass border-orange-200/50 dark:border-orange-400/30 hover:bg-orange-50/50 dark:hover:bg-orange-500/10 hover:scale-105 transition-all duration-300">
              <Calendar className="h-6 w-6 mb-2" />
              <span className="text-sm">Bảo trì</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffHome;