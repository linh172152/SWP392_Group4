import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Dialog, DialogContent } from '../ui/dialog';
import StationForm from './StationForm';
import StationDetails from './StationDetails';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import { 
  Building, 
  Plus, 
  Search, 
  MapPin,
  Activity,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2
} from 'lucide-react';
import type { Station } from '../../services/station.service';
import { 
  getAllStations, 
  deleteStation, 
  createStation, 
  updateStation 
} from '../../services/station.service';
import { updateStaff } from '../../services/staff.service';

const StationManagement: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);

  // Mock data for development
  const mockStations: Station[] = [
    {
      id: 'ST001',
      station_id: 'ST001',
      name: 'Trạm Thành phố',
      address: '123 Đường Chính, Quận 1, TP.HCM',
      coordinates: { lat: 10.762622, lng: 106.660172 },
      status: 'active',
      capacity: 12,
      available_batteries: 8,
      charging_batteries: 3,
      maintenance_batteries: 1,
      daily_swaps: 47,
      daily_revenue: 1247.50,
      uptime: 99.2,
      operating_hours: '24/7',
      manager: {
        user_id: 'USER001',
        full_name: 'Nguyễn Văn Quản lý',
        phone: '+84 901 234 567'
      }
    },
    {
      id: 'ST002',
      station_id: 'ST002',
      name: 'Trạm Trung tâm Thương mại',
      address: '456 Đại lộ Mua sắm, Quận 3, TP.HCM',
      coordinates: { lat: 10.786785, lng: 106.700471 },
      status: 'active',
      capacity: 20,
      available_batteries: 15,
      charging_batteries: 4,
      maintenance_batteries: 1,
      daily_swaps: 68,
      daily_revenue: 1876.25,
      uptime: 97.8,
      operating_hours: '6 AM - 11 PM',
      manager: {
        user_id: 'USER002',
        full_name: 'Trần Thị Quản lý',
        phone: '+84 902 345 678'
      }
    },
    {
      id: 'ST003',
      station_id: 'ST003',
      name: 'Trạm Nghỉ Cao tốc A1',
      address: 'Cao tốc A1 hướng Bắc Km 42',
      coordinates: { lat: 10.950000, lng: 106.800000 },
      status: 'maintenance',
      capacity: 16,
      available_batteries: 6,
      charging_batteries: 8,
      maintenance_batteries: 2,
      daily_swaps: 34,
      daily_revenue: 892.75,
      uptime: 89.5,
      operating_hours: '24/7',
      manager: {
        user_id: 'USER003',
        full_name: 'Lê Hoàng Quản lý',
        phone: '+84 903 456 789'
      }
    }
  ];

  // Fetch stations from API
  const fetchStations = async () => {
    try {
      // Only send status filter if not 'all'
      const params = {
        search: searchTerm,
        ...(statusFilter !== 'all' && { status: statusFilter })
      };

      console.log('Fetching stations with params:', params);
      const res = await getAllStations(params);
      console.log('API Response:', res);
      
      if (res.success) {
        if (Array.isArray(res.data)) {
          console.log('Station Data:', res.data);
          
          // Transform data: backend returns 'staff' array, frontend expects 'manager' object
          const transformedStations = res.data.map((station: any) => {
            // Get first staff member as manager (or you can filter by a specific role)
            const manager = station.staff && station.staff.length > 0 
              ? station.staff[0] 
              : null;
            
            return {
              ...station,
              id: station.station_id, // Add id alias for convenience
              manager: manager ? {
                user_id: manager.user_id,
                full_name: manager.full_name,
                email: manager.email,
                phone: manager.phone
              } : null,
              // Map battery stats if available
              available_batteries: station.battery_stats?.full || 0,
              charging_batteries: station.battery_stats?.charging || 0,
              maintenance_batteries: station.battery_stats?.maintenance || 0,
              // Ensure these fields exist
              daily_swaps: station.daily_swaps || 0,
              daily_revenue: station.daily_revenue || 0,
              uptime: station.uptime || 0,
            };
          });
          
          console.log('Transformed stations:', transformedStations);
          setStations(transformedStations.length > 0 ? transformedStations : mockStations);
        } else {
          console.error('Invalid API response format:', res);
          setStations(mockStations);
          toast.error('Định dạng dữ liệu không hợp lệ - Đang hiển thị dữ liệu mẫu');
        }
      } else {
        console.error('API Error:', res.message);
        setStations(mockStations);
        toast.error(res.message || 'Lỗi khi tải danh sách trạm - Đang hiển thị dữ liệu mẫu');
      }
    } catch (err: any) {
      console.error('Load stations error:', err);
      setStations(mockStations);
      toast.error('Lỗi kết nối API - Đang hiển thị dữ liệu mẫu');
    }
  };

  // Load stations on mount and when filters change
  useEffect(() => {
    fetchStations();
  }, [searchTerm, statusFilter]);



  // Handle create/update station
  const handleCreateStation = async (data: any) => {
    try {
      const { manager_id, coordinates, ...rest } = data;
      
      // Transform data for backend API
      const stationData = {
        ...rest,
        latitude: coordinates?.lat,
        longitude: coordinates?.lng,
      };
      
      // Step 1: Create station
      const res = await createStation(stationData);
      if (!res.success) {
        throw new Error(res.message || 'Failed to create station');
      }
      
      const newStation = res.data;
      console.log('✅ Station created:', newStation);
      
      // Step 2: If manager_id is provided, assign staff to this station
      if (manager_id) {
        try {
          const staffUpdateRes = await updateStaff(manager_id, {
            station_id: newStation.station_id
          });
          
          if (staffUpdateRes.success) {
            console.log('✅ Staff assigned to station');
            toast.success('Tạo trạm và gán quản lý thành công');
          } else {
            console.warn('⚠️ Station created but failed to assign staff:', staffUpdateRes.message);
            toast.warning('Trạm đã tạo nhưng không gán được quản lý');
          }
        } catch (staffError) {
          console.error('❌ Failed to assign staff:', staffError);
          toast.warning('Trạm đã tạo nhưng không gán được quản lý');
        }
      } else {
        toast.success('Tạo trạm thành công');
      }
      
      // Refresh station list
      await fetchStations();
      
    } catch (error: any) {
      console.error('❌ Create station error:', error);
      toast.error(error.message || 'Lỗi khi tạo trạm');
      throw error;
    }
  };

  const handleUpdateStation = async (data: any) => {
    if (!editingStation) return;
    try {
      const { manager_id, coordinates, ...rest } = data;
      
      // Transform data for backend API
      const stationData = {
        ...rest,
        latitude: coordinates?.lat,
        longitude: coordinates?.lng,
      };
      
      // Step 1: Update station info
      const res = await updateStation(editingStation.id, stationData);
      if (!res.success) {
        throw new Error(res.message || 'Failed to update station');
      }
      
      console.log('✅ Station updated:', res.data);
      
      // Step 2: Update staff assignment if manager_id changed
      const currentManagerId = editingStation.manager?.user_id;
      
      if (manager_id !== currentManagerId) {
        // If old manager exists, remove them from this station
        if (currentManagerId) {
          try {
            await updateStaff(currentManagerId, { station_id: null });
            console.log('✅ Old manager removed from station');
          } catch (error) {
            console.warn('⚠️ Failed to remove old manager:', error);
          }
        }
        
        // If new manager provided, assign them to this station
        if (manager_id) {
          try {
            const staffUpdateRes = await updateStaff(manager_id, {
              station_id: editingStation.station_id
            });
            
            if (staffUpdateRes.success) {
              console.log('✅ New manager assigned to station');
              toast.success('Cập nhật trạm và quản lý thành công');
            } else {
              toast.warning('Trạm đã cập nhật nhưng không gán được quản lý mới');
            }
          } catch (staffError) {
            console.error('❌ Failed to assign new manager:', staffError);
            toast.warning('Trạm đã cập nhật nhưng không gán được quản lý mới');
          }
        } else {
          toast.success('Cập nhật trạm thành công');
        }
      } else {
        toast.success('Cập nhật trạm thành công');
      }
      
      // Refresh station list
      await fetchStations();
      
    } catch (error: any) {
      console.error('❌ Update station error:', error);
      toast.error(error.message || 'Lỗi khi cập nhật trạm');
      throw error;
    }
  };

  const handleDeleteStation = async (stationId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa trạm này?')) {
      try {
        const res = await deleteStation(stationId);
        if (res.success) {
          toast.success('Xóa trạm thành công');
          fetchStations();
        } else {
          throw new Error(res.message || 'Failed to delete station');
        }
      } catch (error: any) {
        console.error('Error deleting station:', error);
        toast.error(error.message || 'Lỗi khi xóa trạm');
      }
    }
  };

  // Handle view details
  const handleViewDetails = (station: Station) => {
    setSelectedStation(station);
    setShowDetails(true);
  };

  // Handle edit
  const handleEdit = (station: Station) => {
    setEditingStation(station);
    setIsFormOpen(true);
  };

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    if (editingStation) {
      await handleUpdateStation(data);
    } else {
      await handleCreateStation(data);
    }
    setIsFormOpen(false);
    setEditingStation(null);
  };
  const getStatusIcon = (status: Station['status']) => {
    console.log('Status for icon:', status); // Debug log
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'closed': return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'maintenance': return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      default: return <Building className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getStatusColor = (status: Station['status']) => {
    console.log('Status for color:', status); // Debug log
    switch (status) {
      case 'active': return 'bg-green-50/80 dark:bg-green-500/10 text-green-800 dark:text-green-400 border-green-200/50 dark:border-green-500/20';
      case 'closed': return 'bg-red-50/80 dark:bg-red-500/10 text-red-800 dark:text-red-400 border-red-200/50 dark:border-red-500/20';
      case 'maintenance': return 'bg-yellow-50/80 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-500/20';
      default: return 'bg-slate-50/80 dark:bg-slate-500/10 text-slate-800 dark:text-slate-400 border-slate-200/50 dark:border-slate-500/20';
    }
  };

  const getStatusLabel = (status: Station['status']) => {
    console.log('Status for label:', status); // Debug log
    switch (status) {
      case 'active': return 'Trực tuyến';
      case 'closed': return 'Ngoại tuyến';
      case 'maintenance': return 'Bảo trì';
      default: return status || 'Unknown';
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-red-600 dark:text-red-400';
    if (utilization >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  // Normalize and filter stations
  const normalizeStation = (station: any): Station => {
    if (!station) {
      console.error('Received null or undefined station data');
      return null as any;
    }

    // Normalize status to lowercase
    const normalizeStatus = (apiStatus?: string): Station['status'] => {
      if (!apiStatus) {
        console.warn('Missing status for station:', station);
        return 'closed';
      }

      const status = apiStatus.toLowerCase().trim();
      console.log('Normalizing status:', status); // Debug log

      switch (status) {
        case 'active':
        case 'online':
          return 'active';
        case 'closed':
        case 'inactive':
        case 'offline':
          return 'closed';
        case 'maintenance':
        case 'bảo trì':
          return 'maintenance';
        default:
          console.warn('Unknown status:', apiStatus);
          return 'closed';
      }
    };

    const normalized = {
      id: station.id || station.station_id || '',
      station_id: station.station_id || station.id || '',
      name: station.name || 'Unnamed Station',
      address: station.address || 'No Address',
      coordinates: station.coordinates || { lat: 0, lng: 0 },
      status: normalizeStatus(station.status),
      capacity: Number(station.capacity) || 0,
      available_batteries: Number(station.available_batteries) || 0,
      charging_batteries: Number(station.charging_batteries) || 0,
      maintenance_batteries: Number(station.maintenance_batteries) || 0,
      daily_swaps: Number(station.daily_swaps) || 0,
      daily_revenue: Number(station.daily_revenue) || 0,
      uptime: Number(station.uptime) || 0,
      operating_hours: station.operating_hours || '24/7',
      manager: station.manager || null
    } as Station;

    console.log('Normalized station:', normalized); // Debug log
    return normalized;
  };

  const filteredStations = stations.map(normalizeStation);
  console.log('Filtered Stations:', filteredStations); // Debug log

  // Calculate statistics
  const stats = {
    total: filteredStations.length,
    online: filteredStations.filter((s: Station) => s.status === 'active').length,
    revenue: filteredStations.reduce((sum: number, s: Station) => sum + (s.daily_revenue || 0), 0),
    swaps: filteredStations.reduce((sum: number, s: Station) => sum + (s.daily_swaps || 0), 0)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-purple-900 dark:from-white dark:to-purple-100 bg-clip-text text-transparent">Quản lý Trạm</h1>
          <p className="text-slate-600 dark:text-slate-300">Giám sát và quản lý mạng lưới trạm thay pin</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={() => {
            setEditingStation(null);
            setIsFormOpen(true);
          }}
        >
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.online}</p>
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.swaps}</p>
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white">${stats.revenue.toLocaleString()}</p>
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
                <SelectItem value="active">Trực tuyến</SelectItem>
                <SelectItem value="closed">Ngoại tuyến</SelectItem>
                <SelectItem value="maintenance">Bảo trì</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Station List */}
      <div className="space-y-4">
        {filteredStations.map((station) => {
          const utilization = station.capacity ? 
            Math.round(((station.capacity - (station.available_batteries || 0)) / station.capacity) * 100) : 0;
          
          return (
            <Card key={station.station_id} className="glass-card border-0 glow-hover">
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
                        {/* Chỉ hiển thị ID cho admin khi hover */}
                        <div className="hidden group-hover:block text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {station.station_id}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Quản lý:</span>
                        <span className="text-slate-900 dark:text-white">{station.manager?.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Điện thoại:</span>
                        <span className="text-slate-900 dark:text-white">{station.manager?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Giờ hoạt động:</span>
                        <span className="text-slate-900 dark:text-white">{station.operating_hours}</span>
                      </div>
                    </div>
                  </div>

                  {/* Battery Status */}
                  <div className="lg:col-span-3 space-y-3">
                    <h4 className="font-medium text-slate-900 dark:text-white">Trạng thái Pin</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Khả dụng</span>
                        <span className="font-medium text-green-600 dark:text-green-400">{station.available_batteries}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Đang sạc</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">{station.charging_batteries}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Bảo trì</span>
                        <span className="font-medium text-yellow-600 dark:text-yellow-400">{station.maintenance_batteries}</span>
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
                        <span className="font-medium text-slate-900 dark:text-white">{station.daily_swaps}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Doanh thu:</span>
                        <span className="font-medium text-slate-900 dark:text-white">${station.daily_revenue?.toLocaleString()}</span>
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="glass border-purple-200/50 dark:border-purple-400/30"
                      onClick={() => handleViewDetails(station)}
                    >
                      <Activity className="mr-1 h-3 w-3" />
                      Chi tiết
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="glass border-blue-200/50 dark:border-blue-400/30"
                      onClick={() => handleEdit(station)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Chỉnh sửa
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="glass border-red-200/50 dark:border-red-400/30"
                      onClick={() => handleDeleteStation(station.station_id)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Xóa
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

      {/* Station Form Dialog */}
      <StationForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingStation(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingStation || undefined}
        title={editingStation ? 'Chỉnh sửa Trạm' : 'Thêm Trạm mới'}
      />

      {/* Station Details Dialog */}
      {showDetails && selectedStation && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-4xl">
            <StationDetails
              stationId={selectedStation.id}
              onClose={() => {
                setShowDetails(false);
                setSelectedStation(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StationManagement;