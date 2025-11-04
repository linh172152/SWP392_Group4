import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { DialogHeader, DialogTitle } from '../ui/dialog';
import {
  Activity,
  Battery,
  Clock,
  DollarSign,
  MapPin,
  Users,
} from 'lucide-react';
import type { Station } from '../../services/station.service';
import { getStationById } from '../../services/station.service';

interface StationDetailsProps {
  stationId: string;
  onClose: () => void;
}

const StationDetails: React.FC<StationDetailsProps> = ({ stationId, onClose }) => {
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStationDetails = async () => {
      try {
        const res = await getStationById(stationId);
        if (res.success) {
          setStation(res.data);
        }
      } catch (error) {
        console.error('Error fetching station details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStationDetails();
  }, [stationId]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
      </div>
    );
  }

  if (!station) {
    return (
      <div className="p-8 text-center">
        <p>Không tìm thấy thông tin trạm</p>
        <Button onClick={onClose} className="mt-4">
          Quay lại
        </Button>
      </div>
    );
  }

  const utilization = station.capacity
    ? Math.round(
        ((station.capacity - (station.available_batteries || 0)) /
          station.capacity) *
          100
      )
    : 0;

  const getUtilizationColor = (value: number) => {
    if (value >= 80) return 'text-red-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Chi tiết Trạm</DialogTitle>
      </DialogHeader>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{station.name}</h2>
            <p className="text-gray-600 flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              {station.address}
            </p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Battery Status */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Battery className="mr-2 h-5 w-5" />
              Trạng thái Pin
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {station.available_batteries || 0}
                  </div>
                  <div className="text-sm text-gray-600">Khả dụng</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {station.charging_batteries || 0}
                  </div>
                  <div className="text-sm text-gray-600">Đang sạc</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {station.maintenance_batteries || 0}
                  </div>
                  <div className="text-sm text-gray-600">Bảo trì</div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Tình trạng sử dụng</span>
                  <span className={getUtilizationColor(utilization)}>
                    {utilization}%
                  </span>
                </div>
                <Progress value={utilization} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Hiệu suất
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {station.daily_swaps}
                      </div>
                      <div className="text-sm text-gray-600">Lần thay hôm nay</div>
                    </div>
                    <Activity className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        ${(station.daily_revenue || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Doanh thu hôm nay</div>
                    </div>
                    <DollarSign className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-cyan-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                        <div className="text-2xl font-bold text-cyan-600">
                        {(station.uptime || 0).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Uptime</div>
                    </div>
                    <Clock className="h-8 w-8 text-cyan-600" />
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                        <div className="text-2xl font-bold text-emerald-600">
                        {station.operating_hours || '24/7'}
                      </div>
                      <div className="text-sm text-gray-600">Giờ hoạt động</div>
                    </div>
                    <Clock className="h-8 w-8 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Station Manager */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Thông tin Quản lý
            </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tên quản lý:</span>
                  <span className="font-medium">{station.manager?.full_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số điện thoại:</span>
                  <span className="font-medium">{station.manager?.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ID:</span>
                  <span className="font-medium">{station.manager?.user_id || 'N/A'}</span>
                </div>
              </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
};

export default StationDetails;