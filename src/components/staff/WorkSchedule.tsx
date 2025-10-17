import React, { useState } from 'react';
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
  Briefcase
} from 'lucide-react';

// Dữ liệu lịch làm việc mẫu
const workSchedule = [
  {
    date: '2024-01-15',
    shift: 'Sáng (6:00 - 14:00)',
    station: 'Trung tâm EV Thành phố',
    status: 'scheduled',
    coWorkers: ['Nguyễn Văn Minh', 'Lê Thị Hoa']
  },
  {
    date: '2024-01-16',  
    shift: 'Sáng (6:00 - 14:00)',
    station: 'Trung tâm EV Thành phố',
    status: 'completed',
    coWorkers: ['Nguyễn Văn Minh', 'Trần Văn Nam']
  },
  {
    date: '2024-01-17',
    shift: 'Chiều (14:00 - 22:00)',
    station: 'Trung tâm EV Thành phố', 
    status: 'completed',
    coWorkers: ['Phạm Thị Thu', 'Lê Hoàng Nam']
  },
  {
    date: '2024-01-18',
    shift: 'Nghỉ',
    station: '',
    status: 'off',
    coWorkers: []
  },
  {
    date: '2024-01-19',
    shift: 'Sáng (6:00 - 14:00)',
    station: 'Trung tâm EV Thành phố',
    status: 'scheduled',
    coWorkers: ['Nguyễn Văn Minh', 'Lê Thị Hoa']
  }
];

const WorkSchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'off': return <XCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50/80 dark:bg-green-500/10 text-green-800 dark:text-green-400 border-green-200/50 dark:border-green-500/20';
      case 'scheduled': return 'bg-blue-50/80 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20';
      case 'off': return 'bg-slate-50/80 dark:bg-slate-500/10 text-slate-800 dark:text-slate-400 border-slate-200/50 dark:border-slate-500/20';
      default: return 'bg-yellow-50/80 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Đã hoàn thành';
      case 'scheduled': return 'Đã lên lịch';
      case 'off': return 'Nghỉ';
      default: return status;
    }
  };

  const totalScheduled = workSchedule.filter(s => s.status === 'scheduled').length;
  const totalCompleted = workSchedule.filter(s => s.status === 'completed').length;
  const totalDaysOff = workSchedule.filter(s => s.status === 'off').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-green-900 dark:from-white dark:to-green-100 bg-clip-text text-transparent">Lịch Làm việc</h1>
          <p className="text-slate-600 dark:text-slate-300">Xem lịch làm việc cá nhân và thông tin ca</p>
        </div>
        <Button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Xuất lịch
        </Button>
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
                <p className="text-sm text-slate-600 dark:text-slate-400">Ngày nghỉ</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalDaysOff}</p>
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white">40h</p>
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
            <div className="space-y-4">
              {workSchedule.map((schedule, index) => (
                <div key={index} className="p-4 glass rounded-lg hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {new Date(schedule.date).toLocaleDateString('vi-VN', { 
                          weekday: 'long', 
                          day: '2-digit', 
                          month: '2-digit' 
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
                      <span className="text-slate-600 dark:text-slate-300">{schedule.shift}</span>
                    </div>
                    {schedule.station && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-300">{schedule.station}</span>
                      </div>
                    )}
                  </div>

                  {schedule.coWorkers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Đồng nghiệp:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {schedule.coWorkers.map((coWorker, i) => (
                          <Badge key={i} variant="outline" className="text-xs glass border-slate-200/50 dark:border-slate-700/50">
                            {coWorker}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkSchedule;