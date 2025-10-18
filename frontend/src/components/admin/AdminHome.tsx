import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Building, 
  Users, 
  Zap, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Battery,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  RefreshCw,
  BarChart3
} from 'lucide-react';

// Dữ liệu KPI mẫu
const kpiData = {
  totalStations: 47,
  activeStations: 45,
  totalUsers: 12450,
  dailySwaps: 2847,
  dailyRevenue: 125450.75,
  systemUptime: 99.2,
  avgSwapTime: 2.8,
  customerSatisfaction: 4.6
};

const recentAlerts = [
  {
    id: 'ALT-001',
    type: 'warning',
    station: 'Trung tâm Thành phố',
    message: 'Kho pin thấp (12%)',
    time: '15 phút trước',
    priority: 'high'
  },
  {
    id: 'ALT-002',
    type: 'error',
    station: 'Nhà ga Sân bay',
    message: 'Cánh tay robot hỏng ở khu vực 3',
    time: '1 giờ trước',
    priority: 'critical'
  },
  {
    id: 'ALT-003',
    type: 'info',
    station: 'Trung tâm Thương mại',
    message: 'Hoàn thành bảo trì định kỳ',
    time: '2 giờ trước',
    priority: 'low'
  }
];

const topStations = [
  { name: 'Trung tâm Thành phố', swaps: 342, revenue: 12450.50, utilization: 89 },
  { name: 'Trung tâm Thương mại', swaps: 298, revenue: 10780.25, utilization: 76 },
  { name: 'Trạm Nghỉ Cao tốc', swaps: 267, revenue: 9834.75, utilization: 68 },
  { name: 'Nhà ga Sân bay', swaps: 234, revenue: 8901.00, utilization: 62 }
];

const AdminHome: React.FC = () => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      default: return <AlertTriangle className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-50/80 dark:bg-red-500/10 text-red-800 dark:text-red-400 border-red-200/50 dark:border-red-500/20';
      case 'high': return 'bg-yellow-50/80 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-500/20';
      case 'medium': return 'bg-blue-50/80 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20';
      case 'low': return 'bg-slate-50/80 dark:bg-slate-500/10 text-slate-800 dark:text-slate-400 border-slate-200/50 dark:border-slate-500/20';
      default: return 'bg-slate-50/80 dark:bg-slate-500/10 text-slate-800 dark:text-slate-400 border-slate-200/50 dark:border-slate-500/20';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Nghiêm trọng';
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return priority;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-purple-900 dark:from-white dark:to-purple-100 bg-clip-text text-transparent">Bảng điều khiển Quản trị</h1>
          <p className="text-slate-600 dark:text-slate-300">Tổng quan hoạt động và hiệu suất toàn mạng lưới</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="glass border-purple-200/50 dark:border-purple-400/30 hover:bg-purple-50/50 dark:hover:bg-purple-500/10">
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới Dữ liệu
          </Button>
          <Button className="bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <BarChart3 className="mr-2 h-4 w-4" />
            Xem Báo cáo
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Trạm Hoạt động</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpiData.activeStations}/{kpiData.totalStations}</p>
                <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +2 tháng này
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Tổng Người dùng</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpiData.totalUsers.toLocaleString()}</p>
                <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +8.2% tăng trưởng
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Lần Thay Hôm nay</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpiData.dailySwaps.toLocaleString()}</p>
                <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +12% so với hôm qua
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Doanh thu Hôm nay</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">${kpiData.dailyRevenue.toLocaleString()}</p>
                <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +15% so với hôm qua
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card className="glass-card border-0 glow">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Sức khỏe Hệ thống</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Chỉ số hiệu suất toàn mạng lưới</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Thời gian Hoạt động</span>
                <span className="font-medium text-green-600 dark:text-green-400">{kpiData.systemUptime}%</span>
              </div>
              <Progress value={kpiData.systemUptime} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Thời gian Thay trung bình</span>
                <span className="font-medium text-slate-900 dark:text-white">{kpiData.avgSwapTime} phút</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Hài lòng Khách hàng</span>
                <span className="font-medium text-green-600 dark:text-green-400">{kpiData.customerSatisfaction}/5.0</span>
              </div>
              <Progress value={(kpiData.customerSatisfaction / 5) * 100} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">{kpiData.activeStations}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Trực tuyến</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">2</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Bảo trì</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600 dark:text-red-400">0</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Ngoại tuyến</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="glass-card border-0 glow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-900 dark:text-white">Cảnh báo Gần đây</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">Thông báo và vấn đề hệ thống</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="glass border-purple-200/50 dark:border-purple-400/30">
                Xem Tất cả
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 glass rounded-lg">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{alert.station}</p>
                      <Badge className={getAlertColor(alert.priority)} variant="outline">
                        {getPriorityLabel(alert.priority)}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{alert.message}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Stations */}
      <Card className="glass-card border-0 glow">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Trạm Hiệu suất Cao nhất</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">Doanh thu và tỷ lệ sử dụng cao nhất hôm nay</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topStations.map((station, index) => (
              <div key={index} className="flex items-center justify-between p-4 glass rounded-lg hover:shadow-lg transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{station.name}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{station.swaps} lần thay hôm nay</p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-bold text-slate-900 dark:text-white">${station.revenue.toLocaleString()}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Doanh thu</div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{station.utilization}%</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Sử dụng</div>
                  <Progress value={station.utilization} className="w-16 h-1 mt-1" />
                </div>

                <Button variant="outline" size="sm" className="glass border-purple-200/50 dark:border-purple-400/30">
                  <Activity className="mr-1 h-3 w-3" />
                  Chi tiết
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Network Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Battery className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Sức khỏe Pin</h3>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">94.2%</div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Trung bình mạng lưới</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Thời gian Chờ</h3>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">4.2 phút</div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Trung bình toàn mạng</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Tỷ lệ Tăng trưởng</h3>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">+18.5%</div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Tháng qua tháng</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminHome;