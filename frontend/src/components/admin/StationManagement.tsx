import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
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
          setStations(transformedStations);
        } else {
          console.error('Invalid API response format:', res);
          setStations([]);
          toast.error('Định dạng dữ liệu không hợp lệ');
        }
      } else {
        console.error('API Error:', res.message);
        setStations([]);
        toast.error(res.message || 'Lỗi khi tải danh sách trạm');
      }
    } catch (err: any) {
      console.error('Load stations error:', err);
      setStations([]);
      toast.error('Lỗi kết nối API');
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
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-red-100 text-red-800 border-red-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
    <div className="container mx-auto max-w-7xl px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Trạm</h1>
          <p className="text-muted-foreground">
            Giám sát và quản lý mạng lưới trạm thay pin.
          </p>
        </div>
        <Button onClick={() => {
          setEditingStation(null);
          setIsFormOpen(true);
        }} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm trạm mới
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Tổng trạm</CardTitle>
            <Building className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Trực tuyến</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.online}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-amber-50 to-yellow-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Lần thay hôm nay</CardTitle>
            <Activity className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">{stats.swaps}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-red-50 to-rose-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Doanh thu hôm nay</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">${stats.revenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-100 border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
            <Search className="h-5 w-5 text-slate-600" />
            Bộ lọc và tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên trạm, địa chỉ hoặc ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 bg-white border border-gray-300 shadow-sm">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                <SelectItem value="all" className="hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    Tất cả trạng thái
                  </div>
                </SelectItem>
                <SelectItem value="active" className="hover:bg-green-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Trực tuyến
                  </div>
                </SelectItem>
                <SelectItem value="closed" className="hover:bg-red-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Ngoại tuyến
                  </div>
                </SelectItem>
                <SelectItem value="maintenance" className="hover:bg-yellow-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    Bảo trì
                  </div>
                </SelectItem>
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
          <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] p-0 overflow-hidden flex flex-col gap-0">
            {/* Hidden accessibility header */}
            <DialogHeader className="sr-only">
              <DialogTitle>Chi tiết Trạm</DialogTitle>
              <DialogDescription>
                Xem thông tin chi tiết về trạm thay pin và hiệu suất hoạt động
              </DialogDescription>
            </DialogHeader>
            
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