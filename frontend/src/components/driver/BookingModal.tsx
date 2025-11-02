import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Calendar, Clock, Car, AlertCircle } from 'lucide-react';
import { bookingService } from '../../services/booking.service';
import { vehicleService, Vehicle } from '../../services/vehicle.service';

interface Station {
  station_id: string;
  name: string;
  address: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: Station;
  onSuccess?: (booking: any) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, station, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [bookingType, setBookingType] = useState<'scheduled' | 'instant'>('scheduled');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    vehicle_id: '',
    battery_model: '',
    scheduled_at: '',
    notes: '',
  });

  // Lấy danh sách xe của người dùng
  useEffect(() => {
    if (isOpen) {
      loadVehicles();
    }
  }, [isOpen]);

  const loadVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const vehicleList = await vehicleService.getVehicles();
      setVehicles(vehicleList);
      
      // Tự động chọn xe đầu tiên nếu có
      if (vehicleList.length > 0) {
        setFormData(prev => ({
          ...prev,
          vehicle_id: vehicleList[0].vehicle_id,
          battery_model: vehicleList[0].battery_model || '',
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách xe');
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Cập nhật battery_model khi chọn xe khác
  const handleVehicleChange = (vehicleId: string) => {
    const selectedVehicle = vehicles.find(v => v.vehicle_id === vehicleId);
    setFormData(prev => ({
      ...prev,
      vehicle_id: vehicleId,
      battery_model: selectedVehicle?.battery_model || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!formData.vehicle_id) {
        throw new Error('Vui lòng chọn xe');
      }

      if (!formData.battery_model || formData.battery_model.trim() === '') {
        throw new Error('Loại pin không được để trống. Vui lòng cập nhật thông tin xe trước khi đặt chỗ.');
      }

      let booking;

      if (bookingType === 'instant') {
        // Đặt chỗ đổi pin ngay
        const bookingData = {
          vehicle_id: formData.vehicle_id,
          station_id: station.station_id,
          battery_model: formData.battery_model.trim(),
          notes: formData.notes || undefined,
        };
        
        console.log('Creating instant booking:', bookingData);
        booking = await bookingService.createInstantBooking(bookingData);
        setSuccess('Đã đặt chỗ đổi pin ngay thành công! Pin đã được tạm giữ trong 15 phút.');
      } else {
        // Đặt lịch hẹn
        if (!formData.scheduled_at) {
          throw new Error('Vui lòng chọn thời gian hẹn');
        }

        // Convert datetime-local to ISO string
        const scheduledDate = new Date(formData.scheduled_at);
        if (isNaN(scheduledDate.getTime())) {
          throw new Error('Thời gian hẹn không hợp lệ');
        }

        const bookingData = {
          vehicle_id: formData.vehicle_id,
          station_id: station.station_id,
          battery_model: formData.battery_model.trim(),
          scheduled_at: scheduledDate.toISOString(),
          notes: formData.notes || undefined,
        };

        console.log('Creating scheduled booking:', bookingData);
        booking = await bookingService.createBooking(bookingData);
        setSuccess('Đã đặt lịch hẹn thành công!');
      }

      // Gọi callback onSuccess nếu có
      if (onSuccess) {
        onSuccess(booking);
      }

      // Đóng modal sau 2 giây
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Không thể tạo đặt chỗ');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: vehicles.length > 0 ? vehicles[0].vehicle_id : '',
      battery_model: vehicles.length > 0 ? vehicles[0].battery_model || '' : '',
      scheduled_at: '',
      notes: '',
    });
    setError(null);
    setSuccess(null);
    setBookingType('scheduled');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Tính thời gian tối thiểu (30 phút từ bây giờ)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString().slice(0, 16);
  };

  // Tính thời gian tối đa (12 giờ từ bây giờ)
  const getMaxDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 12);
    return now.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-0 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
            Đặt chỗ thay pin
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            {station.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Loại đặt chỗ */}
          <div className="space-y-2">
            <Label>Loại đặt chỗ</Label>
            <Select value={bookingType} onValueChange={(value: 'scheduled' | 'instant') => setBookingType(value)}>
              <SelectTrigger className="glass border-slate-200/50 dark:border-slate-700/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-0">
                <SelectItem value="scheduled">Đặt lịch hẹn</SelectItem>
                <SelectItem value="instant">Đổi pin ngay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chọn xe */}
          <div className="space-y-2">
            <Label htmlFor="vehicle">
              <Car className="inline h-4 w-4 mr-1" />
              Chọn xe
            </Label>
            {loadingVehicles ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </div>
            ) : vehicles.length === 0 ? (
              <Alert className="border-orange-200 bg-orange-50/50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Bạn chưa có xe nào. Vui lòng thêm xe trước khi đặt chỗ.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Select value={formData.vehicle_id} onValueChange={handleVehicleChange}>
                  <SelectTrigger className="glass border-slate-200/50 dark:border-slate-700/50">
                    <SelectValue placeholder="Chọn xe" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-0">
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                        {vehicle.license_plate} - {vehicle.make || vehicle.brand} {vehicle.model}
                        {!vehicle.battery_model && <span className="text-red-500 ml-2">(Thiếu loại pin)</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.vehicle_id && !formData.battery_model && (
                  <Alert className="border-orange-200 bg-orange-50/50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      Xe này chưa có thông tin loại pin. Vui lòng cập nhật thông tin xe hoặc nhập loại pin bên dưới.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>

          {/* Loại pin */}
          <div className="space-y-2">
            <Label htmlFor="battery_model">
              Loại pin <span className="text-red-500">*</span>
            </Label>
            <Input
              id="battery_model"
              value={formData.battery_model}
              onChange={(e) => setFormData({ ...formData, battery_model: e.target.value })}
              placeholder="VD: Standard 60kWh, Long Range 100kWh"
              className="glass border-slate-200/50 dark:border-slate-700/50"
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Loại pin sẽ tự động điền từ thông tin xe. Bạn có thể chỉnh sửa nếu cần.
            </p>
          </div>

          {/* Thời gian hẹn (chỉ hiện khi đặt lịch) */}
          {bookingType === 'scheduled' && (
            <div className="space-y-2">
              <Label htmlFor="scheduled_at">
                <Calendar className="inline h-4 w-4 mr-1" />
                Thời gian hẹn
              </Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                min={getMinDateTime()}
                max={getMaxDateTime()}
                className="glass border-slate-200/50 dark:border-slate-700/50"
                required
              />
              <p className="text-xs text-slate-500">
                <Clock className="inline h-3 w-3 mr-1" />
                Vui lòng đặt lịch từ 30 phút đến 12 giờ kể từ bây giờ
              </p>
            </div>
          )}

          {/* Ghi chú */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Thêm ghi chú..."
              className="glass border-slate-200/50 dark:border-slate-700/50"
              rows={3}
            />
          </div>

          {/* Thông báo lỗi/thành công */}
          {error && (
            <Alert className="border-red-200 bg-red-50/50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50/50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="glass border-slate-200/50 dark:border-slate-700/50"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading || vehicles.length === 0}
              className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận đặt chỗ'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;

