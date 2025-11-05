import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
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
  ArrowRight,
  RefreshCw,
  X,
  Loader2,
  Eye,
  Phone,
  User,
  MapPin,
  Calendar
} from 'lucide-react';
import { 
  StaffBooking, 
  getStationBookings,
  confirmBooking,
  completeBooking,
  cancelBooking,
  ConfirmBookingData,
  CompleteBookingData
} from '../../services/staff.service';
import { useToast } from '../../hooks/use-toast';

const SwapTransactions: React.FC = () => {
  const [bookings, setBookings] = useState<StaffBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<StaffBooking | null>(null);
  
  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  // Form states
  const [phoneInput, setPhoneInput] = useState('');
  const [oldBatteryCode, setOldBatteryCode] = useState('');
  const [batteryModel, setBatteryModel] = useState('');
  const [oldBatteryStatus, setOldBatteryStatus] = useState<'good' | 'damaged' | 'maintenance'>('good');
  const [cancelReason, setCancelReason] = useState('');
  
  const { toast } = useToast();

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      setRefreshing(true);
      const response = await getStationBookings({
        limit: 50,
      });
      
      if (response.success && response.data?.bookings) {
        // Filter chỉ lấy booking chưa hoàn thành hoặc hủy
        const activeBookings = response.data.bookings.filter(
          (b: StaffBooking) => ['pending', 'confirmed'].includes(b.status)
        );
        setBookings(activeBookings);
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
  }, []);

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
    setBatteryModel(booking.battery_model || '');
    setOldBatteryStatus('good');
    setCompleteDialogOpen(true);
  };

  // Complete booking - Swap battery
  const handleCompleteBooking = async () => {
    if (!selectedBooking || !oldBatteryCode.trim() || !batteryModel.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin',
        variant: 'destructive',
      });
      return;
    }

    try {
      setActionLoading(selectedBooking.booking_id);
      const response = await completeBooking(selectedBooking.booking_id, {
        old_battery_code: oldBatteryCode,
        battery_model: batteryModel,
        old_battery_status: oldBatteryStatus,
      });
      
      if (response.success) {
        toast({
          title: 'Thành công',
          description: `Hoàn thành đổi pin. ${response.data?.message || ''}`,
        });
        setCompleteDialogOpen(false);
        fetchBookings(); // Refresh list
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể hoàn thành booking',
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hàng đợi đổi pin</h1>
          <p className="text-gray-600">Quản lý các giao dịch đổi pin đang hoạt động</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
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

      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Chờ xác nhận</p>
                <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Đã xác nhận</p>
                <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'confirmed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Queue */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.booking_id} className="overflow-hidden">
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
      {bookings.length === 0 && (
        <Card className="p-12 text-center">
          <Zap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không có giao dịch đang hoạt động</h3>
          <p className="text-gray-500">
            Hàng đợi trống. Khách hàng mới sẽ xuất hiện tại đây khi họ đến.
          </p>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành đổi pin</DialogTitle>
            <DialogDescription>
              Nhập thông tin pin để hoàn tất giao dịch
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Khách hàng:</strong> {selectedBooking.user?.full_name}
                </p>
                <p className="text-sm">
                  <strong>Mã booking:</strong> {selectedBooking.booking_code}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="oldBatteryCode">
                  Mã pin cũ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="oldBatteryCode"
                  type="text"
                  placeholder="Nhập mã pin cũ của khách hàng"
                  value={oldBatteryCode}
                  onChange={(e) => setOldBatteryCode(e.target.value)}
                  disabled={actionLoading === selectedBooking.booking_id}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batteryModel">
                  Model pin mới <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="batteryModel"
                  type="text"
                  placeholder="Nhập model pin mới"
                  value={batteryModel}
                  onChange={(e) => setBatteryModel(e.target.value)}
                  disabled={actionLoading === selectedBooking.booking_id}
                />
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
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCompleteDialogOpen(false)}
              disabled={actionLoading === selectedBooking?.booking_id}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleCompleteBooking}
              disabled={!oldBatteryCode.trim() || !batteryModel.trim() || actionLoading === selectedBooking?.booking_id}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy booking</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do hủy booking này
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Khách hàng:</strong> {selectedBooking.user?.full_name}
                </p>
                <p className="text-sm">
                  <strong>Mã booking:</strong> {selectedBooking.booking_code}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cancelReason">
                  Lý do hủy <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="cancelReason"
                  placeholder="Nhập lý do hủy booking..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  disabled={actionLoading === selectedBooking.booking_id}
                />
                <p className="text-xs text-gray-500">
                  Lý do hủy sẽ được thông báo đến khách hàng
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCancelDialogOpen(false)}
              disabled={actionLoading === selectedBooking?.booking_id}
            >
              Quay lại
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={!cancelReason.trim() || actionLoading === selectedBooking?.booking_id}
            >
              {actionLoading === selectedBooking?.booking_id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang hủy...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Xác nhận hủy
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