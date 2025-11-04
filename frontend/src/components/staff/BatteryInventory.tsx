import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Loader2,
  Trash2
} from 'lucide-react';
import {
  Battery as BatteryType,
  getStationBatteries,
  deleteBattery,
  updateBatteryStatus
} from '../../services/battery.service';
import { useToast } from '../../hooks/use-toast';
import AddBatteryDialog from './AddBatteryDialog';

const BatteryInventory: React.FC = () => {
  const [batteries, setBatteries] = useState<BatteryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch batteries
  const fetchBatteries = async () => {
    try {
      setRefreshing(true);
      const response = await getStationBatteries({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        model: modelFilter !== 'all' ? modelFilter : undefined,
      });
      
      if (response.success && response.data) {
        setBatteries(response.data);
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải danh sách pin',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBatteries();
  }, [statusFilter, modelFilter]);

  // Handle delete battery
  const handleDeleteBattery = async (battery: BatteryType) => {
    if (!confirm(`Xác nhận xóa pin ${battery.battery_code}?`)) return;

    try {
      setActionLoading(battery.battery_id);
      const response = await deleteBattery(battery.battery_id);
      
      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã xóa pin',
        });
        fetchBatteries();
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể xóa pin',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'full': return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'charging': return <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'in_use': return <Battery className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case 'maintenance': return <Wrench className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case 'damaged': return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default: return <Battery className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full': return 'bg-green-50/80 dark:bg-green-500/10 text-green-800 dark:text-green-400 border-green-200/50 dark:border-green-500/20';
      case 'charging': return 'bg-blue-50/80 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20';
      case 'in_use': return 'bg-purple-50/80 dark:bg-purple-500/10 text-purple-800 dark:text-purple-400 border-purple-200/50 dark:border-purple-500/20';
      case 'maintenance': return 'bg-yellow-50/80 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-500/20';
      case 'damaged': return 'bg-red-50/80 dark:bg-red-500/10 text-red-800 dark:text-red-400 border-red-200/50 dark:border-red-500/20';
      default: return 'bg-slate-50/80 dark:bg-slate-500/10 text-slate-800 dark:text-slate-400 border-slate-200/50 dark:border-slate-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'full': return 'Đầy';
      case 'charging': return 'Đang sạc';
      case 'in_use': return 'Đang dùng';
      case 'maintenance': return 'Bảo trì';
      case 'damaged': return 'Hỏng';
      default: return status;
    }
  };

  const getChargeColor = (charge: number) => {
    if (charge >= 80) return 'text-green-600 dark:text-green-400';
    if (charge >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const filteredBatteries = batteries.filter(battery => {
    const matchesSearch = battery.battery_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          battery.model.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalBatteries = batteries.length;
  const fullBatteries = batteries.filter(b => b.status === 'full').length;
  const chargingBatteries = batteries.filter(b => b.status === 'charging').length;
  const maintenanceBatteries = batteries.filter(b => b.status === 'maintenance' || b.status === 'damaged').length;

  // Get unique models for filter
  const uniqueModels = Array.from(new Set(batteries.map(b => b.model)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-green-900 dark:from-white dark:to-green-100 bg-clip-text text-transparent">Kho Pin</h1>
          <p className="text-slate-600 dark:text-slate-300">Quản lý và theo dõi tình trạng kho pin</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="glass border-green-200/50 dark:border-emerald-400/30 hover:bg-green-50/50 dark:hover:bg-emerald-500/10"
            onClick={fetchBatteries}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Làm mới
          </Button>
          <Button 
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm pin
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm text-slate-600 dark:text-slate-400">Đầy</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{fullBatteries}</p>
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
                <SelectItem value="full">Đầy</SelectItem>
                <SelectItem value="charging">Đang sạc</SelectItem>
                <SelectItem value="in_use">Đang dùng</SelectItem>
                <SelectItem value="maintenance">Bảo trì</SelectItem>
                <SelectItem value="damaged">Hỏng</SelectItem>
              </SelectContent>
            </Select>
            <Select value={modelFilter} onValueChange={setModelFilter}>
              <SelectTrigger className="w-full md:w-48 glass border-slate-200/50 dark:border-slate-700/50">
                <SelectValue placeholder="Model pin" />
              </SelectTrigger>
              <SelectContent className="glass-card border-0">
                <SelectItem value="all">Tất cả model</SelectItem>
                {uniqueModels.map(model => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Battery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatteries.map((battery) => (
          <Card key={battery.battery_id} className="glass-card border-0 glow-hover group">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{battery.battery_code}</h3>
                  <Badge className={getStatusColor(battery.status)}>
                    {getStatusIcon(battery.status)}
                    <span className="ml-1">{getStatusLabel(battery.status)}</span>
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Model</span>
                    <span className="font-medium text-slate-900 dark:text-white">{battery.model}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Mức sạc hiện tại</span>
                      <span className={`font-medium ${getChargeColor(battery.current_charge)}`}>{battery.current_charge}%</span>
                    </div>
                    <Progress value={battery.current_charge} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {battery.capacity_kwh && (
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Dung lượng</p>
                        <p className="font-medium text-slate-900 dark:text-white">{battery.capacity_kwh} kWh</p>
                      </div>
                    )}
                    {battery.voltage && (
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Điện áp</p>
                        <p className="font-medium text-slate-900 dark:text-white">{battery.voltage}V</p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Trạm</p>
                      <p className="font-medium text-slate-900 dark:text-white">{battery.station?.name || 'N/A'}</p>
                    </div>
                    {battery.last_charged_at && (
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Sạc lần cuối</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {new Date(battery.last_charged_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 glass border-green-200/50 dark:border-emerald-400/30"
                    onClick={() => alert(`Chi tiết pin: ${battery.battery_code}`)}
                  >
                    Chi tiết
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="glass border-yellow-200/50 dark:border-yellow-400/30"
                    onClick={() => alert(`Cập nhật trạng thái: ${battery.battery_code}`)}
                  >
                    <Wrench className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="glass border-red-200/50 dark:border-red-400/30 text-red-600"
                    onClick={() => handleDeleteBattery(battery)}
                    disabled={actionLoading === battery.battery_id}
                  >
                    {actionLoading === battery.battery_id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
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

      {/* Add Battery Dialog */}
      <AddBatteryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchBatteries}
      />
    </div>
  );
};

export default BatteryInventory;