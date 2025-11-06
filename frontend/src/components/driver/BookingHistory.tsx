import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  Package,
  Zap
} from 'lucide-react';
import API_ENDPOINTS, { fetchWithAuth } from '../../config/api';

interface BookingItem {
  booking_id: string;
  booking_code: string;
  scheduled_at: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  station?: { name: string; address: string };
  vehicle?: { license_plate: string; vehicle_type: string; model?: string };
  transaction?: { 
    amount?: number; 
    payment_status?: string;
  };
}

const BookingHistory: React.FC = () => {
  const location = useLocation();
  const highlightBookingIdRef = useRef<string | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BookingItem['status']>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);
  const [limit] = useState(10); // Số đơn mỗi trang
  const [activeSubscription, setActiveSubscription] = useState<any|null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'pending':
      case 'confirmed':
      case 'in_progress':
      default: return <AlertCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50/80 dark:bg-green-500/10 text-green-800 dark:text-green-400 border-green-200/50 dark:border-green-500/20';
      case 'cancelled': return 'bg-red-50/80 dark:bg-red-500/10 text-red-800 dark:text-red-400 border-red-200/50 dark:border-red-500/20';
      case 'pending':
      case 'confirmed':
      case 'in_progress': return 'bg-blue-50/80 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20';
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

  // Load subscription hiện tại để check gói dịch vụ
  const loadActiveSubscription = async () => {
    try {
      const url = new URL(API_ENDPOINTS.SUBSCRIPTIONS.BASE);
      url.searchParams.set('status', 'active');
      const res = await fetchWithAuth(url.toString());
      const data = await res.json();
      if (res.ok && data.success) {
        const subscriptions = data.data.subscriptions || data.data || [];
        const activeSub = subscriptions.find((sub: any) => {
          const now = new Date();
          const endDate = new Date(sub.end_date);
          // TODO: BE chưa tự động update status = "expired"
          const isStillValid = sub.status === 'active' && 
                              endDate >= now && 
                              (sub.remaining_swaps === null || sub.remaining_swaps > 0);
          return isStillValid;
        });
        setActiveSubscription(activeSub || null);
      }
    } catch (e) {
      // Không có subscription - không ảnh hưởng
      console.log('No active subscription:', e);
    }
  };

  const loadBookings = async (page: number = currentPage) => {
    setLoading(true);
    setError('');
    try {
      const url = new URL(API_ENDPOINTS.DRIVER.BOOKINGS);
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', limit.toString());
      const res = await fetchWithAuth(url.toString());
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Tải lịch sử đặt chỗ thất bại');
      const items: BookingItem[] = data.data.bookings || data.data || [];
      setBookings(items);
      // Cập nhật thông tin pagination từ response
      if (data.data.pagination) {
        setTotalPages(data.data.pagination.pages || 1);
        setTotalBookingsCount(data.data.pagination.total || 0);
      }
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra booking có sử dụng gói dịch vụ không
  const isUsingSubscription = (booking: BookingItem): boolean => {
    // Chỉ check khi booking đã completed
    // BE tự động set amount = 0 nếu có subscription hợp lệ
    if (booking.status === 'completed' && 
        booking.transaction?.amount === 0 && 
        booking.transaction?.payment_status === 'completed') {
      return true;
    }
    return false;
  };

  // Lấy payment status text để hiển thị
  const getPaymentStatusText = (booking: BookingItem): { text: string; color: string } => {
    if (booking.status === 'completed') {
      // Đã complete → Đã thanh toán
      if (isUsingSubscription(booking)) {
        return { text: 'Miễn phí (gói dịch vụ)', color: 'text-green-600 dark:text-green-400' };
      }
      if (booking.transaction?.amount) {
        return { 
          text: `Đã thanh toán ${Number(booking.transaction.amount).toLocaleString('vi-VN')} đ`, 
          color: 'text-slate-900 dark:text-white' 
        };
      }
      return { text: 'Đã thanh toán', color: 'text-slate-900 dark:text-white' };
    }
    if (booking.status === 'cancelled') {
      return { text: 'Đã hủy', color: 'text-red-600 dark:text-red-400' };
    }
    // pending, confirmed → Chưa thanh toán
    return { text: 'Chưa thanh toán', color: 'text-slate-600 dark:text-slate-400' };
  };

  const cancelBooking = async (id: string, scheduledAt: string) => {
    // Check thời gian: Nếu < 15 phút trước giờ hẹn → Không cho hủy
    const scheduledTime = new Date(scheduledAt);
    const now = new Date();
    const minutesUntilScheduled = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
    
    if (minutesUntilScheduled < 15 && minutesUntilScheduled > 0) {
      setError('Không thể hủy đặt chỗ trong vòng 15 phút trước giờ hẹn. Vui lòng liên hệ nhân viên trạm.');
      return;
    }

    if (!confirm('Bạn có chắc muốn hủy đặt chỗ này?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`${API_ENDPOINTS.DRIVER.BOOKINGS}/${id}/cancel`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Xử lý error từ BE
        if (data.message?.includes('Cannot cancel booking within 15 minutes')) {
          throw new Error('Không thể hủy đặt chỗ trong vòng 15 phút trước giờ hẹn. Vui lòng liên hệ nhân viên trạm.');
        }
        throw new Error(data.message || 'Hủy đặt chỗ thất bại');
      }
      await loadBookings();
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Nhận highlightBookingId từ location.state (khi navigate từ notification)
  useEffect(() => {
    const state = location.state as { highlightBookingId?: string } | null;
    if (state?.highlightBookingId) {
      highlightBookingIdRef.current = state.highlightBookingId;
      // Clear state để tránh highlight lại khi refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Scroll và highlight booking khi đã load xong
  useEffect(() => {
    if (highlightBookingIdRef.current && bookings.length > 0) {
      const bookingId = highlightBookingIdRef.current;
      // Tìm booking trong list (có thể là booking_id hoặc booking_code)
      const booking = bookings.find(
        b => b.booking_id === bookingId || b.booking_code === bookingId
      );
      
      if (booking) {
        // Scroll đến booking card
        setTimeout(() => {
          const element = document.getElementById(`booking-${booking.booking_id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight animation
            element.classList.add('animate-pulse');
            setTimeout(() => {
              element.classList.remove('animate-pulse');
            }, 2000);
          }
        }, 300);
      }
      // Clear ref sau khi đã highlight
      highlightBookingIdRef.current = null;
    }
  }, [bookings]);

  useEffect(() => { 
    // Reset về trang 1 khi filter thay đổi
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    // Load subscription và bookings khi trang hoặc filter thay đổi
    loadActiveSubscription();
    loadBookings(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter]);

  const filteredBookings = bookings.filter(booking => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = (booking.station?.name || '').toLowerCase().includes(s) ||
                          (booking.vehicle?.model || '').toLowerCase().includes(s) ||
                          (booking.booking_code || '').toLowerCase().includes(s);
    return matchesSearch;
  });

  const totalBookings = totalBookingsCount; // Sử dụng total từ pagination thay vì length
  const completedBookings = bookings.filter(b => b.status === 'completed').length; // Chỉ đếm trong trang hiện tại
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const exportConfirmationVoucher = (booking: BookingItem) => {
    // Tạo Confirmation Voucher - Phiếu xác nhận đặt chỗ để xuất trình tại trạm
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Phiếu xác nhận đặt chỗ - ${booking.booking_code}</title>
          <style>
            @media print {
              body { margin: 0; padding: 10px; }
              .no-print { display: none; }
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 20px;
              max-width: 600px;
              margin: 0 auto;
              background: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #3b82f6;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #1e40af;
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            .booking-code-box {
              background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
              color: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .booking-code-label {
              font-size: 14px;
              opacity: 0.9;
              margin-bottom: 8px;
            }
            .booking-code {
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 3px;
              font-family: 'Courier New', monospace;
            }
            .status-badge {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              margin-top: 10px;
              background: #10b981;
              color: white;
            }
            .section {
              margin: 20px 0;
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
            }
            .section h3 {
              margin: 0 0 12px 0;
              color: #1e40af;
              font-size: 16px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #475569;
              min-width: 120px;
            }
            .value {
              color: #1e293b;
              text-align: right;
              flex: 1;
            }
            .notice {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 6px;
              font-size: 13px;
              color: #92400e;
            }
            .notice strong {
              display: block;
              margin-bottom: 5px;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px dashed #cbd5e1;
              font-size: 11px;
              color: #64748b;
            }
            .qr-placeholder {
              text-align: center;
              margin: 20px 0;
              padding: 20px;
              background: #f1f5f9;
              border-radius: 8px;
            }
            .no-print {
              text-align: center;
              margin: 20px 0;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PHIẾU XÁC NHẬN ĐẶT CHỖ</h1>
            <div class="booking-code-box">
              <div class="booking-code-label">MÃ ĐƠN HÀNG</div>
              <div class="booking-code">${booking.booking_code}</div>
            </div>
            <div class="status-badge">${getStatusLabel(booking.status)}</div>
          </div>
          
          <div class="section">
            <h3>📍 Thông tin trạm</h3>
            <div class="info-row">
              <span class="label">Tên trạm:</span>
              <span class="value">${booking.station?.name || '—'}</span>
            </div>
            <div class="info-row">
              <span class="label">Địa chỉ:</span>
              <span class="value">${booking.station?.address || '—'}</span>
            </div>
          </div>

          <div class="section">
            <h3>🚗 Thông tin xe</h3>
            <div class="info-row">
              <span class="label">Biển số:</span>
              <span class="value">${booking.vehicle?.license_plate || '—'}</span>
            </div>
            <div class="info-row">
              <span class="label">Loại xe:</span>
              <span class="value">${booking.vehicle?.vehicle_type || '—'}</span>
            </div>
            ${booking.vehicle?.model ? `
            <div class="info-row">
              <span class="label">Model:</span>
              <span class="value">${booking.vehicle.model}</span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <h3>📅 Thời gian</h3>
            <div class="info-row">
              <span class="label">Ngày đặt:</span>
              <span class="value">${new Date(booking.scheduled_at).toLocaleDateString('vi-VN')}</span>
            </div>
            <div class="info-row">
              <span class="label">Giờ đặt:</span>
              <span class="value">${new Date(booking.scheduled_at).toLocaleTimeString('vi-VN')}</span>
            </div>
          </div>

          <div class="notice">
            <strong>⚠️ LƯU Ý QUAN TRỌNG</strong>
            Vui lòng xuất trình <strong>MÃ ĐƠN HÀNG: ${booking.booking_code}</strong> khi đến trạm để nhân viên xác thực và thực hiện đổi pin.
            <br><br>
            Phiếu này có thể được lưu dưới dạng ảnh hoặc in ra để sử dụng khi không có internet.
          </div>

          <div class="footer">
            <div>Xuất ngày: ${new Date().toLocaleString('vi-VN')}</div>
            <div style="margin-top: 5px;">EVSwap - Hệ thống đổi pin xe điện</div>
          </div>

          <div class="no-print">
            <p>Đang mở hộp thoại in... Nếu không tự động mở, vui lòng nhấn Ctrl+P (Windows) hoặc Cmd+P (Mac)</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">Lịch sử Thay pin</h1>
          <p className="text-slate-600 dark:text-slate-300">Xem lịch sử và chi tiết các lần thay pin</p>
        </div>
        <Button className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300" onClick={() => loadBookings(currentPage)} disabled={loading}>
          <Download className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-500/10 p-3 rounded-lg border border-red-200/50 dark:border-red-500/20">
          {error}
        </div>
      )}

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
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full md:w-48 glass border-slate-200/50 dark:border-slate-700/50">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="glass-card border-0">
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="pending">Chờ xác nhận</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredBookings.map((booking) => {
          const isHighlighted = highlightBookingIdRef.current && 
            (booking.booking_id === highlightBookingIdRef.current || 
             booking.booking_code === highlightBookingIdRef.current);
          return (
          <Card 
            key={booking.booking_id} 
            id={`booking-${booking.booking_id}`}
            className={`glass-card border-0 glow-hover transition-all duration-300 ${
              isHighlighted 
                ? 'ring-4 ring-blue-500 dark:ring-blue-400 shadow-2xl bg-blue-50/50 dark:bg-blue-900/20' 
                : ''
            }`}
          >
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="p-3 gradient-primary rounded-lg shadow-lg">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{booking.station?.name || '—'}</h3>
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1">{getStatusLabel(booking.status)}</span>
                      </Badge>
                      {isUsingSubscription(booking) && (
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">
                          <Package className="h-3 w-3 mr-1" />
                          <Zap className="h-3 w-3 mr-1" />
                          Miễn phí - Gói dịch vụ
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{booking.station?.address || '—'}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <Car className="inline h-4 w-4 mr-1" />
                      {booking.vehicle?.license_plate} {booking.vehicle?.model ? `(${booking.vehicle.model})` : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Ngày đặt</p>
                    <p className="font-medium text-slate-900 dark:text-white">{new Date(booking.scheduled_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Giờ</p>
                    <p className="font-medium text-slate-900 dark:text-white">{new Date(booking.scheduled_at).toLocaleTimeString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Thanh toán</p>
                    <p className={`font-medium ${getPaymentStatusText(booking).color}`}>
                      {getPaymentStatusText(booking).text}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Mã</p>
                    <p className="font-medium text-slate-900 dark:text-white">{booking.booking_code}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-blue-500 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => exportConfirmationVoucher(booking)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Xuất phiếu xác nhận
                    </Button>
                  )}
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="glass border-red-200/50 dark:border-red-400/30 hover:bg-red-50/50 dark:hover:bg-red-500/10" 
                      onClick={() => cancelBooking(booking.booking_id, booking.scheduled_at)} 
                      disabled={loading}
                    >
                      Hủy đặt chỗ
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {filteredBookings.length === 0 && !loading && (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Không tìm thấy đặt chỗ</h3>
            <p className="text-slate-600 dark:text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && filteredBookings.length > 0 && (
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Trang {currentPage} / {totalPages} • Tổng {totalBookingsCount} đơn
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loading}
                  className="glass border-slate-200/50 dark:border-slate-700/50"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || loading}
                  className="glass border-slate-200/50 dark:border-slate-700/50"
                >
                  Sau
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookingHistory;