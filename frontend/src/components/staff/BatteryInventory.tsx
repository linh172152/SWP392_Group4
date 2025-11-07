import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
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
  Trash2,
  Eye,
  Edit,
  MapPin,
  Calendar,
  Activity,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '../ui/pagination';
import {
  Battery as BatteryType,
  getStationBatteries,
  deleteBattery,
  updateBatteryStatus,
  UpdateBatteryData
} from '../../services/battery.service';
import { useToast } from '../../hooks/use-toast';
import AddBatteryDialog from './AddBatteryDialog';

type SortField = 'battery_code' | 'model' | 'status' | 'current_charge' | 'created_at' | 'health_percentage';
type SortOrder = 'asc' | 'desc';

const BatteryInventory: React.FC = () => {
  const [allBatteries, setAllBatteries] = useState<BatteryType[]>([]); // All batteries from API
  const [batteries, setBatteries] = useState<BatteryType[]>([]); // Filtered and paginated batteries
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  
  // Sorting states
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBattery, setSelectedBattery] = useState<BatteryType | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateBatteryData>({
    status: 'full',
    current_charge: 100,
    health_percentage: undefined,
  });
  
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
        setAllBatteries(response.data);
        applyFiltersAndSort(response.data);
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

  // Apply filters, search, sorting and pagination
  const applyFiltersAndSort = (batteriesToProcess: BatteryType[]) => {
    let processed = [...batteriesToProcess];
    
    // Apply search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      processed = processed.filter(b => 
        b.battery_code.toLowerCase().includes(searchLower) ||
        b.model.toLowerCase().includes(searchLower) ||
        b.station?.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    processed.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'battery_code':
          aValue = a.battery_code || '';
          bValue = b.battery_code || '';
          break;
        case 'model':
          aValue = a.model || '';
          bValue = b.model || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'current_charge':
          aValue = a.current_charge || 0;
          bValue = b.current_charge || 0;
          break;
        case 'health_percentage':
          aValue = a.health_percentage || 0;
          bValue = b.health_percentage || 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    
    // Apply pagination
    const totalPages = Math.ceil(processed.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = processed.slice(startIndex, endIndex);
    
    setBatteries(paginated);
    setTotalPages(totalPages);
    setTotalItems(processed.length);
  };

  useEffect(() => {
    fetchBatteries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, modelFilter]);

  useEffect(() => {
    applyFiltersAndSort(allBatteries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, sortField, sortOrder, currentPage, pageSize, allBatteries]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        applyFiltersAndSort(allBatteries);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Handle sort change
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  // Dialog handlers
  const handleViewDetail = (battery: BatteryType) => {
    setSelectedBattery(battery);
    setDetailDialogOpen(true);
  };

  const handleEdit = (battery: BatteryType) => {
    setSelectedBattery(battery);
    setEditFormData({
      status: battery.status,
      current_charge: battery.current_charge,
      health_percentage: battery.health_percentage || undefined,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (battery: BatteryType) => {
    setSelectedBattery(battery);
    setDeleteError(null); // Reset error khi mở dialog
    setDeleteConfirmed(false); // Reset checkbox
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBattery) return;

    try {
      setEditLoading(true);
      const response = await updateBatteryStatus(selectedBattery.battery_id, editFormData);

      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật thông tin pin',
        });
        fetchBatteries();
        setEditDialogOpen(false);
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể cập nhật pin',
        variant: 'destructive',
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBattery) return;

    try {
      setDeleteLoading(true);
      setDeleteError(null);
      const response = await deleteBattery(selectedBattery.battery_id);

      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã xóa pin thành công',
        });
        fetchBatteries();
        setDeleteDialogOpen(false);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Không thể xóa pin';
      setDeleteError(errorMessage);
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getDetailStatusColor = (status: string) => {
    switch (status) {
      case 'full': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'charging': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_use': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'damaged': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
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

  // Pagination states
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const totalBatteries = allBatteries.length;
  const fullBatteries = allBatteries.filter(b => b.status === 'full').length;
  const chargingBatteries = allBatteries.filter(b => b.status === 'charging').length;
  const maintenanceBatteries = allBatteries.filter(b => b.status === 'maintenance' || b.status === 'damaged').length;

  // Get unique models for filter (from all batteries, not just paginated ones)
  const uniqueModels = Array.from(new Set(allBatteries.map(b => b.model)));

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

      {/* Filters and Search */}
      <Card className="glass-card border-0 glow">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Tìm kiếm theo mã pin, model, trạm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass border-slate-200/50 dark:border-slate-700/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 glass border-slate-200/50 dark:border-slate-700/50">
                <Filter className="mr-2 h-4 w-4" />
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
            <Select value={String(pageSize)} onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full md:w-32 glass border-slate-200/50 dark:border-slate-700/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-0">
                <SelectItem value="12">12 / trang</SelectItem>
                <SelectItem value="24">24 / trang</SelectItem>
                <SelectItem value="48">48 / trang</SelectItem>
                <SelectItem value="100">100 / trang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sort Header */}
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleSort('battery_code')}
                className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Mã pin
                {getSortIcon('battery_code')}
              </button>
              <button
                onClick={() => handleSort('model')}
                className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Model
                {getSortIcon('model')}
              </button>
              <button
                onClick={() => handleSort('status')}
                className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Trạng thái
                {getSortIcon('status')}
              </button>
              <button
                onClick={() => handleSort('current_charge')}
                className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Mức sạc
                {getSortIcon('current_charge')}
              </button>
              <button
                onClick={() => handleSort('created_at')}
                className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Ngày thêm
                {getSortIcon('created_at')}
              </button>
            </div>
            <div className="text-xs">
              Hiển thị {batteries.length} / {totalItems} kết quả
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Battery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batteries.map((battery) => (
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

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 glass border-blue-300/50 hover:bg-blue-50 dark:border-blue-700/50 dark:hover:bg-blue-900/20"
                    onClick={() => handleViewDetail(battery)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Chi tiết
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 glass border-green-300/50 hover:bg-green-50 dark:border-green-700/50 dark:hover:bg-green-900/20"
                    onClick={() => handleEdit(battery)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Sửa
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="glass border-red-300/50 hover:bg-red-50 dark:border-red-700/50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                    onClick={() => handleDelete(battery)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {batteries.length === 0 && !loading && (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <Battery className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {searchTerm || statusFilter !== 'all' || modelFilter !== 'all'
                ? 'Không tìm thấy pin'
                : 'Chưa có pin nào'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {searchTerm || statusFilter !== 'all' || modelFilter !== 'all'
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                : 'Thêm pin mới để bắt đầu quản lý kho'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            <div className="text-center text-sm text-slate-600 dark:text-slate-400 mt-4">
              Trang {currentPage} / {totalPages} • Tổng {totalItems} pin
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Battery Dialog */}
      <AddBatteryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchBatteries}
      />

      {/* Battery Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Battery className="h-5 w-5 text-blue-600" />
              Chi tiết Pin
            </DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về pin {selectedBattery?.battery_code}
            </DialogDescription>
          </DialogHeader>

          {selectedBattery && (
            <div className="space-y-6 py-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Trạng thái</h3>
                <Badge className={getDetailStatusColor(selectedBattery.status)}>
                  {getStatusLabel(selectedBattery.status)}
                </Badge>
              </div>

              {/* Battery Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Battery className="h-4 w-4" />
                    <span>Mã Pin</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedBattery.battery_code}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Model</div>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedBattery.model}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Zap className="h-4 w-4" />
                    <span>Mức sạc</span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedBattery.current_charge}%
                  </p>
                </div>

                {selectedBattery.capacity_kwh && (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dung lượng</div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedBattery.capacity_kwh} kWh
                    </p>
                  </div>
                )}

                {selectedBattery.voltage && (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Điện áp</div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedBattery.voltage} V
                    </p>
                  </div>
                )}

                {selectedBattery.health_percentage && (
                  <div className="col-span-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <Activity className="h-4 w-4" />
                      <span>Tình trạng sức khỏe</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            selectedBattery.health_percentage >= 80
                              ? 'bg-green-500'
                              : selectedBattery.health_percentage >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${selectedBattery.health_percentage}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedBattery.health_percentage}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {selectedBattery.station && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-semibold">Trạm</span>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedBattery.station.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedBattery.station.address}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedBattery.last_charged_at && (
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>Sạc lần cuối</span>
                    </div>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(selectedBattery.last_charged_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Ngày thêm</span>
                  </div>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedBattery.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Battery Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Pin</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho pin {selectedBattery?.battery_code}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="battery_code" className="text-right">
                  Mã Pin
                </Label>
                <Input
                  id="battery_code"
                  value={selectedBattery?.battery_code || ''}
                  disabled
                  className="col-span-3 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="model" className="text-right">
                  Model
                </Label>
                <Input
                  id="model"
                  value={selectedBattery?.model || ''}
                  disabled
                  className="col-span-3 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Trạng thái <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value: any) => setEditFormData({ ...editFormData, status: value })}
                  disabled={editLoading}
                >
                  <SelectTrigger className="col-span-3 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600">
                    <SelectItem value="full">Đầy</SelectItem>
                    <SelectItem value="charging">Đang sạc</SelectItem>
                    <SelectItem value="in_use">Đang sử dụng</SelectItem>
                    <SelectItem value="maintenance">Bảo trì</SelectItem>
                    <SelectItem value="damaged">Hỏng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="current_charge" className="text-right">
                  Mức sạc (%) <span className="text-red-500">*</span>
                </Label>
                <div className="col-span-3">
                  <Input
                    id="current_charge"
                    type="number"
                    min={0}
                    max={100}
                    value={editFormData.current_charge}
                    onChange={(e) => setEditFormData({ ...editFormData, current_charge: Number(e.target.value) })}
                    disabled={editLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Giá trị từ 0 đến 100</p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="health_percentage" className="text-right">
                  Tình trạng (%)
                </Label>
                <div className="col-span-3">
                  <Input
                    id="health_percentage"
                    type="number"
                    min={0}
                    max={100}
                    value={editFormData.health_percentage || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, health_percentage: e.target.value ? Number(e.target.value) : undefined })}
                    disabled={editLoading}
                    placeholder="Không bắt buộc"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tình trạng sức khỏe pin (0-100%)</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={editLoading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={editLoading}>
                {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Battery Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Xác nhận Xóa Pin
            </DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Pin sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </DialogDescription>
          </DialogHeader>

          {selectedBattery && (
            <div className="space-y-4 py-4">
              {/* Error Message */}
              {deleteError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-900 dark:text-red-200">
                        Không thể xóa pin
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {deleteError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning Message */}
              {!deleteError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-900 dark:text-red-200">
                        Cảnh báo: Xóa pin
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Bạn sắp xóa pin này khỏi hệ thống. Hành động này không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mã Pin</p>
                  <p className="font-semibold text-lg text-gray-900 dark:text-white">
                    {selectedBattery.battery_code}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Model</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedBattery.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Trạng thái</p>
                    <Badge 
                      variant="outline" 
                      className={
                        selectedBattery.status === 'damaged' 
                          ? 'border-red-500 text-red-700' 
                          : 'border-gray-300 text-gray-700'
                      }
                    >
                      {getStatusLabel(selectedBattery.status)}
                    </Badge>
                  </div>
                </div>

                {selectedBattery.station && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Trạm</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedBattery.station.name}</p>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  💡 <strong>Lưu ý:</strong> Chỉ nên xóa pin khi đã hỏng không sửa được hoặc không còn sử dụng.
                </p>
              </div>

              {/* Checkbox xác nhận xóa */}
              {!deleteError && (
                <div className="flex items-start space-x-3 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-slate-300 dark:border-slate-600">
                  <input
                    type="checkbox"
                    id="delete-confirm"
                    checked={deleteConfirmed}
                    onChange={(e) => setDeleteConfirmed(e.target.checked)}
                    disabled={deleteLoading}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <label 
                    htmlFor="delete-confirm" 
                    className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer select-none"
                  >
                    Tôi xác nhận muốn xóa vĩnh viễn pin <strong className="text-red-600 dark:text-red-400">{selectedBattery?.battery_code}</strong> khỏi hệ thống
                  </label>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {deleteError ? (
              // Nếu có lỗi, chỉ hiện nút Đóng
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setDeleteError(null);
                  setDeleteConfirmed(false);
                }}
                className="w-full sm:w-auto"
              >
                Đóng
              </Button>
            ) : (
              // Nếu không có lỗi, hiện nút Hủy + Xóa Pin
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setDeleteConfirmed(false);
                  }}
                  disabled={deleteLoading}
                  className="w-full sm:w-auto"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={!deleteConfirmed || deleteLoading}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa Pin
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatteryInventory;