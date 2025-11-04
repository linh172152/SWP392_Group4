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
          // Transform data: backend returns 'staff' array, frontend expects 'manager' object
          const stationData = res.data;
          const manager = stationData.staff && stationData.staff.length > 0 
            ? stationData.staff[0] 
            : null;
          
          const transformedStation = {
            ...stationData,
            manager: manager ? {
              user_id: manager.user_id,
              full_name: manager.full_name,
              email: manager.email,
              phone: manager.phone
            } : null,
            // Map battery stats if available
            available_batteries: stationData.battery_stats?.full || 0,
            charging_batteries: stationData.battery_stats?.charging || 0,
            maintenance_batteries: stationData.battery_stats?.maintenance || 0,
          };
          
          console.log('Station details transformed:', transformedStation);
          setStation(transformedStation);
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
      <DialogHeader className="border-b pb-4">
        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Chi tiết Trạm
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6 p-6 max-h-[70vh] overflow-y-auto">
        {/* Header with Station Name and Address */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {station.name}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-blue-500" />
            {station.address}
          </p>
          {station.operating_hours && (
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-white/50 dark:bg-slate-800/50 text-sm">
              <Clock className="h-4 w-4 mr-1.5 text-emerald-500" />
              <span className="font-medium">Giờ hoạt động: {station.operating_hours}</span>
            </div>
          )}
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Battery Status - Redesigned */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3">
                <Battery className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Trạng thái Pin
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:shadow-lg transition-all hover:scale-105">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {station.available_batteries || 0}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Khả dụng</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 hover:shadow-lg transition-all hover:scale-105">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {station.charging_batteries || 0}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Đang sạc</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 hover:shadow-lg transition-all hover:scale-105">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {station.maintenance_batteries || 0}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Bảo trì</div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Tổng sức chứa</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {station.capacity || 0}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Tỷ lệ sử dụng</span>
                  <span className={`font-bold ${getUtilizationColor(utilization)}`}>
                    {utilization}%
                  </span>
                </div>
                <Progress value={utilization} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics - Redesigned */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Hiệu suất Hôm nay
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 hover:shadow-lg transition-all hover:scale-105">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {station.daily_swaps || 0}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Lần thay</div>
              </div>
              
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 hover:shadow-lg transition-all hover:scale-105">
                <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400 mb-2" />
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  ${(station.daily_revenue || 0).toLocaleString()}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Doanh thu</div>
              </div>
              
              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 hover:shadow-lg transition-all hover:scale-105">
                <Clock className="h-6 w-6 text-cyan-600 dark:text-cyan-400 mb-2" />
                <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  {(station.uptime || 0).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Uptime</div>
              </div>
              
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 hover:shadow-lg transition-all hover:scale-105">
                <Battery className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mb-2" />
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {station.capacity || 0}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Tổng sức chứa</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Station Manager - Redesigned */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-3">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Thông tin Quản lý
              </h3>
            </div>
            {station.manager ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:shadow-md transition-shadow">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tên quản lý</div>
                  <div className="font-semibold text-slate-900 dark:text-white text-lg">
                    {station.manager.full_name}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:shadow-md transition-shadow">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Email</div>
                  <div className="font-semibold text-slate-900 dark:text-white break-all">
                    {station.manager.email || 'N/A'}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:shadow-md transition-shadow">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Số điện thoại</div>
                  <div className="font-semibold text-slate-900 dark:text-white text-lg">
                    {station.manager.phone}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chưa có quản lý được gán</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end pt-4 border-t">
        <Button 
          onClick={onClose}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
        >
          Đóng
        </Button>
      </div>
      </div>
    </>
  );
};

export default StationDetails;