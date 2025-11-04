import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
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
  Loader2
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

  // Confirm booking - Verify phone
  const handleConfirmBooking = async (booking: StaffBooking) => {
    const phone = prompt('Nhập số điện thoại của khách hàng để xác nhận:');
    if (!phone) return;

    try {
      setActionLoading(booking.booking_id);
      const response = await confirmBooking(booking.booking_id, { phone });
      
      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã xác nhận booking',
        });
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

  // Complete booking - Swap battery
  const handleCompleteBooking = async (booking: StaffBooking) => {
    const oldBatteryCode = prompt('Nhập mã pin cũ (battery code):');
    if (!oldBatteryCode) return;

    const batteryModel = booking.battery_model || prompt('Nhập model pin mới:');
    if (!batteryModel) return;

    try {
      setActionLoading(booking.booking_id);
      const response = await completeBooking(booking.booking_id, {
        old_battery_code: oldBatteryCode,
        battery_model: batteryModel,
        old_battery_status: 'good',
      });
      
      if (response.success) {
        toast({
          title: 'Thành công',
          description: `Hoàn thành đổi pin. ${response.data?.message || ''}`,
        });
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

  // Cancel booking
  const handleCancelBooking = async (booking: StaffBooking) => {
    const reason = prompt('Lý do hủy:');
    if (!reason) return;

    try {
      setActionLoading(booking.booking_id);
      const response = await cancelBooking(booking.booking_id, { reason });
      
      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã hủy booking',
        });
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
                        onClick={() => handleConfirmBooking(booking)}
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
                        onClick={() => handleCompleteBooking(booking)}
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
                      onClick={() => setSelectedBooking(booking)}
                    >
                      Chi tiết
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleCancelBooking(booking)}
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
    </div>
  );
};

export default SwapTransactions;