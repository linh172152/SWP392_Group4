import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
  Download
} from 'lucide-react';

// Dữ liệu lịch sử thay pin
const mockBookings = [
  {
    id: 'BK001',
    stationName: 'Trung tâm EV Thành phố',
    address: '123 Đường Chính, Quận 1',
    bookingDate: '2024-01-15',
    bookingTime: '14:30',
    vehicleInfo: 'Tesla Model 3 (VIN: 5YJ3E1EA...)',
    batteryType: 'Tiêu chuẩn',
    status: 'completed',
    duration: '2.5 phút',
    cost: 25.50,
    completedAt: '14:32'
  },
  {
    id: 'BK002',
    stationName: 'Trạm Trung tâm Thương mại',
    address: '456 Đại lộ Mua sắm',
    bookingDate: '2024-01-12',
    bookingTime: '09:15',
    vehicleInfo: 'BYD Tang EV (VIN: 2BYD5EA8...)',
    batteryType: 'Tầm xa',
    status: 'completed',
    duration: '3.1 phút',
    cost: 35.75,
    completedAt: '09:18'
  },
  {
    id: 'BK003',
    stationName: 'Trạm Nghỉ Cao tốc',
    address: 'Cao tốc A1 hướng Bắc Km 42',
    bookingDate: '2024-01-08',
    bookingTime: '16:45',
    vehicleInfo: 'Tesla Model 3 (VIN: 5YJ3E1EA...)',
    batteryType: 'Tiêu chuẩn',
    status: 'cancelled',
    duration: null,
    cost: 0,
    completedAt: null
  },
  {
    id: 'BK004',
    stationName: 'Trung tâm EV Thành phố',
    address: '123 Đường Chính, Quận 1',
    bookingDate: '2024-01-20',
    bookingTime: '11:00',
    vehicleInfo: 'Tesla Model 3 (VIN: 5YJ3E1EA...)',
    batteryType: 'Tiêu chuẩn',
    status: 'scheduled',
    duration: null,
    cost: 25.50,
    completedAt: null
  }
];

const BookingHistory: React.FC = () => {
  const [bookings, setBookings] = useState(mockBookings);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'scheduled': return <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      default: return <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50/80 dark:bg-green-500/10 text-green-800 dark:text-green-400 border-green-200/50 dark:border-green-500/20';
      case 'cancelled': return 'bg-red-50/80 dark:bg-red-500/10 text-red-800 dark:text-red-400 border-red-200/50 dark:border-red-500/20';
      case 'scheduled': return 'bg-blue-50/80 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20';
      default: return 'bg-slate-50/80 dark:bg-slate-500/10 text-slate-800 dark:text-slate-400 border-slate-200/50 dark:border-slate-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'scheduled': return 'Đã lên lịch';
      default: return status;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          booking.vehicleInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBookings = bookings.length;
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
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Booking List */}
      <div className="space-y-4">
        {filteredBookings.map((booking) => (
          <Card key={booking.id} className="glass-card border-0 glow-hover">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="p-3 gradient-primary rounded-lg shadow-lg">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{booking.stationName}</h3>
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1">{getStatusLabel(booking.status)}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{booking.address}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <Car className="inline h-4 w-4 mr-1" />
                      {booking.vehicleInfo}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Ngày đặt</p>
                    <p className="font-medium text-slate-900 dark:text-white">{booking.bookingDate}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Giờ đặt</p>
                    <p className="font-medium text-slate-900 dark:text-white">{booking.bookingTime}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Loại pin</p>
                    <p className="font-medium text-slate-900 dark:text-white">{booking.batteryType}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Chi phí</p>
                    <p className="font-medium text-slate-900 dark:text-white">${booking.cost.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="glass border-blue-200/50 dark:border-purple-400/30">
                    Chi tiết
                  </Button>
                  {booking.status === 'scheduled' && (
                    <Button variant="outline" size="sm" className="glass border-red-200/50 dark:border-red-400/30 hover:bg-red-50/50 dark:hover:bg-red-500/10">
                      Hủy đặt chỗ
                    </Button>
                  )}
                </div>
              </div>

              {booking.duration && (
                <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                      <Clock className="h-4 w-4 mr-1" />
                      Thời gian thay: {booking.duration}
                    </div>
                    {booking.completedAt && (
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Hoàn thành lúc: {booking.completedAt}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

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