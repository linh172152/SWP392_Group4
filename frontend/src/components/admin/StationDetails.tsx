import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
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
    <div className="flex flex-col h-full w-full overflow-hidden">
      <DialogHeader className="border-b pb-4 px-6 pt-6 flex-shrink-0 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Chi tiết Trạm
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
              Xem thông tin chi tiết về trạm thay pin và hiệu suất hoạt động
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4">
        <div className="w-full space-y-4">
          {/* Header with Station Name and Address - Compact */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {station.name}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                  <MapPin className="h-4 w-4 mr-1.5 text-blue-500" />
                  {station.address}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {station.operating_hours && (
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/50 dark:bg-slate-800/50 text-xs">
                    <Clock className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                    <span className="font-medium">{station.operating_hours}</span>
                  </div>
                )}
                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/50 dark:bg-slate-800/50 text-xs">
                  <Battery className="h-3.5 w-3.5 mr-1 text-blue-500" />
                  <span className="font-medium">{station.capacity || 0} pin</span>
                </div>
              </div>
            </div>
          </div>

      {/* Main Grid - 3 columns side by side */}
      <div className="grid grid-cols-3 gap-4">
        {/* Battery Status - Redesigned */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
          <CardContent className="p-3">
            <div className="flex items-center mb-2">
              <div className="p-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-2 shadow-lg">
                <Battery className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Trạng thái Pin
              </h3>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1.5">
                <div className="text-center p-2 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {station.available_batteries || 0}
                  </div>
                  <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Khả dụng</div>
                </div>
                <div className="text-center p-2 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {station.charging_batteries || 0}
                  </div>
                  <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Đang sạc</div>
                </div>
                <div className="text-center p-2 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                  <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                    {station.maintenance_batteries || 0}
                  </div>
                  <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Bảo trì</div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Tổng sức chứa</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {station.capacity || 0} pin
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Tỷ lệ sử dụng</span>
                  <span className={`text-sm font-bold ${getUtilizationColor(utilization)}`}>
                    {utilization}%
                  </span>
                </div>
                <Progress value={utilization} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics - Redesigned */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
          <CardContent className="p-3">
            <div className="flex items-center mb-2">
              <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-2 shadow-lg">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Hiệu suất Hôm nay
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400 mb-1" />
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {station.daily_swaps || 0}
                </div>
                <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Lần thay</div>
              </div>
              
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400 mb-1" />
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  ${(station.daily_revenue || 0).toLocaleString()}
                </div>
                <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Doanh thu</div>
              </div>
              
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20">
                <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400 mb-1" />
                <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                  {(station.uptime || 0).toFixed(1)}%
                </div>
                <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Uptime</div>
              </div>
              
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
                <Battery className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {station.capacity || 0}
                </div>
                <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Tổng sức chứa</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Station Manager - Redesigned */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
          <CardContent className="p-3">
            <div className="flex items-center mb-2">
              <div className="p-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-2 shadow-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Thông tin Quản lý
              </h3>
            </div>
            {station.manager ? (
              <div className="space-y-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Tên quản lý</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {station.manager.full_name}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Email</div>
                  <div className="font-semibold text-slate-900 dark:text-white text-xs break-all">
                    {station.manager.email || 'N/A'}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Số điện thoại</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {station.manager.phone}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                <Users className="h-8 w-8 mx-auto mb-1 opacity-50" />
                <p className="text-xs">Chưa có quản lý được gán</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 px-6 py-4 border-t flex-shrink-0 bg-white dark:bg-slate-900">
        <Button 
          onClick={onClose}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg px-6"
        >
          Đóng
        </Button>
      </div>
    </div>
  );
};

export default StationDetails;