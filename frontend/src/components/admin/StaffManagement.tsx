import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import {
  Users,
  Search,
  Mail,
  Phone,
  Clock,
  Calendar,
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

  const handleDeleteStaff = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await staffService.deleteStaff(id);
      if (response.success) {
        setStaffList(prev => prev.filter(p => p.id !== id));
      } else {
        throw new Error(response.message || 'Không thể xóa nhân viên');
      }
    } catch (err: any) {
      console.error('Error deleting staff:', err);
      setError(err.message || 'Không thể xóa nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Staff['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400';
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
      <Card key={staff.user_id ?? staff.email ?? `staff-${idx}`} className="glass-card border-0 glow-hover group">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <Avatar className="w-16 h-16 ring-2 ring-green-500/20 dark:ring-emerald-500/20">
              <AvatarImage src={staff.avatar || undefined} />
              <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg">
                {staff.full_name ? staff.full_name.charAt(0) : staff.email?.charAt(0) ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {staff.full_name || staff.email?.split('@')[0] || '—'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{staff.role || 'Nhân viên'}</p>
                </div>
                <Badge className={getStatusColor(staff.status)}>
                  {getStatusIcon(staff.status)}
                  <span className="ml-1">{getStatusLabel(staff.status)}</span>
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">{staff.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">{staff.phone || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">{staff.station?.name || 'Chưa phân công'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Tham gia: {new Date(staff.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('Opening edit dialog for staff:', staff);
                    setSelectedStaff(staff);
                  }}
                  className="flex-1 glass border-purple-200/50 dark:border-purple-400/30 hover:bg-purple-50/50 dark:hover:bg-purple-500/10"
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
                    className="flex-1 glass border-red-200/50 dark:border-red-400/30 hover:bg-red-50/50 dark:hover:bg-red-500/10"
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
                    className="flex-1 glass border-green-200/50 dark:border-green-400/30 hover:bg-green-50/50 dark:hover:bg-green-500/10"
                  >
                    Kích hoạt
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">👥 Quản lý Nhân viên</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Quản lý thông tin và phân công nhân viên cho các trạm</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card key="total-staff" className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng nhân viên</CardTitle>
            <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalStaff}</div>
          </CardContent>
        </Card>
        <Card key="active-staff" className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Đang làm việc</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeStaff}</div>
          </CardContent>
        </Card>
        <Card key="inactive-staff" className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">Không hoạt động</CardTitle>
            <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{inactiveStaff}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Add */}
      <Card key="search" className="glass-card border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Danh sách Nhân viên</CardTitle>
            <CardDescription>Quản lý tất cả nhân viên trong hệ thống</CardDescription>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:from-purple-600 hover:to-violet-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm Nhân viên
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Tìm kiếm theo tên, email, vị trí..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass border-gray-200/50 dark:border-gray-700/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderStaffList()}
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Nhân viên mới</DialogTitle>
            <DialogDescription>
              Điền thông tin để thêm nhân viên mới vào hệ thống
            </DialogDescription>
          </DialogHeader>
          <StaffForm 
            onSubmit={handleAddStaff as any} 
            isSubmitting={loading}
            stations={stationList}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog 
        open={!!selectedStaff} 
        onOpenChange={(open) => {
          if (!open) setSelectedStaff(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Thông tin Nhân viên</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin nhân viên {selectedStaff?.full_name || selectedStaff?.email}
            </DialogDescription>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagement;