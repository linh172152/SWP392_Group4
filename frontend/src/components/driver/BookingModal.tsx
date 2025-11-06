import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Loader2, 
  Calendar, 
  Clock, 
  Car, 
  AlertCircle, 
  Battery, 
  Check, 
  Zap, 
  ArrowLeft, 
  MapPin, 
  Star
} from 'lucide-react';
import { bookingService } from '../../services/booking.service';
import { vehicleService } from '../../services/vehicle.service';
import type { Vehicle } from '../../services/vehicle.service';
import { driverStationService } from '../../services/driver-station.service';
import type { Station } from '../../services/driver-station.service';
import { 
  getBatteryModelStats, 
  getCompatibleBatteryModels, 
  getCompatibleVehicles 
} from '../../utils/batteryModelUtils';
import { getBatteryPricing } from '../../services/battery-pricing.service';
import type { BatteryPricing } from '../../services/battery-pricing.service';

interface StationBasic {
  station_id: string;
  name: string;
  address: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: StationBasic;
  onSuccess?: (booking: any) => void;
}

interface BatteryTypeInfo {
  model: string;
  capacity: number | null;
  available: number;
  total: number;
  price: number;
  compatibleVehicles: Vehicle[];
}

const SERVICE_FEE = 20000; // Phí dịch vụ 20.000đ

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, station, onSuccess }) => {
  // State quản lý loading
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingStation, setLoadingStation] = useState(false);
  const [loadingPricing, setLoadingPricing] = useState(false);
  
  // State data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stationDetails, setStationDetails] = useState<Station | null>(null);
  const [pricingList, setPricingList] = useState<BatteryPricing[]>([]);
  
  // State form
  const [selectedBatteryType, setSelectedBatteryType] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [customTime, setCustomTime] = useState<string>('');
  
  // State messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset state khi đóng modal
  const handleClose = () => {
    // Reset tất cả state
    setSelectedBatteryType('');
    setSelectedVehicleId('');
    setSelectedTimeSlot('');
    setCustomTime('');
    setError(null);
    setSuccess(null);
    setStationDetails(null);
    // Không set lại vehicles và pricingList vì có thể tái sử dụng
    onClose();
  };

  // Load data khi mở modal
  useEffect(() => {
    if (isOpen) {
      // Reset state khi mở modal
      setError(null);
      setSuccess(null);
      setSelectedBatteryType('');
      setSelectedVehicleId('');
      setSelectedTimeSlot('');
      setCustomTime('');
      
      // Load data
      loadAllData();
    }
  }, [isOpen, station.station_id]);

  // Auto-select battery type và vehicle khi có data
  useEffect(() => {
    if (stationDetails && vehicles.length > 0 && pricingList.length > 0 && !selectedBatteryType) {
      const compatibleBatteries = getCompatibleBatteryTypes();
      if (compatibleBatteries.length > 0) {
        const firstBattery = compatibleBatteries[0];
        setSelectedBatteryType(firstBattery.model);
        // Auto-select vehicle tương thích đầu tiên
        if (firstBattery.compatibleVehicles.length > 0) {
          setSelectedVehicleId(firstBattery.compatibleVehicles[0].vehicle_id);
        }
      }
    }
  }, [stationDetails, vehicles, pricingList, selectedBatteryType]);

  const loadAllData = async () => {
    try {
      await Promise.all([
        loadVehicles(),
        loadStationDetails(),
        loadPricing()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      // Không set error ở đây để tránh hiện lỗi khi đóng modal
    }
  };

  const loadVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const vehicleList = await vehicleService.getVehicles();
      setVehicles(vehicleList);
    } catch (err: any) {
      console.error('Error loading vehicles:', err);
      // Chỉ set error nếu modal vẫn đang mở
      if (isOpen) {
        setError(err.message || 'Không thể tải danh sách xe');
      }
    } finally {
      setLoadingVehicles(false);
    }
  };

  const loadStationDetails = async () => {
    setLoadingStation(true);
    try {
      const details = await driverStationService.getPublicStationDetails(station.station_id);
      setStationDetails(details);
    } catch (err: any) {
      console.error('Error loading station details:', err);
      // Chỉ set error nếu modal vẫn đang mở
      if (isOpen) {
        setError('Không thể tải thông tin trạm');
      }
    } finally {
      setLoadingStation(false);
    }
  };

  const loadPricing = async () => {
    setLoadingPricing(true);
    try {
      const response = await getBatteryPricing({ is_active: true, limit: 100 });
      setPricingList(response.data.pricings);
    } catch (err: any) {
      console.error('Error loading pricing:', err);
      // Không block nếu không load được pricing, sẽ dùng giá mặc định
    } finally {
      setLoadingPricing(false);
    }
  };

  // Lấy thông tin các loại pin tương thích
  const getCompatibleBatteryTypes = (): BatteryTypeInfo[] => {
    if (!stationDetails || vehicles.length === 0) return [];

    const compatibleModels = getCompatibleBatteryModels(stationDetails, vehicles);
    const batteryStats = getBatteryModelStats(stationDetails);
    
    return compatibleModels.map(model => {
      const stats = batteryStats[model] || { available: 0, total: 0 };
      
      // Tìm pricing cho model này
      const pricing = pricingList.find(p => {
        const pModel = p.battery_model.toLowerCase().trim();
        const bModel = model.toLowerCase().trim();
        return pModel === bModel || 
               pModel === `${bModel} battery` ||
               bModel === `${pModel} battery`;
      });
      
      // Lấy capacity từ battery đầu tiên của model này
      const battery = stationDetails.batteries?.find(b => b.model === model);
      const capacity = battery?.capacity_kwh ? Number(battery.capacity_kwh) : null;
      
      return {
        model,
        capacity,
        available: stats.available,
        total: stats.total,
        price: pricing?.price || 0,
        compatibleVehicles: getCompatibleVehicles(model, vehicles),
      };
    }).filter(b => b.available > 0); // Chỉ hiện pin có sẵn
  };

  const compatibleBatteryTypes = getCompatibleBatteryTypes();
  const selectedBatteryInfo = compatibleBatteryTypes.find(b => b.model === selectedBatteryType);
  const compatibleVehiclesForSelected = selectedBatteryInfo?.compatibleVehicles || [];

  // Tính giá
  const batteryPrice = selectedBatteryInfo?.price || 0;
  const totalPrice = batteryPrice + SERVICE_FEE;

  // Xử lý chọn battery type
  const handleBatteryTypeSelect = (model: string) => {
    setSelectedBatteryType(model);
    // Auto-select vehicle tương thích đầu tiên
    const batteryInfo = compatibleBatteryTypes.find(b => b.model === model);
    if (batteryInfo && batteryInfo.compatibleVehicles.length > 0) {
      setSelectedVehicleId(batteryInfo.compatibleVehicles[0].vehicle_id);
    } else {
      setSelectedVehicleId('');
    }
  };

  // Tạo time slots
  const getTimeSlots = () => {
    const slots = [];
    const now = new Date();
    
    // "Ngay bây giờ" - instant booking
    slots.push({
      label: 'Ngay bây giờ',
      subLabel: 'Trong 15 phút',
      value: 'instant',
      time: null,
    });
    
    // 30 phút, 1h, 2h, 3h
    for (let i = 1; i <= 4; i++) {
      const time = new Date(now.getTime() + i * 30 * 60 * 1000);
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      
      let label = '';
      if (i === 1) label = '30 phút nữa';
      else if (i === 2) label = '1 giờ nữa';
      else if (i === 3) label = '2 giờ nữa';
      else label = '3 giờ nữa';
      
      slots.push({
        label,
        subLabel: `${hours}:${minutes}`,
        value: time.toISOString(),
        time,
      });
    }
    
    return slots;
  };

  const timeSlots = getTimeSlots();

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!selectedBatteryType) {
        throw new Error('Vui lòng chọn loại pin');
      }

      if (!selectedVehicleId) {
        throw new Error('Vui lòng chọn xe');
      }

      let booking;
      const bookingData = {
        vehicle_id: selectedVehicleId,
        station_id: station.station_id,
        battery_model: selectedBatteryType.trim(),
        notes: undefined,
      };

      if (selectedTimeSlot === 'instant') {
        // Đặt chỗ đổi pin ngay
        booking = await bookingService.createInstantBooking(bookingData);
        setSuccess('Đã đặt chỗ đổi pin ngay thành công! Pin đã được tạm giữ trong 15 phút.');
      } else if (selectedTimeSlot && selectedTimeSlot !== 'instant') {
        // Đặt lịch hẹn với time slot
        const scheduledDate = new Date(selectedTimeSlot);
        if (isNaN(scheduledDate.getTime())) {
          throw new Error('Thời gian hẹn không hợp lệ');
        }
        booking = await bookingService.createBooking({
          ...bookingData,
          scheduled_at: scheduledDate.toISOString(),
        });
        setSuccess('Đã đặt lịch hẹn thành công!');
      } else if (customTime) {
        // Đặt lịch hẹn với custom time
        const scheduledDate = new Date(customTime);
        if (isNaN(scheduledDate.getTime())) {
          throw new Error('Thời gian hẹn không hợp lệ');
        }
        booking = await bookingService.createBooking({
          ...bookingData,
          scheduled_at: scheduledDate.toISOString(),
        });
        setSuccess('Đã đặt lịch hẹn thành công!');
      } else {
        throw new Error('Vui lòng chọn thời gian');
      }

      if (onSuccess) {
        onSuccess(booking);
      }

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Không thể tạo đặt chỗ');
    } finally {
      setLoading(false);
    }
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

  const isLoading = loadingVehicles || loadingStation || loadingPricing;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-0 !w-[90vw] !max-w-[1400px] !h-[85vh] !max-h-[85vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-4 p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
                Đặt chỗ thay pin
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Chọn loại pin và thời gian
              </p>
            </div>
          </div>

          {/* Station Info */}
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white">{station.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{station.address}</p>
                {stationDetails && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {stationDetails.average_rating?.toFixed(1) || 'N/A'}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({stationDetails.total_ratings || 0} đánh giá)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - 2 Panes */}
          <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full min-h-0">
              {/* Left Pane: Battery Selection */}
              <div className="p-8 border-r border-slate-200/50 dark:border-slate-700/50 overflow-y-auto overflow-x-hidden h-full max-h-full scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 dark:scrollbar-thumb-slate-600 dark:scrollbar-track-slate-800">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : compatibleBatteryTypes.length === 0 ? (
                  <Alert className="border-orange-200 bg-orange-50/50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      {vehicles.length === 0
                        ? 'Bạn chưa có xe nào. Vui lòng thêm xe trước khi đặt chỗ.'
                        : 'Trạm này không có loại pin phù hợp với xe của bạn. Vui lòng chọn trạm khác.'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {/* Battery Selection */}
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        Chọn loại pin
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Chọn loại pin phù hợp với xe và nhu cầu của bạn
                      </p>
                    </div>

                    <div className="space-y-5 mb-8">
                      {compatibleBatteryTypes.map((batteryType) => {
                        const isSelected = selectedBatteryType === batteryType.model;
                        const range = batteryType.capacity ? Math.round(batteryType.capacity * 6.25) : null;
                        
                        return (
                          <button
                            key={batteryType.model}
                            type="button"
                            onClick={() => handleBatteryTypeSelect(batteryType.model)}
                            className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                              isSelected
                                ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                <h4 className="font-semibold text-slate-900 dark:text-white">
                                  {batteryType.model}
                                </h4>
                              </div>
                              <div className="text-right">
                                <div className={`font-bold text-green-600 ${
                                  batteryType.price > 0 ? 'text-2xl' : 'text-base'
                                }`}>
                                  {batteryType.price > 0
                                    ? `${batteryType.price.toLocaleString('vi-VN')}₫`
                                    : 'Liên hệ'}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              {batteryType.capacity && (
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Dung lượng</p>
                                  <p className="font-medium text-slate-900 dark:text-white">
                                    {batteryType.capacity} kWh
                                  </p>
                                </div>
                              )}
                              {range && (
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Tầm hoạt động</p>
                                  <p className="font-medium text-slate-900 dark:text-white">{range} km</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Thời gian thay</p>
                                <p className="font-medium text-slate-900 dark:text-white">2-3 phút</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Pin khả dụng</p>
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {batteryType.available} pin
                                </p>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                Xe tương thích
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {batteryType.compatibleVehicles.slice(0, 3).map((vehicle) => (
                                  <span
                                    key={vehicle.vehicle_id}
                                    className="px-2 py-1 text-xs rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                                  >
                                    {vehicle.make || vehicle.brand} {vehicle.model}
                                  </span>
                                ))}
                                {batteryType.compatibleVehicles.length > 3 && (
                                  <span className="px-2 py-1 text-xs rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                                    +{batteryType.compatibleVehicles.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Vehicle Selection */}
                    {selectedBatteryType && compatibleVehiclesForSelected.length > 0 && (
                      <div className="mb-8">
                        <Label htmlFor="vehicle" className="mb-3 block text-base">
                          <Car className="inline h-5 w-5 mr-1" />
                          Chọn xe
                        </Label>
                        <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                          <SelectTrigger className="glass border-slate-200/50 dark:border-slate-700/50">
                            <SelectValue placeholder="Chọn xe" />
                          </SelectTrigger>
                          <SelectContent className="glass-card border-0">
                            {compatibleVehiclesForSelected.map((vehicle) => (
                              <SelectItem key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                                {vehicle.license_plate} - {vehicle.make || vehicle.brand} {vehicle.model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Time Selection */}
                    {selectedBatteryType && selectedVehicleId && (
                      <div className="mb-8">
                        <Label className="mb-3 block text-base">
                          <Clock className="inline h-5 w-5 mr-1" />
                          Chọn thời gian
                        </Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                          Chọn thời điểm bạn muốn đến trạm
                        </p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot.value}
                              type="button"
                              onClick={() => {
                                setSelectedTimeSlot(slot.value);
                                setCustomTime('');
                              }}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${
                                selectedTimeSlot === slot.value
                                  ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <div className="font-medium text-slate-900 dark:text-white text-sm">
                                {slot.label}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {slot.subLabel}
                              </div>
                            </button>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full mb-3"
                          onClick={() => {
                            setSelectedTimeSlot('');
                            setCustomTime(getMinDateTime());
                          }}
                        >
                          Chọn giờ khác
                        </Button>
                        {(!selectedTimeSlot || selectedTimeSlot === '') && customTime && (
                          <div>
                            <Input
                              type="datetime-local"
                              value={customTime}
                              onChange={(e) => setCustomTime(e.target.value)}
                              min={getMinDateTime()}
                              max={getMaxDateTime()}
                              className="glass border-slate-200/50 dark:border-slate-700/50"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Padding bottom để đảm bảo scroll được đến phần cuối */}
                    <div className="pb-4"></div>
                  </>
                )}
              </div>

              {/* Right Pane: Booking Summary */}
              <div className="p-8 bg-slate-50/30 dark:bg-slate-900/30 overflow-y-auto overflow-x-hidden h-full max-h-full scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 dark:scrollbar-thumb-slate-600 dark:scrollbar-track-slate-800">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-8">
                  Tóm tắt đặt chỗ
                </h3>

                {selectedBatteryType && selectedBatteryInfo ? (
                  <>
                    <div className="space-y-6 mb-8">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-base">
                          Loại pin đã chọn
                        </h4>
                        <div className="p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {selectedBatteryInfo.model}
                          </p>
                          {selectedBatteryInfo.capacity && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {selectedBatteryInfo.capacity} kWh •{' '}
                              {Math.round(selectedBatteryInfo.capacity * 6.25)} km
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-base">
                          <span className="text-slate-600 dark:text-slate-400">Giá thay pin</span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {batteryPrice > 0
                              ? `${batteryPrice.toLocaleString('vi-VN')}₫`
                              : 'Liên hệ'}
                          </span>
                        </div>
                        <div className="flex justify-between text-base">
                          <span className="text-slate-600 dark:text-slate-400">Phí dịch vụ</span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {SERVICE_FEE.toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-slate-900 dark:text-white text-lg">
                              Tổng cộng
                            </span>
                            <span className={`font-bold text-green-600 ${
                              totalPrice > SERVICE_FEE ? 'text-2xl' : 'text-lg'
                            }`}>
                              {totalPrice > SERVICE_FEE
                                ? `${totalPrice.toLocaleString('vi-VN')}₫`
                                : 'Liên hệ'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {selectedTimeSlot === 'instant'
                              ? 'Trong 15 phút'
                              : selectedTimeSlot
                                ? new Date(selectedTimeSlot).toLocaleString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : customTime
                                  ? new Date(customTime).toLocaleString('vi-VN', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'Chưa chọn'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Clock className="h-4 w-4" />
                          <span>Thời gian thay: 2-3 phút</span>
                        </div>
                        {selectedBatteryInfo.capacity && (
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Zap className="h-4 w-4" />
                            <span>
                              Tầm hoạt động:{' '}
                              {Math.round(selectedBatteryInfo.capacity * 6.25)} km
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={loading || !selectedVehicleId || (!selectedTimeSlot && !customTime)}
                      className="w-full gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 mb-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Xác nhận đặt chỗ
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                      Bạn có thể hủy đặt chỗ miễn phí trước 15 phút
                    </p>
                  </>
                ) : (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <Battery className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Vui lòng chọn loại pin để xem tóm tắt</p>
                  </div>
                )}

                {/* Error/Success Messages */}
                {error && (
                  <Alert className="border-red-200 bg-red-50/50 mt-4">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50/50 mt-4">
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;

