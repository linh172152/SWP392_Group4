import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { 
  Zap, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Car,
  Battery,
  RefreshCw,
  X,
  Loader2,
  Eye,
  Phone,
  User,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
  type StaffBooking,
  getStationBookings,
  confirmBooking,
  completeBooking,
  cancelBooking,
} from '../../services/staff.service';
import { useToast } from '../../hooks/use-toast';

type SortField = 'scheduled_at' | 'created_at' | 'user_name' | 'booking_code';
type SortOrder = 'asc' | 'desc';

const SwapTransactions: React.FC = () => {
  const [bookings, setBookings] = useState<StaffBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<StaffBooking | null>(null);
  
  // Pagination & Filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('scheduled_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  // Form states
  const [phoneInput, setPhoneInput] = useState('');
  const [oldBatteryCode, setOldBatteryCode] = useState('');
  const [newBatteryCode, setNewBatteryCode] = useState('');
  const [batteryModel, setBatteryModel] = useState('');
  const [oldBatteryStatus, setOldBatteryStatus] = useState<'good' | 'damaged' | 'maintenance'>('good');
  const [oldBatteryCharge, setOldBatteryCharge] = useState<number>(0);
  const [newBatteryCharge, setNewBatteryCharge] = useState<number>(100);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelConfirmed, setCancelConfirmed] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Fetch all bookings (for client-side filtering, searching, sorting)
  const fetchBookings = async () => {
    try {
      setRefreshing(true);
      // Fetch a large number to get all bookings matching the status filter
      const response = await getStationBookings({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: 1,
        limit: 1000, // Fetch large number for client-side operations
      });
      
      if (response.success && response.data) {
        let allBookings = response.data.bookings || [];
        
        // Apply client-side search
        if (searchTerm.trim()) {
          const searchLower = searchTerm.toLowerCase();
          allBookings = allBookings.filter((b: StaffBooking) => 
            b.user?.full_name?.toLowerCase().includes(searchLower) ||
            b.booking_code?.toLowerCase().includes(searchLower) ||
            b.user?.phone?.includes(searchTerm) ||
            b.user?.email?.toLowerCase().includes(searchLower) ||
            b.vehicle?.license_plate?.toLowerCase().includes(searchLower) ||
            b.vehicle?.make?.toLowerCase().includes(searchLower) ||
            b.vehicle?.model?.toLowerCase().includes(searchLower)
          );
        }
        
        // Apply client-side sorting
        allBookings.sort((a: StaffBooking, b: StaffBooking) => {
          let aValue: any;
          let bValue: any;
          
          switch (sortField) {
            case 'scheduled_at':
              aValue = new Date(a.scheduled_at).getTime();
              bValue = new Date(b.scheduled_at).getTime();
              break;
            case 'created_at':
              aValue = new Date(a.created_at).getTime();
              bValue = new Date(b.created_at).getTime();
              break;
            case 'user_name':
              aValue = a.user?.full_name || '';
              bValue = b.user?.full_name || '';
              break;
            case 'booking_code':
              aValue = a.booking_code || '';
              bValue = b.booking_code || '';
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
        
        // Calculate pagination
        const totalFiltered = allBookings.length;
        const totalPagesCalculated = Math.ceil(totalFiltered / pageSize);
        setTotalItems(totalFiltered);
        setTotalPages(totalPagesCalculated);
        
        // Apply pagination
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedBookings = allBookings.slice(startIndex, endIndex);
        
        setBookings(paginatedBookings);
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải danh sách booking',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, statusFilter, sortField, sortOrder]);

  // Debounce search and reset to page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchBookings();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  // Open detail dialog
  const handleViewDetail = (booking: StaffBooking) => {
    setSelectedBooking(booking);
    setDetailDialogOpen(true);
  };

  // Open confirm dialog
  const handleOpenConfirmDialog = (booking: StaffBooking) => {
    setSelectedBooking(booking);
    setPhoneInput('');
    setConfirmDialogOpen(true);
  };

  // Confirm booking - Verify phone
  const handleConfirmBooking = async () => {
    if (!selectedBooking || !phoneInput.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập số điện thoại',
        variant: 'destructive',
      });
      return;
    }

    try {
      setActionLoading(selectedBooking.booking_id);
      const response = await confirmBooking(selectedBooking.booking_id, { phone: phoneInput });
      
      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã xác nhận booking',
        });
        setConfirmDialogOpen(false);
        fetchBookings(); // Refresh list
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể xác nhận booking',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Open complete dialog
  const handleOpenCompleteDialog = (booking: StaffBooking) => {
    setSelectedBooking(booking);
    setOldBatteryCode('');
    setNewBatteryCode('');
    setBatteryModel(booking.battery_model || '');
    setOldBatteryStatus('good');
    setOldBatteryCharge(0);
    setNewBatteryCharge(100);
    setCompleteError(null); // Reset error
    setCompleteDialogOpen(true);
  };

  // Complete booking - Swap battery
  const handleCompleteBooking = async () => {
    if (!selectedBooking || !oldBatteryCode.trim() || !newBatteryCode.trim() || !batteryModel.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin (mã pin cũ, mã pin mới, và model pin)',
        variant: 'destructive',
      });
      return;
    }

    // Validate và convert battery charge to number
    const oldCharge = Number(oldBatteryCharge);
    const newCharge = Number(newBatteryCharge);

    if (isNaN(oldCharge) || oldCharge < 0 || oldCharge > 100) {
      toast({
        title: 'Lỗi',
        description: 'Mức sạc pin cũ phải từ 0-100%',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(newCharge) || newCharge < 0 || newCharge > 100) {
      toast({
        title: 'Lỗi',
        description: 'Mức sạc pin mới phải từ 0-100%',
        variant: 'destructive',
      });
      return;
    }

    try {
      setActionLoading(selectedBooking.booking_id);
      setCompleteError(null); // Reset error trước khi submit
      
      const response = await completeBooking(selectedBooking.booking_id, {
        old_battery_code: oldBatteryCode.trim(),
        new_battery_code: newBatteryCode.trim(),
        battery_model: batteryModel.trim(),
        old_battery_status: oldBatteryStatus,
        old_battery_charge: oldCharge, // Đảm bảo là number
        new_battery_charge: newCharge, // Đảm bảo là number
      });
      
      if (response.success) {
        toast({
          title: 'Thành công',
          description: `Hoàn thành đổi pin. ${response.data?.message || ''}`,
        });
        setCompleteDialogOpen(false);
        setCompleteError(null);
        fetchBookings(); // Refresh list
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Không thể hoàn thành booking';
      setCompleteError(errorMessage); // Hiển thị lỗi trong dialog
      
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Open cancel dialog
  const handleOpenCancelDialog = (booking: StaffBooking) => {
    setSelectedBooking(booking);
    setCancelReason('');
    setCancelConfirmed(false); // Reset checkbox
    setCancelDialogOpen(true);
  };

  // Cancel booking
  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancelReason.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập lý do hủy',
        variant: 'destructive',
      });
      return;
    }

    try {
      setActionLoading(selectedBooking.booking_id);
      const response = await cancelBooking(selectedBooking.booking_id, { reason: cancelReason });
      
      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã hủy booking',
        });
        setCancelDialogOpen(false);
        fetchBookings(); // Refresh list
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể hủy booking',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-green-900 dark:from-white dark:to-green-100 bg-clip-text text-transparent">
            Giao dịch thay pin
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Quản lý các giao dịch đổi pin đang hoạt động
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="glass border-green-200/50 dark:border-emerald-400/30 hover:bg-green-50/50 dark:hover:bg-emerald-500/10"
            onClick={fetchBookings}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card border-0 glow">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Tìm kiếm theo tên, mã booking, SĐT, biển số..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass border-slate-200/50 dark:border-slate-700/50"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 glass border-slate-200/50 dark:border-slate-700/50">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="glass-card border-0">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ xác nhận</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            {/* Page Size */}
            <Select value={String(pageSize)} onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full md:w-32 glass border-slate-200/50 dark:border-slate-700/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-0">
                <SelectItem value="10">10 / trang</SelectItem>
                <SelectItem value="20">20 / trang</SelectItem>
                <SelectItem value="50">50 / trang</SelectItem>
                <SelectItem value="100">100 / trang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Chờ xác nhận</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {bookings.filter(b => b.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Đã xác nhận</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Hoàn thành</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {bookings.filter(b => b.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Tổng số</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sort Header */}
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleSort('scheduled_at')}
                className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Thời gian đặt
                {getSortIcon('scheduled_at')}
              </button>
              <button
                onClick={() => handleSort('user_name')}
                className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Khách hàng
                {getSortIcon('user_name')}
              </button>
              <button
                onClick={() => handleSort('booking_code')}
                className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Mã booking
                {getSortIcon('booking_code')}
              </button>
            </div>
            <div className="text-xs">
              Hiển thị {bookings.length} / {totalItems} kết quả
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Queue */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.booking_id} className="glass-card border-0 glow-hover overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Customer & Vehicle Info */}
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {booking.user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{booking.user?.full_name || 'Khách hàng'}</h3>
                    <p className="text-sm text-gray-600">{booking.user?.phone || booking.user?.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Car className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {booking.vehicle?.make} {booking.vehicle?.model} • {booking.vehicle?.license_plate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Loại pin</p>
                    <p className="font-medium">{booking.battery_model}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Mã booking</p>
                    <p className="font-medium">{booking.booking_code}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Thời gian đặt</p>
                    <p className="font-medium">
                      {new Date(booking.scheduled_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  {booking.checked_in_by_staff && (
                    <div>
                      <p className="text-gray-500">Xác nhận bởi</p>
                      <p className="font-medium">{booking.checked_in_by_staff.full_name}</p>
                    </div>
                  )}
                </div>

                {/* Status & Actions */}
                <div className="flex flex-col items-end space-y-3">
                  <Badge className={getStatusColor(booking.status)}>
                    {getStatusIcon(booking.status)}
                    <span className="ml-1">{getStatusText(booking.status)}</span>
                  </Badge>

                  <div className="flex space-x-2">
                    {booking.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleOpenConfirmDialog(booking)}
                        disabled={actionLoading === booking.booking_id}
                      >
                        {actionLoading === booking.booking_id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        )}
                        Xác nhận
                      </Button>
                    )}
                    {booking.status === 'confirmed' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleOpenCompleteDialog(booking)}
                        disabled={actionLoading === booking.booking_id}
                      >
                        {actionLoading === booking.booking_id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Zap className="mr-1 h-3 w-3" />
                        )}
                        Đổi pin
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewDetail(booking)}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Chi tiết
                    </Button>
                    {/* Chỉ hiển thị nút hủy khi booking chưa bị hủy và chưa hoàn thành */}
                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleOpenCancelDialog(booking)}
                        disabled={actionLoading === booking.booking_id}
                      >
                        {actionLoading === booking.booking_id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Transaction Info */}
              {booking.transaction && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                      <Battery className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">
                        Mã giao dịch: {booking.transaction.transaction_code}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                      <span className="font-medium">
                        Số tiền: {Number(booking.transaction.amount).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {bookings.length === 0 && !loading && (
        <Card className="glass-card border-0 p-12 text-center">
          <Zap className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            {searchTerm || statusFilter !== 'all' 
              ? 'Không tìm thấy kết quả' 
              : 'Không có giao dịch đang hoạt động'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {searchTerm || statusFilter !== 'all'
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
              : 'Hàng đợi trống. Khách hàng mới sẽ xuất hiện tại đây khi họ đến.'}
          </p>
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
              Trang {currentPage} / {totalPages} • Tổng {totalItems} giao dịch
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
          <CardDescription>Điều khiển khẩn cấp và quản lý hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-16 flex-col"
              onClick={fetchBookings}
            >
              <RefreshCw className="h-6 w-6 mb-2" />
              <span className="text-sm">Làm mới danh sách</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Clock className="h-6 w-6 mb-2" />
              <span className="text-sm">Lịch sử</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <AlertCircle className="h-6 w-6 mb-2 text-red-600" />
              <span className="text-sm">Khẩn cấp</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết giao dịch thay pin</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về booking và khách hàng
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Thông tin khách hàng
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Họ tên:</span>
                    <p className="font-medium">{selectedBooking.user?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Số điện thoại:</span>
                    <p className="font-medium flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {selectedBooking.user?.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{selectedBooking.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Trạng thái:</span>
                    <Badge className={getStatusColor(selectedBooking.status)}>
                      {getStatusText(selectedBooking.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold flex items-center">
                  <Car className="h-4 w-4 mr-2" />
                  Thông tin xe
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Hãng xe:</span>
                    <p className="font-medium">{selectedBooking.vehicle?.make || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Mẫu xe:</span>
                    <p className="font-medium">{selectedBooking.vehicle?.model || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Biển số:</span>
                    <p className="font-medium">{selectedBooking.vehicle?.license_plate || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Loại pin:</span>
                    <p className="font-medium">{selectedBooking.battery_model || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Booking Info */}
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Thông tin đặt lịch
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Mã booking:</span>
                    <p className="font-medium">{selectedBooking.booking_code}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Thời gian đặt:</span>
                    <p className="font-medium">
                      {new Date(selectedBooking.scheduled_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  {selectedBooking.checked_in_by_staff && (
                    <div>
                      <span className="text-gray-500">Xác nhận bởi:</span>
                      <p className="font-medium">{selectedBooking.checked_in_by_staff.full_name}</p>
                    </div>
                  )}
                  {selectedBooking.transaction && (
                    <>
                      <div>
                        <span className="text-gray-500">Mã giao dịch:</span>
                        <p className="font-medium">{selectedBooking.transaction.transaction_code}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Số tiền:</span>
                        <p className="font-medium text-green-600">
                          {Number(selectedBooking.transaction.amount).toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Booking Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận khách hàng</DialogTitle>
            <DialogDescription>
              Nhập số điện thoại của khách hàng để xác nhận booking
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Khách hàng:</strong> {selectedBooking.user?.full_name}
                </p>
                <p className="text-sm">
                  <strong>Mã booking:</strong> {selectedBooking.booking_code}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Số điện thoại <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Nhập số điện thoại khách hàng"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  disabled={actionLoading === selectedBooking.booking_id}
                />
                <p className="text-xs text-gray-500">
                  Số điện thoại phải khớp với thông tin đăng ký của khách hàng
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialogOpen(false)}
              disabled={actionLoading === selectedBooking?.booking_id}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleConfirmBooking}
              disabled={!phoneInput.trim() || actionLoading === selectedBooking?.booking_id}
            >
              {actionLoading === selectedBooking?.booking_id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xác nhận...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Xác nhận
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Booking Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Hoàn thành đổi pin</DialogTitle>
            <DialogDescription>
              Nhập thông tin pin để hoàn tất giao dịch
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2 -mr-2">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Khách hàng:</strong> {selectedBooking.user?.full_name}
                </p>
                <p className="text-sm">
                  <strong>Mã booking:</strong> {selectedBooking.booking_code}
                </p>
              </div>
              
              {/* Error Message */}
              {completeError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-900 dark:text-red-200">
                        Lỗi khi hoàn thành booking
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {completeError}
                      </p>
                      {completeError.includes('not found') && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                          💡 Kiểm tra lại mã pin cũ. Mã pin phải tồn tại trong hệ thống kho pin.
                        </p>
                      )}
                      {completeError.includes('không khớp với pin đã giữ') && (() => {
                        // Extract mã pin đã giữ từ error message
                        const match = completeError.match(/pin đã giữ \(([^)]+)\)/);
                        const reservedBatteryCode = match ? match[1] : null;
                        return (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-2 space-y-1">
                            <p className="font-semibold">💡 Hướng dẫn:</p>
                            {reservedBatteryCode && (
                              <p className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded font-mono font-bold">
                                Mã pin đã giữ: {reservedBatteryCode}
                              </p>
                            )}
                            <p>• Mã pin mới phải khớp với pin đã được giữ cho booking này</p>
                            <p>• Kiểm tra lại mã pin trên nhãn pin thực tế</p>
                            <p>• Nếu pin đã bị thay đổi/điều phối, vui lòng yêu cầu driver đặt lại booking</p>
                          </div>
                        );
                      })()}
                      {completeError.includes('không khớp với pin hiện tại của xe') && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                          💡 Mã pin cũ phải khớp với pin đang được sử dụng trên xe của khách hàng. Vui lòng kiểm tra lại.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box - Giải thích */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800 dark:text-blue-200">
                    <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
                    <p>• <strong>Mã pin cũ:</strong> Mã riêng trên từng viên pin cũ (VD: BAT-TD03, BAT-VF001)</p>
                    <p>• <strong>Mã pin mới:</strong> Mã riêng trên từng viên pin mới sẽ thay thế (VD: BAT-TD05, BAT-VF002)</p>
                    <p>• <strong>Model pin:</strong> Loại/dòng pin (VD: Tesla Model 3, VinFast VF8 Battery)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="oldBatteryCode" className="flex items-center gap-2">
                  <Battery className="h-4 w-4 text-orange-600" />
                  Mã pin cũ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="oldBatteryCode"
                  type="text"
                  placeholder="VD: BAT-TD03, BAT-VF001, BAT-123"
                  value={oldBatteryCode}
                  onChange={(e) => {
                    setOldBatteryCode(e.target.value);
                    if (completeError) setCompleteError(null); // Clear error khi user nhập lại
                  }}
                  disabled={actionLoading === selectedBooking.booking_id}
                  className={`font-mono ${completeError && completeError.includes('not found') ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                <p className="text-xs text-gray-500">
                  💡 Nhập mã trên nhãn pin cũ của khách hàng (không phải tên model)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newBatteryCode" className="flex items-center gap-2">
                  <Battery className="h-4 w-4 text-green-600" />
                  Mã pin mới <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="newBatteryCode"
                  type="text"
                  placeholder="VD: BAT-TD05, BAT-VF002, BAT-456"
                  value={newBatteryCode}
                  onChange={(e) => {
                    setNewBatteryCode(e.target.value);
                    if (completeError) setCompleteError(null); // Clear error khi user nhập lại
                  }}
                  disabled={actionLoading === selectedBooking.booking_id}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500">
                  💡 Nhập mã trên nhãn pin mới sẽ thay thế cho pin cũ
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batteryModel" className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  Model pin mới <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="batteryModel"
                  type="text"
                  placeholder="VD: Tesla Model 3, VinFast VF8 Battery, BMW I3"
                  value={batteryModel}
                  onChange={(e) => setBatteryModel(e.target.value)}
                  disabled={actionLoading === selectedBooking.booking_id}
                />
                <p className="text-xs text-gray-500">
                  💡 Nhập loại/dòng pin mới sẽ thay thế
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="oldBatteryStatus">
                  Tình trạng pin cũ <span className="text-red-500">*</span>
                </Label>
                <select
                  id="oldBatteryStatus"
                  className="w-full border rounded-md p-2 bg-white dark:bg-slate-900"
                  value={oldBatteryStatus}
                  onChange={(e) => setOldBatteryStatus(e.target.value as any)}
                  disabled={actionLoading === selectedBooking.booking_id}
                >
                  <option value="good">Tốt</option>
                  <option value="damaged">Hư hỏng</option>
                  <option value="maintenance">Cần bảo trì</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="oldBatteryCharge" className="flex items-center gap-2">
                  <Battery className="h-4 w-4 text-orange-600" />
                  Mức sạc pin cũ (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="oldBatteryCharge"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="Nhập % (0-100)"
                  value={oldBatteryCharge}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      setOldBatteryCharge(0);
                      return;
                    }
                    const numValue = parseInt(inputValue, 10);
                    if (!isNaN(numValue)) {
                      setOldBatteryCharge(Math.max(0, Math.min(100, numValue)));
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '' || isNaN(parseInt(e.target.value, 10))) {
                      setOldBatteryCharge(0);
                    }
                  }}
                  disabled={actionLoading === selectedBooking.booking_id}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500">
                  💡 Nhập mức sạc hiện tại của pin cũ (0-100%)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newBatteryCharge" className="flex items-center gap-2">
                  <Battery className="h-4 w-4 text-green-600" />
                  Mức sạc pin mới (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="newBatteryCharge"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="Nhập % (0-100)"
                  value={newBatteryCharge}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      setNewBatteryCharge(100);
                      return;
                    }
                    const numValue = parseInt(inputValue, 10);
                    if (!isNaN(numValue)) {
                      setNewBatteryCharge(Math.max(0, Math.min(100, numValue)));
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '' || isNaN(parseInt(e.target.value, 10))) {
                      setNewBatteryCharge(100);
                    }
                  }}
                  disabled={actionLoading === selectedBooking.booking_id}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500">
                  💡 Nhập mức sạc của pin mới (0-100%)
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setCompleteDialogOpen(false)}
              disabled={actionLoading === selectedBooking?.booking_id}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleCompleteBooking}
              disabled={
                !oldBatteryCode.trim() || 
                !newBatteryCode.trim() || 
                !batteryModel.trim() || 
                isNaN(Number(oldBatteryCharge)) ||
                Number(oldBatteryCharge) < 0 || 
                Number(oldBatteryCharge) > 100 ||
                isNaN(Number(newBatteryCharge)) ||
                Number(newBatteryCharge) < 0 || 
                Number(newBatteryCharge) > 100 ||
                actionLoading === selectedBooking?.booking_id
              }
            >
              {actionLoading === selectedBooking?.booking_id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Hoàn thành
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <X className="h-5 w-5" />
              Hủy booking
            </DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do hủy booking này. Thông tin sẽ được gửi đến khách hàng.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              {/* Warning */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-200">
                      Cảnh báo: Hủy booking
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Khách hàng sẽ nhận được thông báo hủy booking này.
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking Info */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Khách hàng</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedBooking.user?.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Mã booking</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedBooking.booking_code}
                  </p>
                </div>
                {selectedBooking.user?.phone && (
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Số điện thoại</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedBooking.user.phone}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Cancel Reason */}
              <div className="space-y-2">
                <Label htmlFor="cancelReason">
                  Lý do hủy <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="cancelReason"
                  placeholder="Ví dụ: Trạm đang bảo trì, Hết pin tồn kho, Khách hàng không đến..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  disabled={actionLoading === selectedBooking.booking_id}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  💡 Lý do hủy sẽ được gửi thông báo đến khách hàng
                </p>
              </div>

              {/* Confirmation Checkbox */}
              <div className="flex items-start space-x-3 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-slate-300 dark:border-slate-600">
                <input
                  type="checkbox"
                  id="cancel-confirm"
                  checked={cancelConfirmed}
                  onChange={(e) => setCancelConfirmed(e.target.checked)}
                  disabled={!cancelReason.trim() || actionLoading === selectedBooking.booking_id}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <label 
                  htmlFor="cancel-confirm" 
                  className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer select-none"
                >
                  Tôi xác nhận muốn hủy booking <strong className="text-red-600 dark:text-red-400">{selectedBooking.booking_code}</strong> và đã nhập lý do hợp lệ
                </label>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelConfirmed(false);
              }}
              disabled={actionLoading === selectedBooking?.booking_id}
              className="w-full sm:w-auto"
            >
              Quay lại
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={!cancelReason.trim() || !cancelConfirmed || actionLoading === selectedBooking?.booking_id}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {actionLoading === selectedBooking?.booking_id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang hủy...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Hủy Booking
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SwapTransactions;