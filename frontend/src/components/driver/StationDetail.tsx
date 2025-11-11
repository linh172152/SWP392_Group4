import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Navigation, 
  Calendar,
  Battery,
  Zap,
  Users
} from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import API_ENDPOINTS, { fetchWithAuth } from '../../config/api';

interface BatteryItem { battery_id: string; battery_code: string; model: string; capacity_kwh: number; current_charge: number; status: string; }
interface StationDetailData {
  station_id: string;
  name: string;
  address: string;
  latitude?: number | string;
  longitude?: number | string;
  phone?: string;
  average_rating?: number;
  total_ratings?: number;
  batteries?: BatteryItem[];
  staff?: Array<{ user_id: string; full_name: string; email: string }>;
}

const StationDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [station, setStation] = useState<StationDetailData | null>(null);
  const [batteries, setBatteries] = useState<BatteryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingMsg, setBookingMsg] = useState('');

  const getInventoryColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${index < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`${API_ENDPOINTS.DRIVER.STATIONS}/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Tải chi tiết trạm thất bại');
      setStation(data.data);
      const br = await fetchWithAuth(`${API_ENDPOINTS.DRIVER.STATIONS}/${id}/batteries`);
      const brData = await br.json();
      if (br.ok && brData.success) setBatteries(brData.data);
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const reserveSlot = async () => {
    if (!id) return;
    setBookingMsg('');
    setError('');
    try {
      // Lấy list tất cả xe của user
      const vs = await fetchWithAuth(API_ENDPOINTS.DRIVER.VEHICLES);
      const vsData: any = await vs.json();
      const vehicles: Array<{ vehicle_id: string; battery_model: string }> =
        vs.ok && vsData.success && Array.isArray(vsData.data) ? vsData.data : [];
      // Lọc pin khả dụng ở trạm (full)
      const availableBatteries = batteries.filter(b => b.status === 'full');
      // Tìm xe có battery_model khớp với bất cứ battery model tại trạm
      const matching = vehicles.find((v) =>
        availableBatteries.some((b) => b.model === v.battery_model)
      );
      if (!matching) {
        setError('Bạn không có xe nào tương thích pin tại trạm này.');
        return;
      }
      const matchedBatteryModel = matching.battery_model;
      const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const body = {
        vehicle_id: matching.vehicle_id,
        station_id: id,
        battery_model: matchedBatteryModel,
        scheduled_at: scheduledAt
      };
      const res = await fetchWithAuth(API_ENDPOINTS.DRIVER.BOOKINGS, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Đặt pin thất bại');
      setBookingMsg('Đặt Pin thành công!');
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const availableMap = batteries.reduce((acc: Record<string, { available: number; total: number }>, b) => {
    const key = b.model;
    if (!acc[key]) acc[key] = { available: 0, total: 0 };
    acc[key].total += 1;
    if (b.status === 'full') acc[key].available += 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-500/10 p-3 rounded-lg border border-red-200/50 dark:border-red-500/20">
          {error}
        </div>
      )}
      {bookingMsg && (
        <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
          {bookingMsg}
        </div>
      )}

      {station && (
        <>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{station.name}</h1>
              </div>
              <div className="flex items-center space-x-4 text-gray-600 mb-4">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{station.address}</span>
                </div>
                {station.phone && (
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{station.phone}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {renderStars(station.average_rating || 0)}
                  <span className="text-sm font-medium ml-1">{(station.average_rating || 0).toFixed(1)}</span>
                  <span className="text-sm text-gray-600">({station.total_ratings || 0} đánh giá)</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate(`/driver/booking/${id}`)}
                disabled={loading}
                className="gradient-primary text-white"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Đặt chỗ
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              {/* BE không trả mảng ảnh, chỉ render ảnh đại diện duy nhất của trạm nếu có, ở đây để default */}
              <ImageWithFallback
                src={'/default-station.jpg'}
                alt={station.name}
                className="w-full h-64 lg:h-80 object-cover rounded-lg"
              />
            </CardContent>
          </Card>

          {/* STAFF từ BE */}
          {Array.isArray(station.staff) && station.staff.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Nhân viên tại trạm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {station.staff.map((member) => (
                    <div key={member.user_id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Avatar className="h-12 w-12"><AvatarFallback>{member.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{member.full_name}</h3>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Danh sách Pin thực tế */}
          <Card className="mt-4">
            <CardHeader><CardTitle>Danh sách pin tại trạm</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-slate-200 dark:bg-slate-700">
                    <tr>
                      <th className="p-2">Mã Pin</th>
                      <th className="p-2">Model</th>
                      <th className="p-2">Dung lượng (kWh)</th>
                      <th className="p-2">% sạc</th>
                      <th className="p-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batteries.map(b => (
                      <tr key={b.battery_id} className="border-b">
                        <td className="p-2">{b.battery_code}</td>
                        <td className="p-2">{b.model}</td>
                        <td className="p-2">{b.capacity_kwh}</td>
                        <td className="p-2">{b.current_charge}%</td>
                        <td className="p-2">
                          <Badge className={ b.status === 'full' ? 'bg-green-100 text-green-800' : b.status === 'charging' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-200 text-slate-700'}>{b.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default StationDetail;
