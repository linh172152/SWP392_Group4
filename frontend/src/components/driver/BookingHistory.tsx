import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Car,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Loader2
} from 'lucide-react';
import { bookingService, Booking } from '../../services/booking.service';

const BookingHistory: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  // Load bookings khi component mount hoặc khi filter thay đổi
  useEffect(() => {
    loadBookings();
  }, [statusFilter, page]);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 10 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await bookingService.getUserBookings(params);
      setBookings(response.bookings);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách đặt chỗ');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy đặt chỗ này?')) {
      return;
    }

    try {
      await bookingService.cancelBooking(bookingId);
      // Reload bookings
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Không thể hủy đặt chỗ');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'pending':
      case 'confirmed': return <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      default: return <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50/80 dark:bg-green-500/10 text-green-800 dark:text-green-400 border-green-200/50 dark:border-green-500/20';
      case 'cancelled': return 'bg-red-50/80 dark:bg-red-500/10 text-red-800 dark:text-red-400 border-red-200/50 dark:border-red-500/20';
      case 'pending':
      case 'confirmed': return 'bg-blue-50/80 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20';
      case 'in_progress': return 'bg-yellow-50/80 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-500/20';
      default: return 'bg-slate-50/80 dark:bg-slate-500/10 text-slate-800 dark:text-slate-400 border-slate-200/50 dark:border-slate-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'in_progress': return 'Đang thực hiện';
      default: return status;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const stationName = booking.station?.name || '';
    const vehicleInfo = `${booking.vehicle?.make || ''} ${booking.vehicle?.model || ''} ${booking.vehicle?.license_plate || ''}`;
    const bookingCode = booking.booking_code || '';
    
    const matchesSearch = stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          vehicleInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          bookingCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalBookings = pagination?.total || 0;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">Lịch sử Thay pin</h1>
          <p className="text-slate-600 dark:text-slate-300">Xem lịch sử và chi tiết các lần thay pin</p>
        </div>
        <Button className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <Download className="mr-2 h-4 w-4" />
          Xuất dữ liệu
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 gradient-primary rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Tổng lần thay</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalBookings}</p>
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
                <p className="text-sm text-slate-600 dark:text-slate-400">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{completedBookings}</p>
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
                placeholder="Tìm kiếm theo trạm, xe hoặc mã đặt chỗ..."
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
                <SelectItem value="pending">Chờ xác nhận</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <Alert className="border-red-200 bg-red-50/50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Booking List */}
      {!loading && (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const scheduledDate = new Date(booking.scheduled_at);
            return (
              <Card key={booking.booking_id} className="glass-card border-0 glow-hover">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 gradient-primary rounded-lg shadow-lg">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {booking.station?.name || 'N/A'}
                          </h3>
                          <Badge className={getStatusColor(booking.status)}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-1">{getStatusLabel(booking.status)}</span>
                          </Badge>
                          {booking.is_instant && (
                            <Badge className="bg-purple-50/80 text-purple-800 border-purple-200/50">
                              Đổi ngay
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {booking.station?.address || 'N/A'}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          <Car className="inline h-4 w-4 mr-1" />
                          {booking.vehicle?.make} {booking.vehicle?.model} ({booking.vehicle?.license_plate})
                        </p>
                        <p className="text-xs text-slate-500">
                          Mã đặt chỗ: {booking.booking_code}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Ngày hẹn</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {scheduledDate.toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Giờ hẹn</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {scheduledDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Loại pin</p>
                        <p className="font-medium text-slate-900 dark:text-white">{booking.battery_model}</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="glass border-blue-200/50 dark:border-purple-400/30">
                        Chi tiết
                      </Button>
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="glass border-red-200/50 dark:border-red-400/30 hover:bg-red-50/50 dark:hover:bg-red-500/10"
                          onClick={() => handleCancelBooking(booking.booking_id)}
                        >
                          Hủy đặt chỗ
                        </Button>
                      )}
                    </div>
                  </div>

                  {booking.transaction && booking.transaction.swap_duration_minutes && (
                    <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-slate-600 dark:text-slate-400">
                          <Clock className="h-4 w-4 mr-1" />
                          Thời gian thay: {booking.transaction.swap_duration_minutes} phút
                        </div>
                        {booking.transaction.swap_completed_at && (
                          <div className="flex items-center text-slate-600 dark:text-slate-400">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Hoàn thành lúc: {new Date(booking.transaction.swap_completed_at).toLocaleString('vi-VN')}
                          </div>
                        )}
                      </div>
                      {booking.transaction.amount && (
                        <div className="text-slate-900 dark:text-white font-medium">
                          {Number(booking.transaction.amount).toLocaleString('vi-VN')} VNĐ
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredBookings.length === 0 && (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Không tìm thấy đặt chỗ</h3>
            <p className="text-slate-600 dark:text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookingHistory;