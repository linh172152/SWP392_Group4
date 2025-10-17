import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { 
  Building, 
  Plus, 
  Search, 
  MapPin,
  Activity,
  Battery,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Edit,
  Trash2
} from 'lucide-react';

// Dữ liệu trạm mẫu
const mockStations = [
  {
    id: 'ST001',
    name: 'Trung tâm EV Thành phố',
    address: '123 Đường Chính, Quận 1, TP.HCM',
    coordinates: { lat: 10.762622, lng: 106.660172 },
    status: 'online',
    capacity: 12,
    available: 8,
    charging: 3,
    maintenance: 1,
    dailySwaps: 47,
    dailyRevenue: 1247.50,
    uptime: 99.2,
    manager: 'Nguyễn Văn Quản lý',
    phone: '+84 901 234 567',
    operatingHours: '24/7'
  },
  {
    id: 'ST002',
    name: 'Trạm Trung tâm Thương mại',
    address: '456 Đại lộ Mua sắm, Quận 3, TP.HCM',
    coordinates: { lat: 10.786785, lng: 106.700471 },
    status: 'online',
    capacity: 20,
    available: 15,
    charging: 4,
    maintenance: 1,
    dailySwaps: 68,
    dailyRevenue: 1876.25,
    uptime: 97.8,
    manager: 'Trần Thị Quản lý',
    phone: '+84 902 345 678',
    operatingHours: '6 AM - 11 PM'
  },
  {
    id: 'ST003',
    name: 'Trạm Nghỉ Cao tốc A1',
    address: 'Cao tốc A1 hướng Bắc Km 42',
    coordinates: { lat: 10.950000, lng: 106.800000 },
    status: 'maintenance',
    capacity: 16,
    available: 6,
    charging: 8,
    maintenance: 2,
    dailySwaps: 34,
    dailyRevenue: 892.75,
    uptime: 89.5,
    manager: 'Lê Hoàng Quản lý',
    phone: '+84 903 456 789',
    operatingHours: '24/7'
  },
  {
    id: 'ST004',
    name: 'Nhà ga Sân bay Tân Sơn Nhất',
    address: 'Sân bay Tân Sơn Nhất, Quận Tân Bình, TP.HCM',
    coordinates: { lat: 10.815509, lng: 106.658611 },
    status: 'offline',
    capacity: 24,
    available: 0,
    charging: 0,
    maintenance: 0,
    dailySwaps: 0,
    dailyRevenue: 0,
    uptime: 0,
    manager: 'Phạm Minh Quản lý',
    phone: '+84 904 567 890',
    operatingHours: '24/7'
  }
];

const StationManagement: React.FC = () => {
  const [stations, setStations] = useState(mockStations);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'offline': return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'maintenance': return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      default: return <Building className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-50/80 dark:bg-green-500/10 text-green-800 dark:text-green-400 border-green-200/50 dark:border-green-500/20';
      case 'offline': return 'bg-red-50/80 dark:bg-red-500/10 text-red-800 dark:text-red-400 border-red-200/50 dark:border-red-500/20';
      case 'maintenance': return 'bg-yellow-50/80 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-500/20';
      default: return 'bg-slate-50/80 dark:bg-slate-500/10 text-slate-800 dark:text-slate-400 border-slate-200/50 dark:border-slate-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'Trực tuyến';
      case 'offline': return 'Ngoại tuyến';
      case 'maintenance': return 'Bảo trì';
      default: return status;
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-red-600 dark:text-red-400';
    if (utilization >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const filteredStations = stations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          station.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          station.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || station.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalStations = stations.length;
  const onlineStations = stations.filter(s => s.status === 'online').length;
  const totalRevenue = stations.reduce((sum, s) => sum + s.dailyRevenue, 0);
  const totalSwaps = stations.reduce((sum, s) => sum + s.dailySwaps, 0);
  const avgUptime = stations.reduce((sum, s) => sum + s.uptime, 0) / stations.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-purple-900 dark:from-white dark:to-purple-100 bg-clip-text text-transparent">Quản lý Trạm</h1>
          <p className="text-slate-600 dark:text-slate-300">Giám sát và quản lý mạng lưới trạm thay pin</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <Plus className="mr-2 h-4 w-4" />
          Thêm Trạm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Tổng trạm</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalStations}</p>
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
                <p className="text-sm text-slate-600 dark:text-slate-400">Trực tuyến</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{onlineStations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Lần thay hôm nay</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalSwaps}</p>
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
                <p className="text-sm text-slate-600 dark:text-slate-400">Doanh thu hôm nay</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Uptime TB</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{avgUptime.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-0 glow">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Tìm kiếm theo tên trạm, địa chỉ hoặc ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass border-slate-200/50 dark:border-slate-700/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 glass border-slate-200/50 dark:border-slate-700/50">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="glass-card border-0">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="online">Trực tuyến</SelectItem>
                <SelectItem value="offline">Ngoại tuyến</SelectItem>
                <SelectItem value="maintenance">Bảo trì</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Station List */}
      <div className="space-y-4">
        {filteredStations.map((station) => {
          const utilization = Math.round(((station.capacity - station.available) / station.capacity) * 100);
          
          return (
            <Card key={station.id} className="glass-card border-0 glow-hover">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Station Info */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{station.name}</h3>
                          <Badge className={getStatusColor(station.status)}>
                            {getStatusIcon(station.status)}
                            <span className="ml-1">{getStatusLabel(station.status)}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {station.address}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">ID: {station.id}</p>
                      </div>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Quản lý:</span>
                        <span className="text-slate-900 dark:text-white">{station.manager}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Điện thoại:</span>
                        <span className="text-slate-900 dark:text-white">{station.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Giờ hoạt động:</span>
                        <span className="text-slate-900 dark:text-white">{station.operatingHours}</span>
                      </div>
                    </div>
                  </div>

                  {/* Battery Status */}
                  <div className="lg:col-span-3 space-y-3">
                    <h4 className="font-medium text-slate-900 dark:text-white">Trạng thái Pin</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Khả dụng</span>
                        <span className="font-medium text-green-600 dark:text-green-400">{station.available}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Đang sạc</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">{station.charging}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Bảo trì</span>
                        <span className="font-medium text-yellow-600 dark:text-yellow-400">{station.maintenance}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600 dark:text-slate-400">Sử dụng</span>
                          <span className={`font-medium ${getUtilizationColor(utilization)}`}>{utilization}%</span>
                        </div>
                        <Progress value={utilization} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="lg:col-span-3 space-y-3">
                    <h4 className="font-medium text-slate-900 dark:text-white">Hiệu suất Hôm nay</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Lần thay:</span>
                        <span className="font-medium text-slate-900 dark:text-white">{station.dailySwaps}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Doanh thu:</span>
                        <span className="font-medium text-slate-900 dark:text-white">${station.dailyRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Uptime:</span>
                        <span className={`font-medium ${station.uptime >= 95 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                          {station.uptime.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-2 flex flex-col justify-center space-y-2">
                    <Button variant="outline" size="sm" className="glass border-purple-200/50 dark:border-purple-400/30">
                      <Activity className="mr-1 h-3 w-3" />
                      Chi tiết
                    </Button>
                    <Button variant="outline" size="sm" className="glass border-blue-200/50 dark:border-blue-400/30">
                      <Edit className="mr-1 h-3 w-3" />
                      Chỉnh sửa
                    </Button>
                    <Button variant="outline" size="sm" className="glass border-slate-200/50 dark:border-slate-700/50">
                      <Settings className="mr-1 h-3 w-3" />
                      Cài đặt
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredStations.length === 0 && (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <Building className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Không tìm thấy trạm</h3>
            <p className="text-slate-600 dark:text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StationManagement;