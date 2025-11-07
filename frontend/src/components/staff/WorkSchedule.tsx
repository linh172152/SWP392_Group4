import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar } from '../ui/calendar';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Briefcase,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { getMyStaffSchedules, StaffSchedule } from '../../services/staff.service';
import { useToast } from '../../hooks/use-toast';

const WorkSchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'absent': return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50/80 dark:bg-green-500/10 text-green-800 dark:text-green-400 border-green-200/50 dark:border-green-500/20';
      case 'scheduled': return 'bg-blue-50/80 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20';
      case 'absent': return 'bg-red-50/80 dark:bg-red-500/10 text-red-800 dark:text-red-400 border-red-200/50 dark:border-red-500/20';
      case 'cancelled': return 'bg-slate-50/80 dark:bg-slate-500/10 text-slate-800 dark:text-slate-400 border-slate-200/50 dark:border-slate-500/20';
      default: return 'bg-yellow-50/80 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Đã hoàn thành';
      case 'scheduled': return 'Đã lên lịch';
      case 'absent': return 'Vắng mặt';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const formatShiftTime = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startTime = startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const endTime = endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${startTime} - ${endTime}`;
  };

  const calculateTotalHours = () => {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    return schedules
      .filter(s => {
        const shiftStart = new Date(s.shift_start);
        return shiftStart >= thisWeekStart && s.status === 'completed';
      })
      .reduce((total, s) => {
        const start = new Date(s.shift_start);
        const end = new Date(s.shift_end);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }, 0);
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyStaffSchedules({ include_past: false });
      
      if (response.success && response.data) {
        setSchedules(response.data);
      } else {
        setError(response.message || 'Không thể tải lịch làm việc');
        toast({
          title: 'Lỗi',
          description: response.message || 'Không thể tải lịch làm việc',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Đã xảy ra lỗi khi tải lịch làm việc';
      setError(errorMessage);
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalScheduled = schedules.filter(s => s.status === 'scheduled').length;
  const totalCompleted = schedules.filter(s => s.status === 'completed').length;
  const totalAbsent = schedules.filter(s => s.status === 'absent').length;
  const totalHours = Math.round(calculateTotalHours());

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-green-900 dark:from-white dark:to-green-100 bg-clip-text text-transparent">Lịch Làm việc</h1>
          <p className="text-slate-600 dark:text-slate-300">Xem lịch làm việc cá nhân và thông tin ca</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadSchedules}
            disabled={loading}
            variant="outline"
            className="shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Xuất lịch
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Ca sắp tới</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalScheduled}</p>
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-slate-500 to-slate-600 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <XCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Vắng mặt</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalAbsent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Giờ làm tuần</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="glass-card border-0 glow">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Lịch tháng</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Chọn ngày để xem thông tin ca làm việc</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border-0"
            />
          </CardContent>
        </Card>

        {/* Schedule List */}
        <Card className="lg:col-span-2 glass-card border-0 glow">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Lịch làm việc chi tiết</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Danh sách ca làm việc trong tuần</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
                <Button onClick={loadSchedules} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Thử lại
                </Button>
              </div>
            ) : schedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Chưa có lịch làm việc nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div key={schedule.schedule_id} className="p-4 glass rounded-lg hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                          {new Date(schedule.shift_start).toLocaleDateString('vi-VN', { 
                            weekday: 'long', 
                            day: '2-digit', 
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                        <Badge className={getStatusColor(schedule.status)}>
                          {getStatusIcon(schedule.status)}
                          <span className="ml-1">{getStatusLabel(schedule.status)}</span>
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-300">
                          {formatShiftTime(schedule.shift_start, schedule.shift_end)}
                        </span>
                      </div>
                      {schedule.station && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-300">{schedule.station.name}</span>
                        </div>
                      )}
                    </div>

                    {schedule.notes && (
                      <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          <span className="font-medium">Ghi chú: </span>
                          {schedule.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkSchedule;

