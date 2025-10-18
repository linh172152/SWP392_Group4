import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Battery, 
  Plus, 
  Search, 
  Filter,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

// Dữ liệu pin mẫu
const mockBatteries = [
  {
    id: 'STD-001',
    type: 'Tiêu chuẩn',
    capacity: 75,
    currentCharge: 100,
    status: 'available',
    health: 95,
    cycles: 847,
    lastMaintenance: '2024-01-10',
    location: 'Khu vực A1'
  },
  {
    id: 'STD-002',
    type: 'Tiêu chuẩn',
    capacity: 75,
    currentCharge: 85,
    status: 'charging',
    health: 92,
    cycles: 1205,
    lastMaintenance: '2024-01-08',
    location: 'Khu vực A2'
  },
  {
    id: 'LR-001',
    type: 'Tầm xa',
    capacity: 100,
    currentCharge: 100,
    status: 'available',
    health: 98,
    cycles: 234,
    lastMaintenance: '2024-01-12',
    location: 'Khu vực B1'
  },
  {
    id: 'STD-003',
    type: 'Tiêu chuẩn',
    capacity: 75,
    currentCharge: 45,
    status: 'charging',
    health: 89,
    cycles: 1687,
    lastMaintenance: '2024-01-05',
    location: 'Khu vực A3'
  },
  {
    id: 'LR-002',
    type: 'Tầm xa',
    capacity: 100,
    currentCharge: 0,
    status: 'maintenance',
    health: 76,
    cycles: 2234,
    lastMaintenance: '2024-01-15',
    location: 'Khu vực B2'
  },
  {
    id: 'STD-004',
    type: 'Tiêu chuẩn',
    capacity: 75,
    currentCharge: 20,
    status: 'damaged',
    health: 45,
    cycles: 3421,
    lastMaintenance: '2023-12-20',
    location: 'Khu vực A4'
  }
];

const BatteryInventory: React.FC = () => {
  const [batteries, setBatteries] = useState(mockBatteries);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'charging': return <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'maintenance': return <Wrench className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case 'damaged': return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default: return <Battery className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-50/80 dark:bg-green-500/10 text-green-800 dark:text-green-400 border-green-200/50 dark:border-green-500/20';
      case 'charging': return 'bg-blue-50/80 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20';
      case 'maintenance': return 'bg-yellow-50/80 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-500/20';
      case 'damaged': return 'bg-red-50/80 dark:bg-red-500/10 text-red-800 dark:text-red-400 border-red-200/50 dark:border-red-500/20';
      default: return 'bg-slate-50/80 dark:bg-slate-500/10 text-slate-800 dark:text-slate-400 border-slate-200/50 dark:border-slate-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Khả dụng';
      case 'charging': return 'Đang sạc';
      case 'maintenance': return 'Bảo trì';
      case 'damaged': return 'Hỏng';
      default: return status;
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-600 dark:text-green-400';
    if (health >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const filteredBatteries = batteries.filter(battery => {
    const matchesSearch = battery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          battery.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || battery.status === statusFilter;
    const matchesType = typeFilter === 'all' || battery.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalBatteries = batteries.length;
  const availableBatteries = batteries.filter(b => b.status === 'available').length;
  const chargingBatteries = batteries.filter(b => b.status === 'charging').length;
  const maintenanceBatteries = batteries.filter(b => b.status === 'maintenance').length;
  const avgHealth = batteries.reduce((sum, b) => sum + b.health, 0) / batteries.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-green-900 dark:from-white dark:to-green-100 bg-clip-text text-transparent">Kho Pin</h1>
          <p className="text-slate-600 dark:text-slate-300">Quản lý và theo dõi tình trạng kho pin</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="glass border-green-200/50 dark:border-emerald-400/30 hover:bg-green-50/50 dark:hover:bg-emerald-500/10">
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
          <Button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="mr-2 h-4 w-4" />
            Thêm pin
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Battery className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Tổng pin</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalBatteries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Khả dụng</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{availableBatteries}</p>
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
                <p className="text-sm text-slate-600 dark:text-slate-400">Đang sạc</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{chargingBatteries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Bảo trì</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{maintenanceBatteries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Sức khỏe TB</p>
                <p className={`text-2xl font-bold ${getHealthColor(avgHealth)}`}>{avgHealth.toFixed(1)}%</p>
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
                placeholder="Tìm kiếm theo ID pin hoặc vị trí..."
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
                <SelectItem value="available">Khả dụng</SelectItem>
                <SelectItem value="charging">Đang sạc</SelectItem>
                <SelectItem value="maintenance">Bảo trì</SelectItem>
                <SelectItem value="damaged">Hỏng</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48 glass border-slate-200/50 dark:border-slate-700/50">
                <SelectValue placeholder="Loại pin" />
              </SelectTrigger>
              <SelectContent className="glass-card border-0">
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="Tiêu chuẩn">Tiêu chuẩn</SelectItem>
                <SelectItem value="Tầm xa">Tầm xa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Battery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatteries.map((battery) => (
          <Card key={battery.id} className="glass-card border-0 glow-hover group">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{battery.id}</h3>
                  <Badge className={getStatusColor(battery.status)}>
                    {getStatusIcon(battery.status)}
                    <span className="ml-1">{getStatusLabel(battery.status)}</span>
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Loại pin</span>
                    <span className="font-medium text-slate-900 dark:text-white">{battery.type}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Mức sạc hiện tại</span>
                      <span className="font-medium text-slate-900 dark:text-white">{battery.currentCharge}%</span>
                    </div>
                    <Progress value={battery.currentCharge} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Sức khỏe pin</span>
                      <span className={`font-medium ${getHealthColor(battery.health)}`}>{battery.health}%</span>
                    </div>
                    <Progress value={battery.health} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Dung lượng</p>
                      <p className="font-medium text-slate-900 dark:text-white">{battery.capacity} kWh</p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Chu kỳ</p>
                      <p className="font-medium text-slate-900 dark:text-white">{battery.cycles}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Vị trí</p>
                      <p className="font-medium text-slate-900 dark:text-white">{battery.location}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Bảo trì cuối</p>
                      <p className="font-medium text-slate-900 dark:text-white">{battery.lastMaintenance}</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 glass border-green-200/50 dark:border-emerald-400/30">
                    Chi tiết
                  </Button>
                  <Button variant="outline" size="sm" className="glass border-blue-200/50 dark:border-blue-400/30">
                    <Wrench className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBatteries.length === 0 && (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <Battery className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Không tìm thấy pin</h3>
            <p className="text-slate-600 dark:text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BatteryInventory;