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
  Loader2,
  Filter,
  X,
  Edit2
} from 'lucide-react';
import { getMyStaffSchedules, updateScheduleStatus, StaffSchedule } from '../../services/staff.service';
import { useToast } from '../../hooks/use-toast';
import { parseError, logError } from '../../utils/errorHandler';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';

const WorkSchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [allSchedules, setAllSchedules] = useState<StaffSchedule[]>([]); // Store all schedules for calendar highlighting
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [includePast, setIncludePast] = useState(true); // Mặc định hiển thị cả lịch quá khứ
  
  // Update status dialog states
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<StaffSchedule | null>(null);
  const [newStatus, setNewStatus] = useState<'completed' | 'absent' | 'cancelled'>('completed');
  const [updateNotes, setUpdateNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Load once on mount, always load all schedules

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateFrom, dateTo, allSchedules, selectedDate]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all schedules for calendar highlighting
      // We load all and filter client-side to ensure calendar highlighting works correctly
      // Mặc định load tất cả lịch (cả quá khứ) để hiển thị ngay
      const params: {
        include_past?: boolean;
      } = {
        include_past: true, // Luôn load tất cả lịch để hiển thị ngay
      };
      
      const response = await getMyStaffSchedules(params);
      
      if (response && response.success) {
        // Handle both array and non-array responses
        const schedulesData = Array.isArray(response.data) ? response.data : (response.data || []);
        
        // Always set allSchedules, even if empty
        setAllSchedules(schedulesData);
        
        if (schedulesData.length > 0) {
          // Apply filters to show schedules
          applyFiltersToSchedules(schedulesData);
        } else {
          // No schedules found - this is not an error, just empty data
          setSchedules([]);
        }
      } else {
        const errorMsg = response?.message || 'Không thể tải lịch làm việc';
        setError(errorMsg);
        logError(response, "WorkSchedule.loadSchedules");
        const errorInfo = parseError(response);
        toast({
          title: errorInfo.title,
          description: errorInfo.description,
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      logError(err, "WorkSchedule.loadSchedules");
      const errorInfo = parseError(err);
      setError(errorInfo.description);
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersToSchedules = (schedulesToFilter: StaffSchedule[]) => {
    let filtered = [...schedulesToFilter];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }
    
    // Filter by date range (client-side) - priority over selected date
    if (dateFrom || dateTo) {
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(s => {
          const shiftDate = new Date(s.shift_start);
          shiftDate.setHours(0, 0, 0, 0);
          return shiftDate >= fromDate;
        });
      }
      
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(s => {
          const shiftDate = new Date(s.shift_start);
          shiftDate.setHours(0, 0, 0, 0);
          return shiftDate <= toDate;
        });
      }
    } else if (selectedDate) {
      // Only filter by selected date if no date range is set AND a date is actually selected
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      filtered = filtered.filter(s => {
        const shiftDate = new Date(s.shift_date || s.shift_start);
        shiftDate.setHours(0, 0, 0, 0);
        return shiftDate.getTime() === selected.getTime();
      });
    }
    // If no filters are applied, show all schedules
    
    setSchedules(filtered);
  };

  const applyFilters = () => {
    if (allSchedules.length > 0) {
      applyFiltersToSchedules(allSchedules);
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setSelectedDate(undefined);
    // Don't reset includePast here, let user control it
    // Reapply filters after clearing
    if (allSchedules.length > 0) {
      applyFiltersToSchedules(allSchedules);
    }
  };

  // Quick filter functions
  const setQuickFilter = (filter: 'today' | 'thisWeek' | 'thisMonth' | 'nextWeek') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let fromDate: Date;
    let toDate: Date;
    
    switch (filter) {
      case 'today':
        fromDate = new Date(today);
        toDate = new Date(today);
        break;
      case 'thisWeek':
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        toDate = new Date(fromDate);
        toDate.setDate(fromDate.getDate() + 6); // End of week
        break;
      case 'thisMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'nextWeek':
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - today.getDay() + 7); // Next week start
        toDate = new Date(fromDate);
        toDate.setDate(fromDate.getDate() + 6); // Next week end
        break;
    }
    
    setDateFrom(fromDate.toISOString().split('T')[0]);
    setDateTo(toDate.toISOString().split('T')[0]);
  };

  // Get dates that have schedules for calendar highlighting
  const getScheduledDates = () => {
    return allSchedules.map(s => {
      const date = new Date(s.shift_date);
      date.setHours(0, 0, 0, 0);
      return date;
    });
  };

  // Get dates by status for different colors
  const getDatesByStatus = (status: string) => {
    return allSchedules
      .filter(s => s.status === status)
      .map(s => {
        const date = new Date(s.shift_date);
        date.setHours(0, 0, 0, 0);
        return date;
      });
  };

  const handleOpenUpdateDialog = (schedule: StaffSchedule) => {
    if (schedule.status !== 'scheduled') {
      toast({
        title: 'Thông báo',
        description: 'Chỉ có thể cập nhật trạng thái cho các ca đã lên lịch',
        variant: 'default',
      });
      return;
    }
    setSelectedSchedule(schedule);
    setNewStatus('completed');
    setUpdateNotes(schedule.notes || '');
    setUpdateDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedSchedule) return;

    try {
      setUpdating(true);
      const response = await updateScheduleStatus(selectedSchedule.schedule_id, {
        status: newStatus,
        notes: updateNotes.trim() || undefined,
      });

      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật trạng thái lịch làm việc',
          variant: 'default',
        });
        setUpdateDialogOpen(false);
        setSelectedSchedule(null);
        setUpdateNotes('');
        // Reload schedules
        await loadSchedules();
      } else {
        throw new Error(response.message || 'Không thể cập nhật trạng thái');
      }
    } catch (err: any) {
      logError(err, "WorkSchedule.handleUpdateStatus");
      const errorInfo = parseError(err);
      
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
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
        <Card className="glass-card border-0 glow-hover group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Ca sắp tới</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                    {totalScheduled}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Đã hoàn thành</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                    {totalCompleted}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Vắng mặt</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400 bg-clip-text text-transparent">
                    {totalAbsent}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Giờ làm tuần</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-400 dark:to-violet-400 bg-clip-text text-transparent">
                    {totalHours}h
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Filters */}
      <Card className="glass-card border-0 glow">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickFilter('today')}
              className="glass border-slate-200/50 dark:border-slate-700/50"
            >
              Hôm nay
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickFilter('thisWeek')}
              className="glass border-slate-200/50 dark:border-slate-700/50"
            >
              Tuần này
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickFilter('thisMonth')}
              className="glass border-slate-200/50 dark:border-slate-700/50"
            >
              Tháng này
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickFilter('nextWeek')}
              className="glass border-slate-200/50 dark:border-slate-700/50"
            >
              Tuần sau
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="glass-card border-0 glow">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <Label className="text-xs text-slate-600 dark:text-slate-400 mb-2 block">Trạng thái</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="glass border-slate-200/50 dark:border-slate-700/50">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent className="glass-card border-0">
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                  <SelectItem value="completed">Đã hoàn thành</SelectItem>
                  <SelectItem value="absent">Vắng mặt</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="flex-1">
              <Label className="text-xs text-slate-600 dark:text-slate-400 mb-2 block">Từ ngày</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="glass border-slate-200/50 dark:border-slate-700/50"
              />
            </div>

            {/* Date To */}
            <div className="flex-1">
              <Label className="text-xs text-slate-600 dark:text-slate-400 mb-2 block">Đến ngày</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="glass border-slate-200/50 dark:border-slate-700/50"
                min={dateFrom || undefined}
              />
            </div>

            {/* Include Past - Hidden since we always load all schedules now */}
            {/* <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includePast"
                  checked={includePast}
                  onChange={(e) => {
                    setIncludePast(e.target.checked);
                    setTimeout(() => loadSchedules(), 100);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <Label htmlFor="includePast" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                  Bao gồm quá khứ
                </Label>
              </div>
            </div> */}

            {/* Clear Filters */}
            {(statusFilter !== 'all' || dateFrom || dateTo) && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="glass border-slate-200/50 dark:border-slate-700/50"
                >
                  <X className="mr-2 h-4 w-4" />
                  Xóa bộ lọc
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="glass-card border-0 glow">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Lịch tháng</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Chọn ngày để xem thông tin ca làm việc
              <br />
              <span className="text-xs">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                Đã lên lịch • 
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 ml-2"></span>
                Hoàn thành • 
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1 ml-2"></span>
                Vắng mặt
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                // Apply filter immediately when date is selected or deselected
                if (allSchedules.length > 0) {
                  setTimeout(() => {
                    applyFiltersToSchedules(allSchedules);
                  }, 100);
                }
              }}
              className="rounded-md border-0"
              modifiers={{
                hasScheduled: getDatesByStatus('scheduled'),
                hasCompleted: getDatesByStatus('completed'),
                hasAbsent: getDatesByStatus('absent'),
                hasCancelled: getDatesByStatus('cancelled'),
              }}
              modifiersClassNames={{
                hasScheduled: 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-semibold',
                hasCompleted: 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 font-semibold',
                hasAbsent: 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 font-semibold',
                hasCancelled: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100',
              }}
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
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-5 glass-card rounded-xl border-0 animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                        <div className="space-y-2">
                          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </div>
                      </div>
                      <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                      <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-center relative overflow-hidden rounded-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-rose-50/30 dark:from-red-900/20 dark:to-rose-900/20"></div>
                <div className="relative">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                    <div className="relative p-6 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 rounded-full">
                      <AlertCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-red-900 to-rose-700 dark:from-red-200 dark:to-rose-200 bg-clip-text text-transparent mb-3">
                    Có lỗi xảy ra
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">{error}</p>
                  <Button 
                    onClick={loadSchedules} 
                    variant="outline"
                    className="glass border-red-300/50 hover:bg-red-50 dark:border-red-700/50 dark:hover:bg-red-900/20 hover:scale-105 transition-all duration-200"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Thử lại
                  </Button>
                </div>
              </div>
            ) : schedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center relative overflow-hidden rounded-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-900/50 dark:to-slate-800/30"></div>
                <div className="relative">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                    <div className="relative p-6 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full">
                      <CalendarIcon className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  {allSchedules.length === 0 ? (
                    <>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-3">
                        Chưa có lịch làm việc nào
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                        Vui lòng liên hệ quản trị viên để được phân ca làm việc.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-3">
                        Không tìm thấy lịch làm việc
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                        Không có lịch làm việc phù hợp với bộ lọc hiện tại. Thử thay đổi bộ lọc để xem thêm.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          clearFilters();
                          setSelectedDate(undefined);
                        }}
                        className="glass border-blue-300/50 hover:bg-blue-50 dark:border-blue-700/50 dark:hover:bg-blue-900/20 hover:scale-105 transition-all duration-200"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Xóa bộ lọc
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div 
                    key={schedule.schedule_id} 
                    className="p-5 glass-card rounded-xl border-0 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] overflow-hidden relative"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-full blur-3xl opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md">
                            <CalendarIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                              {new Date(schedule.shift_start).toLocaleDateString('vi-VN', { 
                                weekday: 'long', 
                                day: '2-digit', 
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(schedule.status)} shadow-sm text-sm px-3 py-1.5`}>
                            {getStatusIcon(schedule.status)}
                            <span className="ml-1.5 font-medium">{getStatusLabel(schedule.status)}</span>
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenUpdateDialog(schedule)}
                          disabled={schedule.status !== 'scheduled'}
                          className="glass border-blue-300/50 hover:bg-blue-50 dark:border-blue-700/50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-200"
                          title={schedule.status !== 'scheduled' ? 'Chỉ có thể cập nhật trạng thái cho các ca đã lên lịch' : 'Cập nhật trạng thái'}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Cập nhật
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                          <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {formatShiftTime(schedule.shift_start, schedule.shift_end)}
                          </span>
                        </div>
                        {schedule.station && (
                          <div className="flex items-center space-x-2 p-2.5 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{schedule.station.name}</span>
                          </div>
                        )}
                      </div>

                      {schedule.notes && (
                        <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-semibold text-slate-900 dark:text-white">Ghi chú: </span>
                            {schedule.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] glass-card border-0">
          <DialogHeader className="pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                <Edit2 className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Cập nhật trạng thái
              </span>
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Cập nhật trạng thái cho ca làm việc của bạn
            </DialogDescription>
          </DialogHeader>
          
          {selectedSchedule && (
            <div className="space-y-5 py-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-900 dark:text-white">Thông tin ca làm việc</Label>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <p className="text-base font-bold text-blue-900 dark:text-blue-100">
                      {new Date(selectedSchedule.shift_start).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {formatShiftTime(selectedSchedule.shift_start, selectedSchedule.shift_end)}
                    </p>
                  </div>
                  {selectedSchedule.station && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {selectedSchedule.station.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-semibold text-slate-900 dark:text-white">
                  Trạng thái mới <span className="text-red-500">*</span>
                </Label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as 'completed' | 'absent' | 'cancelled')}>
                  <SelectTrigger id="status" className="glass border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-0 bg-white dark:bg-slate-900">
                    <SelectItem value="completed" className="hover:bg-green-50 dark:hover:bg-green-900/20">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Đã hoàn thành</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="absent" className="hover:bg-red-50 dark:hover:bg-red-900/20">
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium">Vắng mặt</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled" className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-slate-600" />
                        <span className="font-medium">Đã hủy</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold text-slate-900 dark:text-white">
                  Ghi chú (tùy chọn)
                </Label>
                <Textarea
                  id="notes"
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Nhập ghi chú về ca làm việc..."
                  className="glass border-slate-200/50 dark:border-slate-700/50 min-h-[100px] bg-white dark:bg-slate-900 resize-none"
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-slate-200/50 dark:border-slate-700/50 pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setUpdateDialogOpen(false);
                setSelectedSchedule(null);
                setUpdateNotes('');
              }}
              disabled={updating}
              className="hover:scale-105 transition-all duration-200"
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={updating}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Cập nhật
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkSchedule;

