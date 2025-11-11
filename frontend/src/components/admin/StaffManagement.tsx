import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import staffService from '../../services/staff.service';
import type { Staff, CreateStaffData } from '../../services/staff.service';
import stationService from '../../services/station.service';
import type { Station } from '../../services/station.service';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Users,
  Search,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Building,
  Plus,
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '../ui/dialog';
import StaffForm from './StaffForm';

const StaffManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [stationList, setStationList] = useState<Station[]>([]);

  useEffect(() => {
    const fetchStationList = async () => {
      try {
        console.log('Fetching stations...');
        const response = await stationService.getAllStations();
        console.log('Station API response:', response);
        console.log('Raw station data:', JSON.stringify(response.data, null, 2));
        
        if (response.success) {
          // Lấy tất cả trạm (không lọc theo status vì có thể status khác với expected)
          setStationList(response.data);
          console.log('All stations:', response.data);
        }
      } catch (err) {
        console.error('Error fetching stations:', err);
      }
    };

    fetchStationList();
  }, []);

  useEffect(() => {
    const fetchStaffList = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await staffService.getAllStaff();
        if (response.success) {
          setStaffList(response.data);
        } else {
          throw new Error(response.message || 'Không thể tải danh sách nhân viên');
        }
      } catch (err: any) {
        console.error('Error fetching staff:', err);
        setError(err.message || 'Không thể tải danh sách nhân viên');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffList();
  }, []);

  const handleAddStaff = async (formData: any) => {
    setLoading(true);
    setError(null);
    try {
      // Map form data to API requirements
      const staffData: CreateStaffData = {
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        password: formData.password,
        status: formData.status,
        station_id: formData.station_id || null,
        role: formData.position || 'STAFF'
      };

      const response = await staffService.createStaff(staffData);
      if (response.success) {
        setStaffList(prev => [response.data, ...prev]);
        setIsAddDialogOpen(false);
      } else {
        throw new Error(response.message || 'Không thể thêm nhân viên');
      }
    } catch (err: any) {
      console.error('Error adding staff:', err);
      setError(err.message || 'Không thể thêm nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStaff = async (userId: string | undefined, data: Partial<Staff>) => {
    if (!userId) {
      setError('ID nhân viên không hợp lệ');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Convert status to uppercase if it's being updated
      const updatedData = {
        ...data,
        status: data.status ? data.status.toUpperCase() as 'ACTIVE' | 'INACTIVE' : undefined
      };
      
      const response = await staffService.updateStaff(userId, updatedData);
      if (response.success) {
        setStaffList(prev => prev.map(p => p.user_id === userId ? response.data : p));
        setSelectedStaff(null);
      } else {
        throw new Error(response.message || 'Không thể cập nhật thông tin nhân viên');
      }
    } catch (err: any) {
      console.error('Error updating staff:', err);
      setError(err.message || 'Không thể cập nhật thông tin nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Staff['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Staff['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <UserCheck className="h-4 w-4" />;
      case 'INACTIVE':
        return <UserX className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: Staff['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'Đang làm việc';
      case 'INACTIVE':
        return 'Không hoạt động';
      default:
        return status;
    }
  };

  const filteredStaff = staffList.filter(staff => {
    if (!staff) return false;
    
    const query = searchQuery.toLowerCase();
    const getDisplayName = (s: Staff) => {
      // try common fields, be defensive about casing and nesting
      const asAny = s as any;
      const candidates = [
        s.name,
        asAny.full_name,
        asAny.fullName,
        `${asAny.first_name || ''} ${asAny.last_name || ''}`.trim(),
        `${asAny.last_name || ''} ${asAny.first_name || ''}`.trim(),
        asAny.profile?.name,
        asAny.user?.name,
      ];
      for (const c of candidates) {
        if (c && typeof c === 'string' && c.trim()) return c.trim();
      }
      // fallback to email prefix
      if (s.email) return s.email.split('@')[0];
      return '';
    };

    const fullName = getDisplayName(staff);
    return (
      (fullName || '').toLowerCase().includes(query) ||
      (staff.email || '').toLowerCase().includes(query) ||
      (staff.position || '').toLowerCase().includes(query) ||
      (staff.station_name || '').toLowerCase().includes(query)
    );
  });

  const totalStaff = staffList.length;
  const activeStaff = staffList.filter(s => s.status === 'ACTIVE').length;
  const inactiveStaff = staffList.filter(s => s.status === 'INACTIVE').length;

  const renderStaffList = () => {
    if (loading) {
      return (
        <Card key="loading" className="glass-card border-0 col-span-2">
          <CardContent className="p-6">
            <div className="text-center text-gray-600 dark:text-gray-400">Đang tải...</div>
          </CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card key="error" className="glass-card border-0 col-span-2">
          <CardContent className="p-6">
            <div className="text-center text-red-600 dark:text-red-400">{error}</div>
          </CardContent>
        </Card>
      );
    }

    if (filteredStaff.length === 0) {
      return (
        <Card key="empty" className="glass-card border-0 col-span-2">
          <CardContent className="p-6">
            <div className="text-center text-gray-600 dark:text-gray-400">
              Không tìm thấy nhân viên nào
            </div>
          </CardContent>
        </Card>
      );
    }

    return filteredStaff.map((staff, idx) => (
      <Card key={staff.user_id ?? staff.email ?? `staff-${idx}`} className="transition-all duration-200 hover:shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">
                  {staff.full_name || staff.email?.split('@')[0] || '—'}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {staff.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {staff.phone || 'Chưa cập nhật'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {staff.station?.name || 'Chưa phân công'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={getStatusColor(staff.status)}>
                {getStatusIcon(staff.status)}
                <span className="ml-1">{getStatusLabel(staff.status)}</span>
              </Badge>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('Opening edit dialog for staff:', staff);
                    setSelectedStaff(staff);
                  }}
                  className="gap-1"
                >
                  Chỉnh sửa
                </Button>
                {staff.status === 'ACTIVE' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (staff.user_id) {
                        handleUpdateStaff(staff.user_id, { status: 'INACTIVE' });
                      } else {
                        setError('ID nhân viên không hợp lệ');
                      }
                    }}
                    className="gap-1 text-red-600 hover:text-red-700"
                  >
                    Vô hiệu hóa
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (staff.user_id) {
                        handleUpdateStaff(staff.user_id, { status: 'ACTIVE' });
                      } else {
                        setError('ID nhân viên không hợp lệ');
                      }
                    }}
                    className="gap-1 text-green-600 hover:text-green-700"
                  >
                    Kích hoạt
                  </Button>
                )}
              </div>
            </div>
          </div>
          {staff.created_at && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>Tham gia:</strong> {new Date(staff.created_at).toLocaleDateString('vi-VN')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 space-y-6">

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Tổng nhân viên</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{totalStaff}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Đang làm việc</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{activeStaff}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-red-50 to-rose-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Không hoạt động</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{inactiveStaff}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Nhân viên</h1>
          <p className="text-muted-foreground">
            Quản lý thông tin và phân công nhân viên cho các trạm.
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm nhân viên
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-100 border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
            <Search className="h-5 w-5 text-slate-600" />
            Tìm kiếm và lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, email, vị trí..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <div className="space-y-4">
        {renderStaffList()}
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-7xl w-[98vw] max-h-[95vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle>Thêm Nhân viên mới</DialogTitle>
            <DialogDescription>
              Điền thông tin để thêm nhân viên mới vào hệ thống
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(95vh-120px)] px-2">
            <StaffForm 
              onSubmit={handleAddStaff as any} 
              isSubmitting={loading}
              stations={stationList}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog 
        open={!!selectedStaff} 
        onOpenChange={(open) => {
          if (!open) setSelectedStaff(null);
        }}
      >
        <DialogContent className="max-w-7xl w-[98vw] max-h-[95vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle>Chỉnh sửa Thông tin Nhân viên</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin nhân viên {selectedStaff?.full_name || selectedStaff?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(95vh-120px)] px-2">
            {selectedStaff && (
              <StaffForm 
                initialData={selectedStaff}
                onSubmit={async (data) => {
                  if (!selectedStaff.user_id) {
                    setError('ID nhân viên không hợp lệ');
                    return;
                  }
                  await handleUpdateStaff(selectedStaff.user_id, {
                    full_name: data.name,
                    email: data.email,
                    phone: data.phone,
                    role: data.position,
                    status: data.status,
                    station_id: data.station_id || null,
                  });
                }}
                isSubmitting={loading}
                stations={stationList}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagement;