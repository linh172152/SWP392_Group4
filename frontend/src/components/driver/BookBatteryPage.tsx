import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Package, Zap, Calendar, Clock } from 'lucide-react';
import API_ENDPOINTS, { fetchWithAuth } from '../../config/api';
import { getMySubscriptions } from '../../services/subscription.service';
import { matchBatteryModel } from '../../utils/batteryModelUtils';

interface BatteryItem {
  battery_id: string;
  battery_code: string;
  model: string;
  capacity_kwh: number;
  current_charge: number;
  status: string;
}
interface VehicleItem {
  vehicle_id: string;
  make?: string;
  model?: string;
  year?: number;
  license_plate: string;
  battery_model: string;
}
interface StationDetailData {
  station_id: string;
  name: string;
  address: string;
  average_rating?: number;
  total_ratings?: number;
}

const BookBatteryPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [station, setStation] = useState<StationDetailData|null>(null);
  const [batteries, setBatteries] = useState<BatteryItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<string|null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleItem|null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any|null>(null);
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [error, setError] = useState('');
  const [bookingMsg, setBookingMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch tất cả dữ liệu gốc - Tối ưu: Load song song để nhanh hơn
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        // Tối ưu: Load song song các API không phụ thuộc lẫn nhau
        const [stationRes, batteriesRes, vehiclesRes] = await Promise.all([
          fetchWithAuth(`${API_ENDPOINTS.DRIVER.STATIONS}/${id}`),
          fetchWithAuth(`${API_ENDPOINTS.DRIVER.STATIONS}/${id}/batteries`),
          fetchWithAuth(API_ENDPOINTS.DRIVER.VEHICLES)
        ]);
        
        const [stj, brj, vrj] = await Promise.all([
          stationRes.json(),
          batteriesRes.json(),
          vehiclesRes.json()
        ]);
        
        if (!stationRes.ok) throw new Error(stj.message || 'Không lấy được thông tin trạm');
        if (!batteriesRes.ok) throw new Error(brj.message || 'Không lấy được pin');
        if (!vehiclesRes.ok) throw new Error(vrj.message || 'Không lấy được xe của bạn');
        
        setStation(stj.data);
        setBatteries(brj.data);
        setVehicles(vrj.data);
        
        // Load subscription song song (không block UI chính)
        // Subscription là optional nên không cần chờ
        // Delay một chút để tránh rate limit
        setTimeout(() => {
          getMySubscriptions()
            .then(response => {
              console.log('📦 Subscription response:', response);
              const subscriptions = response.data || [];
              console.log('📦 All subscriptions:', subscriptions);
              
              if (!subscriptions || subscriptions.length === 0) {
                console.log('📦 Không có subscription nào');
                return;
              }
              
              // Tìm subscription active và hợp lệ
              const activeSub = subscriptions.find((sub: any) => {
                const now = new Date();
                const endDate = new Date(sub.end_date);
                // Check thủ công vì BE có thể chưa tự động update status = "expired"
                const isStillValid = sub.status === 'active' && 
                                    endDate >= now && 
                                    (sub.remaining_swaps === null || sub.remaining_swaps > 0);
                console.log('📦 Checking subscription:', {
                  id: sub.subscription_id,
                  name: sub.package?.name,
                  status: sub.status,
                  endDate: sub.end_date,
                  remaining: sub.remaining_swaps,
                  isStillValid
                });
                return isStillValid;
              });
              
              console.log('📦 Active subscription found:', activeSub);
              if (activeSub) {
                setCurrentSubscription(activeSub);
                console.log('✅ Đã set subscription:', activeSub);
              } else {
                console.log('📦 Không tìm thấy subscription active hợp lệ');
              }
            })
            .catch(subErr => {
              // Không có subscription hoặc lỗi - không ảnh hưởng đến flow chính
              console.error('❌ Lỗi khi load subscription:', subErr);
              // Nếu là lỗi 429, thử lại sau 2 giây
              if (subErr.status === 429) {
                console.log('⏳ Rate limit, sẽ thử lại sau 2 giây...');
                setTimeout(() => {
                  getMySubscriptions()
                    .then(response => {
                      const subscriptions = response.data || [];
                      const activeSub = subscriptions.find((sub: any) => {
                        const now = new Date();
                        const endDate = new Date(sub.end_date);
                        return sub.status === 'active' && 
                               endDate >= now && 
                               (sub.remaining_swaps === null || sub.remaining_swaps > 0);
                      });
                      if (activeSub) {
                        setCurrentSubscription(activeSub);
                        console.log('✅ Đã load subscription sau retry:', activeSub);
                      }
                    })
                    .catch(() => {
                      console.log('❌ Vẫn lỗi sau retry, bỏ qua subscription');
                    });
                }, 2000);
              }
            });
        }, 500); // Delay 500ms để tránh rate limit
      } catch (e: any) {
        setError(e.message || 'Có lỗi xảy ra');
      } finally { setLoading(false); }
    };
    fetchAll();
    
    // Tự động set thời gian mặc định: 1 giờ từ bây giờ
    const defaultTime = new Date(Date.now() + 60 * 60 * 1000);
    setScheduledAt(defaultTime.toISOString().slice(0, 16)); // Format: YYYY-MM-DDTHH:mm
  }, [id]);
  
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

  // Tất cả model pin khả dụng của trạm (unique - chỉ lấy pin status full)
  const availableOnly = batteries.filter(b => b.status === 'full');
  const batteryModels = [...new Set(availableOnly.map(b => b.model))];
  // Map: model pin => số pin khả dụng hiện có
  // FIX: Chỉ hiển thị những loại pin có ít nhất 1 xe tương thích
  const pinStats = batteryModels.map(model => {
    const pins = availableOnly.filter(b => b.model === model);
    const compatibleVehiclesCount = vehicles.filter(v => v.battery_model && matchBatteryModel(model, v.battery_model)).length;
    return { 
      model, 
      count: pins.length, 
      example: pins[0],
      hasCompatibleVehicle: compatibleVehiclesCount > 0
    };
  }).filter(p => p.count > 0 && p.hasCompatibleVehicle); // Chỉ hiển thị pin có xe tương thích

  // Tìm pin được đề xuất (phù hợp với xe đầu tiên của driver)
  const recommendedPinModel = vehicles.length > 0 && vehicles[0]?.battery_model
    ? pinStats.find(p => matchBatteryModel(p.model, vehicles[0].battery_model!))
    : null;

  // Tự động đề xuất pin và xe khi có dữ liệu (chỉ chạy lần đầu)
  useEffect(() => {
    if (vehicles.length > 0 && batteries.length > 0 && pinStats.length > 0 && !selectedModel) {
      // Tìm xe đầu tiên của driver
      const firstVehicle = vehicles[0];
      if (firstVehicle && firstVehicle.battery_model) {
        // Tìm loại pin phù hợp với xe đầu tiên (flexible matching)
        const compatiblePinModel = pinStats.find(p => matchBatteryModel(p.model, firstVehicle.battery_model!));
        if (compatiblePinModel) {
          // Tự động đề xuất loại pin phù hợp
          setSelectedModel(compatiblePinModel.model);
          // Tự động chọn xe đầu tiên phù hợp với pin này (flexible matching)
          const compatibleVehicle = vehicles.find(v => v.battery_model && matchBatteryModel(compatiblePinModel.model, v.battery_model));
          if (compatibleVehicle) {
            setSelectedVehicle(compatibleVehicle);
          }
        }
      }
    }
  }, [vehicles.length, batteries.length, pinStats.length]); // Chỉ chạy khi dữ liệu load xong lần đầu

  // Đặt chỗ khi đã chọn model và chọn xe phù hợp
  // NOTE về Subscription:
  // - BE sẽ tự động check subscription khi staff completeBooking
  // - Nếu có subscription active và hợp lệ → amount = 0 (miễn phí)
  // - Không cần gửi subscription_id trong request body booking
  const handleBooking = async () => {
    setBookingMsg(''); setError('');
    if (!selectedModel || !selectedVehicle) {
      setError('Chọn loại pin và xe trước khi đặt!'); return;
    }
    
    // FIX: Validation nghiêm ngặt - Kiểm tra xe có tương thích với loại pin đã chọn (flexible matching)
    if (!selectedVehicle.battery_model || !matchBatteryModel(selectedModel, selectedVehicle.battery_model)) {
      setError('Xe đã chọn không tương thích với loại pin này. Vui lòng chọn lại!');
      // Reset selection để tránh confusion
      setSelectedVehicle(null);
      return;
    }
    
    // Kiểm tra thời gian hẹn
    if (!scheduledAt) {
      setError('Vui lòng chọn thời gian hẹn!'); return;
    }
    
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      setError('Thời gian hẹn không hợp lệ!'); return;
    }
    
    const now = new Date();
    const minTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 phút từ bây giờ
    const maxTime = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 giờ từ bây giờ
    
    if (scheduledDate < minTime) {
      setError('Thời gian hẹn phải ít nhất 30 phút từ bây giờ!'); return;
    }
    if (scheduledDate > maxTime) {
      setError('Thời gian hẹn không được quá 12 giờ từ bây giờ!'); return;
    }
    
    // Có battery khả dụng?
    const hasAvailable = batteries.some(b => b.model === selectedModel && b.status === 'full');
    if (!hasAvailable) {
      setError('Hiện tại không còn pin khả dụng cho loại này!'); return;
    }
    setLoading(true);
    
    // Tối ưu: Thêm timeout và AbortController để tránh chờ quá lâu
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 giây timeout
    
    try {
      const scheduledAtISO = scheduledDate.toISOString();
      // QUAN TRỌNG: Gửi vehicle.battery_model thay vì selectedModel
      // Vì BE check compatibility với vehicle.battery_model (không có "Battery" suffix)
      // selectedModel có thể có "Battery" suffix từ battery trong station
      const body = {
        vehicle_id: selectedVehicle.vehicle_id,
        station_id: id,
        battery_model: selectedVehicle.battery_model, // Dùng vehicle.battery_model thay vì selectedModel
        scheduled_at: scheduledAtISO
      };
      
      // Tối ưu: Sử dụng signal để có thể abort request
      const res = await fetchWithAuth(API_ENDPOINTS.DRIVER.BOOKINGS, { 
        method: 'POST', 
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Tối ưu: Parse JSON nhanh hơn với check status trước
      if (!res.ok) {
        let errorData = {};
        try { errorData = await res.json(); } catch {}
        throw new Error((errorData as any).message || `Lỗi ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Đặt pin thất bại');
      }
      
      // Hiển thị message
      setBookingMsg(
        currentSubscription 
          ? 'Đặt Pin thành công! Bạn có gói dịch vụ - Sẽ được miễn phí khi hoàn tất đổi pin tại trạm.' 
          : 'Đặt Pin thành công! Bạn sẽ thanh toán khi hoàn tất đổi pin tại trạm.'
      );
      
      // Tối ưu: Tự động chuyển về trang bookings sau 1.5 giây
      setTimeout(() => {
        navigate('/driver/bookings');
      }, 1500);
      
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        setError('Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại hoặc kiểm tra kết nối mạng.');
      } else {
        // Xử lý error message từ BE - Dịch tất cả sang tiếng Việt
        let errorMessage = e.message || 'Có lỗi xảy ra khi đặt chỗ';
        
        // Dịch các error message thường gặp từ BE sang tiếng Việt
        const errorTranslations: Record<string, string> = {
          'No available batteries': 'Không còn pin khả dụng',
          'available batteries': 'pin khả dụng',
          'Battery model is not compatible': 'Loại pin không tương thích',
          'Vehicle not found': 'Không tìm thấy xe',
          'Station not found': 'Không tìm thấy trạm',
          'Scheduled time must be': 'Thời gian hẹn phải',
          'at least 30 minutes': 'ít nhất 30 phút',
          'more than 12 hours': 'không quá 12 giờ',
          'in the future': 'trong tương lai',
          'Please choose another time': 'Vui lòng chọn thời gian khác',
          'Please ask user to reschedule': 'Vui lòng yêu cầu người dùng đặt lại lịch'
        };
        
        // Nếu là lỗi không có pin tại thời điểm đã chọn
        if (errorMessage.includes('No available batteries') || 
            errorMessage.includes('available batteries') || 
            errorMessage.includes('Please choose another time') ||
            errorMessage.toLowerCase().includes('no available') ||
            errorMessage.toLowerCase().includes('choose another time')) {
          
          // Tìm thời gian trong message (nếu có) - format: "11/4/2025, 3:00:00 PM"
          const timeMatch = errorMessage.match(/(\d{1,2}\/\d{1,2}\/\d{4},?\s*\d{1,2}:\d{2}:\d{2}\s*[AP]M)/i);
          
          let displayTime = '';
          if (scheduledAt) {
            displayTime = new Date(scheduledAt).toLocaleString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } else if (timeMatch) {
            // Parse thời gian từ message (format: "11/4/2025, 3:00:00 PM")
            try {
              const parsedTime = new Date(timeMatch[1]);
              if (!isNaN(parsedTime.getTime())) {
                displayTime = parsedTime.toLocaleString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
              }
            } catch {}
          }
          
          if (displayTime) {
            errorMessage = `Không còn pin khả dụng cho loại ${selectedModel} tại thời điểm ${displayTime}. Vui lòng chọn thời gian khác hoặc thử lại sau.`;
            
            // Tự động suggest thời gian mới: +30 phút từ thời gian đã chọn
            if (scheduledAt) {
              const suggestedTime = new Date(scheduledDate.getTime() + 30 * 60 * 1000);
              if (suggestedTime <= new Date(Date.now() + 12 * 60 * 60 * 1000)) {
                errorMessage += `\n\n💡 Gợi ý: Thử đặt lịch lúc ${suggestedTime.toLocaleString('vi-VN', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit'
                })}`;
              }
            }
          } else {
            errorMessage = `Không còn pin khả dụng cho loại ${selectedModel} tại trạm này. Vui lòng chọn thời gian khác hoặc thử lại sau.`;
          }
        }
        // Dịch các lỗi khác
        else if (errorMessage.includes('Battery model is not compatible')) {
          errorMessage = 'Loại pin không tương thích với xe của bạn. Vui lòng chọn lại.';
        }
        else if (errorMessage.includes('Vehicle not found') || errorMessage.includes('does not belong to user')) {
          errorMessage = 'Không tìm thấy xe hoặc xe không thuộc về tài khoản của bạn.';
        }
        else if (errorMessage.includes('Station not found') || errorMessage.includes('not active')) {
          errorMessage = 'Trạm không tồn tại hoặc không hoạt động.';
        }
        else if (errorMessage.includes('Scheduled time must be at least 30 minutes')) {
          errorMessage = 'Thời gian hẹn phải ít nhất 30 phút từ bây giờ.';
        }
        else if (errorMessage.includes('Scheduled time cannot be more than 12 hours')) {
          errorMessage = 'Thời gian hẹn không được quá 12 giờ từ bây giờ.';
        }
        else if (errorMessage.includes('Scheduled time must be in the future')) {
          errorMessage = 'Thời gian hẹn phải trong tương lai.';
        }
        else {
          // Dịch các từ khóa còn lại
          Object.keys(errorTranslations).forEach(key => {
            if (errorMessage.includes(key)) {
              errorMessage = errorMessage.replace(new RegExp(key, 'gi'), errorTranslations[key]);
            }
          });
          
          // Nếu vẫn còn chữ tiếng Anh và chưa được dịch, thử dịch toàn bộ message
          // Kiểm tra xem có từ tiếng Anh thường gặp không
          const commonEnglishWords = ['error', 'failed', 'invalid', 'not found', 'not allowed', 'unauthorized', 'forbidden', 'bad request'];
          const hasEnglishWord = commonEnglishWords.some(word => 
            errorMessage.toLowerCase().includes(word) && !errorMessage.includes('Không') && !errorMessage.includes('thất bại')
          );
          
          if (hasEnglishWord && errorMessage === e.message) {
            // Nếu message gốc vẫn là tiếng Anh, dịch sang tiếng Việt
            errorMessage = errorMessage
              .replace(/error/gi, 'lỗi')
              .replace(/failed/gi, 'thất bại')
              .replace(/invalid/gi, 'không hợp lệ')
              .replace(/not found/gi, 'không tìm thấy')
              .replace(/not allowed/gi, 'không được phép')
              .replace(/unauthorized/gi, 'không được ủy quyền')
              .replace(/forbidden/gi, 'bị cấm')
              .replace(/bad request/gi, 'yêu cầu không hợp lệ');
            
            // Nếu vẫn chưa có tiền tố, thêm "Có lỗi xảy ra: "
            if (!errorMessage.includes('Có lỗi') && !errorMessage.includes('Không')) {
              errorMessage = `Có lỗi xảy ra: ${errorMessage}`;
            }
          }
        }
        
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col p-6 lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        {station && (
          <Card className="mb-2">
            <CardContent className="p-4">
              <div className="font-bold text-xl mb-1">{station.name}</div>
              <div className="text-sm text-slate-600 mb-1">{station.address}</div>
              <div className="text-yellow-700 mb-2">★ {(station.average_rating || 0).toFixed(1)} ({station.total_ratings || 0})</div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-4">
            <div className="font-semibold mb-2">Chọn loại pin phù hợp với xe của bạn</div>
            {pinStats.length === 0 && <div>Hiện trạm này chưa có pin khả dụng.</div>}
            <div className="space-y-4">
              {pinStats.map(({ model, count, example }) => {
                const compatibleVehicles = vehicles.filter(v => v.battery_model && matchBatteryModel(model, v.battery_model));
                return (
                  <div key={model}
                    className={`p-4 rounded-lg border ${selectedModel === model ? 'border-green-600 ring-2 ring-green-500/30 bg-green-50' : 'border-slate-200 bg-white'} cursor-pointer transition-all hover:shadow-md`}
                    onClick={() => {
                      setSelectedModel(model);
                      // FIX: Reset xe đã chọn nếu không tương thích với loại pin mới (flexible matching)
                      if (selectedVehicle && (!selectedVehicle.battery_model || !matchBatteryModel(model, selectedVehicle.battery_model))) {
                        setSelectedVehicle(null);
                      }
                      setError(''); setBookingMsg('');
                    }}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-base">{model}</div>
                        {recommendedPinModel && recommendedPinModel.model === model && (
                          <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">
                            Đề xuất
                          </Badge>
                        )}
                      </div>
                      <div className="font-bold text-green-700 text-xl">{count} pin</div>
                    </div>
                    <div className="flex gap-4 items-center text-xs">
                      <div>Dung lượng: <b>{example.capacity_kwh} kWh</b></div>
                      <div>Mức sạc trung bình: <b>{example.current_charge}%</b></div>
                    </div>
                    <div className="mt-2 text-slate-500 text-xs">Xe của bạn tương thích:</div>
                    {compatibleVehicles.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                         {compatibleVehicles.map(v => (
                           <Badge key={v.vehicle_id}
                             onClick={e => { 
                               e.stopPropagation(); 
                               // FIX: Tự động set loại pin khi chọn xe
                               // Đảm bảo selectedModel = battery_model của xe
                               if (selectedModel !== model) {
                                 setSelectedModel(model);
                               }
                               setSelectedVehicle(v);
                               setError(''); 
                             }}
                             className={`cursor-pointer text-base px-3 py-2 select-none transition-all duration-300 ${
                               selectedVehicle && selectedVehicle.vehicle_id === v.vehicle_id 
                                 ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold border-2 border-blue-500 shadow-lg shadow-blue-500/50 scale-105' 
                                 : 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-900 dark:text-blue-100 border-2 border-blue-500 dark:border-blue-400 hover:border-blue-600 dark:hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/30 hover:scale-105 vehicle-compatible-glow'
                             }`}
                           >
                             {v.make ? `${v.make} ` : ''}{v.model ? v.model : ''} ({v.license_plate})
                           </Badge>
                         ))}
                      </div>
                    ) : <div className="text-xs text-red-600 font-medium mb-2">Không có xe nào của bạn tương thích loại pin này.</div>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full md:w-80 lg:w-96 xl:w-[400px]">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="font-semibold mb-2 text-base">Tóm tắt đặt chỗ</div>
            {!selectedModel && (
              <div className="text-slate-500 text-xs">Chọn loại pin để xem chi tiết</div>)}
            {selectedModel && (
              <>
                <div>Loại pin: <b>{selectedModel}</b></div>
                <div>Xe: {selectedVehicle ? <span className="font-bold">{selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.license_plate})</span> : <span className="text-orange-500">Chọn xe</span>}</div>
                <div>Số pin còn: <b>{pinStats.find(p=>p.model===selectedModel)?.count ?? 0}</b></div>
                
                {/* Phần chọn thời gian hẹn */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="font-semibold mb-2 text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Thời gian hẹn
                  </div>
                  <div className="space-y-2">
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      min={getMinDateTime()}
                      max={getMaxDateTime()}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Chọn thời gian từ 30 phút đến 12 giờ kể từ bây giờ
                    </p>
                    {scheduledAt && (
                      <>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Hẹn lúc: {new Date(scheduledAt).toLocaleString('vi-VN', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          ⚠️ Lưu ý: Số lượng pin có thể thay đổi tùy theo số người đặt trước tại thời điểm này. Nếu hết pin, vui lòng chọn thời gian khác.
                        </p>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Thông tin gói dịch vụ (nếu có) */}
                {currentSubscription && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="p-3 rounded-lg border border-green-500/30 bg-green-50/50 dark:bg-green-900/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="font-semibold text-sm text-green-800 dark:text-green-400">
                          Bạn có gói dịch vụ
                        </span>
                        <Badge className="bg-green-600 text-white ml-auto">
                          <Zap className="h-3 w-3 mr-1" />
                          Miễn phí
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {currentSubscription.package?.name || 'Gói dịch vụ'}
                        </div>
                        <div>
                          {currentSubscription.remaining_swaps === null 
                            ? 'Không giới hạn' 
                            : `Còn ${currentSubscription.remaining_swaps} lần`} • 
                          Hết hạn: {new Date(currentSubscription.end_date).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="mt-2 text-green-700 dark:text-green-400 font-medium">
                          Sẽ được miễn phí khi hoàn tất đổi pin tại trạm
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {!currentSubscription && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Không có gói dịch vụ
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-blue-500 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        onClick={() => navigate('/driver/subscriptions')}
                      >
                        <Package className="mr-2 h-4 w-4" />
                        Mua gói dịch vụ
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
            {selectedModel && selectedVehicle && (
              <Button 
                disabled={loading} 
                className="w-full mt-5 gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed" 
                onClick={handleBooking}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </span>
                ) : "Xác nhận đặt chỗ"}
              </Button>
            )}
            {selectedModel && !selectedVehicle && (
              <div className="mt-5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300 text-center font-medium">
                  ⚠️ Vui lòng chọn xe tương thích ở trên để tiếp tục
                </p>
              </div>
            )}
            {!selectedModel && (
              <Button disabled className="w-full mt-5 opacity-50 cursor-not-allowed">
                Xác nhận đặt chỗ
              </Button>
            )}
            {error && (
              <div className="text-sm text-red-700 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mt-2">
                <div className="font-semibold mb-1">⚠️ Lỗi đặt chỗ</div>
                <div className="whitespace-pre-line">{error}</div>
                {error.includes('Không còn pin khả dụng') && (
                  <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-700">
                    <p className="text-xs text-red-600 dark:text-red-400">
                      💡 <strong>Gợi ý:</strong> Hãy thử chọn thời gian khác (sớm hơn hoặc muộn hơn) hoặc chọn loại pin khác nếu có.
                    </p>
                  </div>
                )}
              </div>
            )}
            {bookingMsg && <div className="text-sm text-green-700 bg-green-100 rounded p-2 mt-2">{bookingMsg}</div>}
            <div className="text-xs text-slate-500 mt-3">Bạn có thể huỷ đặt chỗ miễn phí trước 15 phút</div>
            <Button variant="outline" className="w-full mt-2" onClick={() => navigate(-1)}>Quay lại</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookBatteryPage;
