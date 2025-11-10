import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Calendar,
  Clock,
  Search,
  Plus,
  Edit3,
  Eye,
  Trash2,
  Users,
  Building,
  Filter,
  CalendarDays,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  adminGetStaffSchedules,
  adminCreateStaffSchedule,
  adminUpdateStaffSchedule,
  adminDeleteStaffSchedule,
} from '../../services/admin-staff-schedule.service';
import type {
  AdminStaffSchedule,
  CreateStaffScheduleRequest,
} from '../../services/admin-staff-schedule.service';
import { getAllStaff } from '../../services/staff.service';
import { getAllStations } from '../../services/station.service';
import type { Staff } from '../../services/staff.service';
import type { Station } from '../../services/station.service';

type StatusFilter = 'all' | 'scheduled' | 'completed' | 'absent' | 'cancelled';
type ViewMode = 'list' | 'calendar';

// Helper functions (moved outside components for shared access)
const formatTime = (timeString: string) => {
  try {
    if (!timeString) return '';
    
    // If it's already a time string (HH:MM format)
    if (timeString.includes(':') && timeString.length <= 8) {
      return timeString.substring(0, 5); // Return HH:MM
    }
    
    // If it's a full DateTime string
    const date = new Date(timeString);
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', timeString);
      return timeString.substring(0, 5) || '';
    }
    
    // Use UTC methods to avoid timezone issues
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'absent': return 'bg-red-100 text-red-800 border-red-200';
    case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Format shift time display with overnight detection
const formatShiftTime = (schedule: AdminStaffSchedule) => {
  const startTime = formatTime(schedule.shift_start);
  const endTime = formatTime(schedule.shift_end);
  
  // Check if it's an overnight shift by comparing dates in UTC
  const startDate = new Date(schedule.shift_start);
  const endDate = new Date(schedule.shift_end);
  
  // More reliable overnight detection using date parts
  const startUTCDate = startDate.getUTCDate();
  const endUTCDate = endDate.getUTCDate();
  
  // Also check if end time is earlier than start time (indicating overnight)
  const startTimeMinutes = startDate.getUTCHours() * 60 + startDate.getUTCMinutes();
  const endTimeMinutes = endDate.getUTCHours() * 60 + endDate.getUTCMinutes();
  
  const isOvernightShift = endUTCDate !== startUTCDate || endTimeMinutes < startTimeMinutes;
  
  if (isOvernightShift) {
    return `${startTime} - ${endTime} (+1)`;
  } else {
    return `${startTime} - ${endTime}`;
  }
};

// Calendar View Component
interface CalendarViewProps {
  schedules: AdminStaffSchedule[];
  onViewSchedule: (schedule: AdminStaffSchedule) => void;
  onEditSchedule: (schedule: AdminStaffSchedule) => void;
  onDeleteSchedule: (scheduleId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ schedules, onViewSchedule, onEditSchedule, onDeleteSchedule }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Get first day of current month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Get first day of calendar (might be from previous month)
  const firstDayOfCalendar = new Date(firstDayOfMonth);
  firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - firstDayOfMonth.getDay());
  
  // Generate calendar days (6 weeks = 42 days)
  const calendarDays: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const day = new Date(firstDayOfCalendar);
    day.setDate(day.getDate() + i);
    calendarDays.push(day);
  }
  
  // Group schedules by date
  const schedulesByDate = schedules.reduce((acc, schedule) => {
    const dateKey = new Date(schedule.shift_date).toISOString().split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(schedule);
    return acc;
  }, {} as Record<string, AdminStaffSchedule[]>);


  
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };
  
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              ←
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Hôm nay
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              →
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center font-medium text-gray-600 bg-gray-50">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {calendarDays.map((day, index) => {
            const dateKey = day.toISOString().split('T')[0];
            const daySchedules = schedulesByDate[dateKey] || [];
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div 
                key={index} 
                className={`
                  min-h-[120px] p-1 border border-gray-200 
                  ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                `}
              >
                <div className={`
                  text-sm font-medium mb-1 
                  ${isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                `}>
                  {day.getDate()}
                </div>
                
                {/* Schedules for this day */}
                <div className="space-y-1">
                  {daySchedules.slice(0, 3).map((schedule) => (
                    <div
                      key={schedule.schedule_id}
                      className={`
                        text-xs p-1 rounded border cursor-pointer
                        hover:shadow-sm transition-all
                        ${getStatusColor(schedule.status)}
                      `}
                      onClick={() => onViewSchedule(schedule)}
                      title={`${schedule.staff?.full_name} - ${formatShiftTime(schedule)}`}
                    >
                      <div className="font-medium truncate">
                        {schedule.staff?.full_name}
                      </div>
                      <div className="opacity-75">
                        {formatShiftTime(schedule)}
                      </div>
                    </div>
                  ))}
                  
                  {/* Show "+X more" if there are more schedules */}
                  {daySchedules.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{daySchedules.length - 3} khác
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const initialFormData: CreateStaffScheduleRequest = {
  staff_id: '',
  station_id: null,
  shift_date: '',
  shift_start: '09:00',
  shift_end: '17:00',
  status: 'scheduled',
  notes: '',
};

const AdminStaffScheduleManagement: React.FC = () => {
  const [schedules, setSchedules] = useState<AdminStaffSchedule[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSchedule, setViewingSchedule] = useState<AdminStaffSchedule | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<AdminStaffSchedule | null>(null);
  const [formData, setFormData] = useState<CreateStaffScheduleRequest>(initialFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [staffFilter, setStaffFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    fetchInitialData();
  }, []);



  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSchedules(),
        fetchStaff(),
        fetchStations(),
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await adminGetStaffSchedules({
        staff_id: staffFilter || undefined,
        station_id: stationFilter || undefined,
        shift_date: dateFilter || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 100, // Get more items to ensure we see new ones
        page: 1
      });
      
      // API returns schedules in response.data.schedules with pagination
      const fetchedSchedules = response.data.schedules || [];
      
      // Debug logging to see what backend returns
      if (fetchedSchedules.length > 0) {
        console.log('Sample schedule from backend:', {
          shift_start: fetchedSchedules[0].shift_start,
          shift_end: fetchedSchedules[0].shift_end,
          formatted_start: formatTime(fetchedSchedules[0].shift_start),
          formatted_end: formatTime(fetchedSchedules[0].shift_end)
        });
      }
      
      setSchedules(fetchedSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Lỗi khi tải danh sách lịch làm việc');
      setSchedules([]);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await getAllStaff();
      setStaff(response.data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Lỗi khi tải danh sách nhân viên');
      setStaff([]);
    }
  };

  const fetchStations = async () => {
    try {
      const response = await getAllStations();
      setStations(response.data || []);
    } catch (error) {
      console.error('Error fetching stations:', error);
      toast.error('Lỗi khi tải danh sách trạm');
      setStations([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.staff_id) {
        toast.error('Vui lòng chọn nhân viên');
        return;
      }
      if (!formData.shift_date) {
        toast.error('Vui lòng chọn ngày làm việc');
        return;
      }
      if (!formData.shift_start || !formData.shift_end) {
        toast.error('Vui lòng nhập giờ bắt đầu và kết thúc');
        return;
      }

      // Validate time logic and handle overnight shifts
      const startTime = new Date(`${formData.shift_date}T${formData.shift_start}`);
      let endTime = new Date(`${formData.shift_date}T${formData.shift_end}`);
      
      // If end time is before start time, it's an overnight shift (next day)
      const isOvernightShift = formData.shift_end <= formData.shift_start;
      
      if (isOvernightShift) {
        // For overnight shifts, add 1 day to end time
        endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
      }
      
      // Calculate shift duration in hours
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      // Validate reasonable shift duration (max 16 hours)
      if (durationHours <= 0 || durationHours > 16) {
        toast.error('Ca làm việc phải từ 1-16 tiếng. Vui lòng kiểm tra lại thời gian.');
        return;
      }

      // Convert time strings to UTC format to match backend expectation
      // Backend stores times as UTC, but we want Vietnam local time to be stored
      const createCorrectDateTime = (date: string, time: string) => {
        // Create date in local timezone (Vietnam)
        const localDateTime = new Date(`${date}T${time}:00`);
        
        // Get timezone offset (Vietnam is UTC+7, so offset will be -420 minutes)
        const offsetMinutes = localDateTime.getTimezoneOffset();
        
        // Subtract the offset to get the time that, when interpreted as UTC by backend,
        // will give us the correct local time when displayed
        const adjustedDateTime = new Date(localDateTime.getTime() - (offsetMinutes * 60 * 1000));
        
        // Return as ISO string (which is UTC format)
        return adjustedDateTime.toISOString();
      };
      
      const shiftStartDateTime = createCorrectDateTime(formData.shift_date, formData.shift_start);
      
      // For overnight shifts, calculate the correct end date
      let shiftEndDateTime;
      if (isOvernightShift) {
        const nextDay = new Date(formData.shift_date);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];
        shiftEndDateTime = createCorrectDateTime(nextDayStr, formData.shift_end);
      } else {
        shiftEndDateTime = createCorrectDateTime(formData.shift_date, formData.shift_end);
      }
      
      const apiData = {
        ...formData,
        shift_start: shiftStartDateTime,
        shift_end: shiftEndDateTime,
        station_id: formData.station_id || null,
        status: formData.status || 'scheduled',
        notes: formData.notes || ''
      };
      
      // Debug logging
      console.log('Sending API data:', {
        originalInput: `${formData.shift_start} - ${formData.shift_end}`,
        sentToAPI: `${shiftStartDateTime} - ${shiftEndDateTime}`,
        isOvernight: isOvernightShift
      });
      
      if (editingSchedule) {
        await adminUpdateStaffSchedule(editingSchedule.schedule_id, apiData);
        toast.success('Cập nhật lịch làm việc thành công!');
      } else {
        await adminCreateStaffSchedule(apiData);
        toast.success('Tạo lịch làm việc thành công!');
      }

      await fetchSchedules();
      setRefreshKey(prev => prev + 1); // Force re-render
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      
      // Handle specific error messages from the backend
      if (error.message.includes('shift_end must be greater than shift_start')) {
        toast.error('Thời gian kết thúc phải lớn hơn thời gian bắt đầu. Vui lòng kiểm tra lại.');
      } else if (error.message.includes('overlapping this time')) {
        toast.error('Nhân viên đã có lịch làm việc trùng thời gian này. Vui lòng chọn thời gian khác.');
      } else if (error.message.includes('Invalid')) {
        toast.error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
      } else {
        toast.error('Lỗi khi lưu lịch làm việc. Vui lòng thử lại.');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'station_id' && value === '' ? null : value,
    }));
  };

  // Check for potential schedule conflicts
  const checkScheduleConflict = (staffId: string, date: string, startTime: string, endTime: string) => {
    if (!staffId || !date || !startTime || !endTime) return false;
    
    const conflictingSchedules = schedules.filter(schedule => {
      if (schedule.staff_id !== staffId) return false;
      if (schedule.shift_date.split('T')[0] !== date) return false;
      if (editingSchedule && schedule.schedule_id === editingSchedule.schedule_id) return false;
      
      // Check time overlap - extract time from datetime strings
      try {
        const existingStart = new Date(schedule.shift_start).toTimeString().slice(0, 5);
        const existingEnd = new Date(schedule.shift_end).toTimeString().slice(0, 5);
        
        const existingStartMinutes = timeToMinutes(existingStart);
        const existingEndMinutes = timeToMinutes(existingEnd);
        const newStartMinutes = timeToMinutes(startTime);
        const newEndMinutes = timeToMinutes(endTime);
        
        return (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes);
      } catch (error) {
        return false;
      }
    });
    
    return conflictingSchedules.length > 0;
  };

  // Helper function to convert time string to minutes
  const timeToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const hasConflict = checkScheduleConflict(
    formData.staff_id,
    formData.shift_date,
    formData.shift_start,
    formData.shift_end
  );

  // Reset all filters and apply immediately
  const resetFilters = async () => {
    setSearchTerm('');
    setStatusFilter('all');
    setStaffFilter('');
    setStationFilter('');
    setDateFilter('');
    
    // Automatically fetch schedules with reset filters
    try {
      const response = await adminGetStaffSchedules({
        limit: 100,
        page: 1
      });
      setSchedules(response.data.schedules || []);
      setRefreshKey(prev => prev + 1); // Force re-render
      toast.success('Đã reset bộ lọc và tải lại dữ liệu');
    } catch (error) {
      console.error('Error fetching schedules after reset:', error);
      toast.error('Lỗi khi tải lại dữ liệu');
    }
  };

  const handleViewSchedule = (schedule: AdminStaffSchedule) => {
    setViewingSchedule(schedule);
    setShowViewModal(true);
  };

  const handleEditSchedule = (schedule: AdminStaffSchedule) => {
    setEditingSchedule(schedule);
    
    // Extract time from DateTime string for the form
    const extractTime = (dateTimeString: string) => {
      try {
        // If it's already in HH:MM format, return as is
        if (/^\d{2}:\d{2}$/.test(dateTimeString)) {
          return dateTimeString;
        }
        
        // Parse as DateTime and extract time
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) {
          return dateTimeString; // Fallback if invalid date
        }
        
        // Use UTC time extraction to match formatTime logic
        // Backend stores adjusted UTC time that represents our local time
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      } catch (error) {
        console.error('Error extracting time:', error, 'from:', dateTimeString);
        return '09:00'; // Safe fallback
      }
    };
    
    setFormData({
      staff_id: schedule.staff_id,
      station_id: schedule.station_id,
      shift_date: schedule.shift_date.split('T')[0], // Extract date part
      shift_start: extractTime(schedule.shift_start),
      shift_end: extractTime(schedule.shift_end),
      status: schedule.status,
      notes: schedule.notes || '',
    });
    setShowCreateModal(true);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lịch làm việc này?')) return;

    try {
      await adminDeleteStaffSchedule(scheduleId);
      toast.success('Xóa lịch làm việc thành công!');
      await fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Lỗi khi xóa lịch làm việc');
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setShowViewModal(false);
    setEditingSchedule(null);
    setViewingSchedule(null);
    setFormData(initialFormData);
  };

  // Ensure schedules is always an array for filtering
  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  // Ensure schedules is always an array for filtering
  const filteredSchedules = safeSchedules
    .filter(schedule => {
      if (statusFilter !== 'all' && schedule.status !== statusFilter) return false;
      if (searchTerm && !schedule.staff?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      // Sort by date and time
      const dateA = new Date(`${a.shift_date} ${a.shift_start}`);
      const dateB = new Date(`${b.shift_date} ${b.shift_start}`);
      return dateB.getTime() - dateA.getTime();
    });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'completed': return 'default';
      case 'absent': return 'destructive';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Đã lên lịch';
      case 'completed': return 'Hoàn thành';
      case 'absent': return 'Vắng mặt';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lí lịch làm việc nhân viên</h1>
          <p className="text-muted-foreground">
            Quản lý lịch làm việc của nhân viên tại các trạm.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            size="sm"
          >
            Xem danh sách
          </Button>
          <Button 
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
            size="sm"
          >
            Xem lịch
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo lịch mới
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Tổng lịch</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{Array.isArray(schedules) ? schedules.length : 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Đã lên lịch</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {Array.isArray(schedules) ? schedules.filter(s => s.status === 'scheduled').length : 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-amber-50 to-yellow-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Hoàn thành</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">
              {Array.isArray(schedules) ? schedules.filter(s => s.status === 'completed').length : 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-red-50 to-rose-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Vắng mặt</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {Array.isArray(schedules) ? schedules.filter(s => s.status === 'absent').length : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-100 border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
            <Filter className="h-5 w-5 text-slate-600" />
            Bộ lọc và tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm nhân viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="scheduled">Đã lên lịch</option>
              <option value="completed">Hoàn thành</option>
              <option value="absent">Vắng mặt</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Tất cả nhân viên</option>
              {staff.map((s) => (
                <option key={s.user_id} value={s.user_id}>
                  {s.full_name}
                </option>
              ))}
            </select>
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Tất cả trạm</option>
              {stations.map((station) => (
                <option key={station.station_id} value={station.station_id}>
                  {station.name}
                </option>
              ))}
            </select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchSchedules}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Áp dụng bộ lọc
            </Button>
            <Button onClick={resetFilters} variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Đặt lại bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedules Content - List or Calendar View */}
      <div key={refreshKey}>
        {loading ? (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600 animate-pulse">Đang tải lịch làm việc...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">Không tìm thấy lịch làm việc nào</p>
              <p className="text-gray-400 text-sm mt-2">Hãy thử thay đổi bộ lọc hoặc tạo lịch mới</p>
            </CardContent>
          </Card>
        ) : viewMode === 'list' ? (
          // List View
          <div className="space-y-4">
            {filteredSchedules.map((schedule) => (
              <Card key={schedule.schedule_id} className="transition-all duration-200 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{schedule.staff?.full_name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(schedule.shift_date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatShiftTime(schedule)}
                          </div>
                          {schedule.station && (
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              {schedule.station.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={getStatusBadgeVariant(schedule.status)}>
                        {getStatusLabel(schedule.status)}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSchedule(schedule)}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Xem
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSchedule(schedule)}
                          className="gap-1"
                        >
                          <Edit3 className="h-3 w-3" />
                          Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.schedule_id)}
                          className="gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                  {schedule.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600">
                        <strong>Ghi chú:</strong> {schedule.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Calendar View
          <CalendarView 
            schedules={filteredSchedules}
            onViewSchedule={handleViewSchedule}
            onEditSchedule={handleEditSchedule}
            onDeleteSchedule={handleDeleteSchedule}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? 'Chỉnh sửa lịch làm việc' : 'Tạo lịch làm việc mới'}
            </DialogTitle>
            <DialogDescription>
              {editingSchedule 
                ? 'Cập nhật thông tin lịch làm việc' 
                : 'Điền thông tin để tạo lịch làm việc mới'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nhân viên *</label>
                <select
                  name="staff_id"
                  value={formData.staff_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Chọn nhân viên</option>
                  {staff.map((s) => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.full_name} - {s.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Trạm</label>
                <select
                  name="station_id"
                  value={formData.station_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Chọn trạm (tuỳ chọn)</option>
                  {stations.map((station) => (
                    <option key={station.station_id} value={station.station_id}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conflict Warning */}
            {hasConflict && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">⚠️</span>
                  <span className="text-sm text-red-700 font-medium">
                    Cảnh báo: Nhân viên đã có lịch làm việc trùng thời gian này!
                  </span>
                </div>
                <p className="text-xs text-red-600 mt-1 ml-6">
                  Vui lòng chọn thời gian khác hoặc nhân viên khác.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ngày làm việc *</label>
                <Input
                  name="shift_date"
                  type="date"
                  value={formData.shift_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Giờ bắt đầu *</label>
                <Input
                  name="shift_start"
                  type="time"
                  value={formData.shift_start}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Giờ kết thúc *</label>
                <Input
                  name="shift_end"
                  type="time"
                  value={formData.shift_end}
                  onChange={handleInputChange}
                  required
                />
                {formData.shift_start && formData.shift_end && formData.shift_end <= formData.shift_start && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    ℹ️ Ca làm việc qua đêm: Kết thúc vào sáng hôm sau ({formData.shift_end})
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="scheduled">Đã lên lịch</option>
                <option value="completed">Hoàn thành</option>
                <option value="absent">Vắng mặt</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ghi chú</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Ghi chú thêm về ca làm việc..."
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">
                Hủy
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={hasConflict}
                title={hasConflict ? "Không thể tạo lịch vì có xung đột thời gian" : ""}
              >
                {editingSchedule ? 'Cập nhật' : 'Tạo lịch'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết lịch làm việc</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về ca làm việc
            </DialogDescription>
          </DialogHeader>
          {viewingSchedule && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Nhân viên</h3>
                    <p className="font-semibold">{viewingSchedule.staff?.full_name}</p>
                    <p className="text-sm text-gray-600">{viewingSchedule.staff?.email}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Ngày làm việc</h3>
                    <p className="font-semibold">{formatDate(viewingSchedule.shift_date)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Giờ làm việc</h3>
                    <p className="font-semibold">
                      {formatShiftTime(viewingSchedule)}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Trạm làm việc</h3>
                    <p className="font-semibold">
                      {viewingSchedule.station?.name || 'Chưa chỉ định'}
                    </p>
                    {viewingSchedule.station && (
                      <p className="text-sm text-gray-600">{viewingSchedule.station.address}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Trạng thái</h3>
                    <Badge variant={getStatusBadgeVariant(viewingSchedule.status)}>
                      {getStatusLabel(viewingSchedule.status)}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Ngày tạo</h3>
                    <p className="text-sm">{new Date(viewingSchedule.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              </div>

              {viewingSchedule.notes && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Ghi chú</h3>
                  <p className="text-sm leading-relaxed bg-gray-50 p-3 rounded-md">{viewingSchedule.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleCloseModal} className="flex-1">
                  Đóng
                </Button>
                <Button onClick={() => {
                  handleCloseModal();
                  handleEditSchedule(viewingSchedule);
                }} className="flex-1 gap-2">
                  <Edit3 className="h-4 w-4" />
                  Chỉnh sửa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStaffScheduleManagement;