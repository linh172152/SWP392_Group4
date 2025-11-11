import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, Calendar, Battery } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, type Notification } from '../../services/notification.service';
import { formatDate } from '../../utils/format';
// Removed toast import - không hiển thị toast notifications, chỉ hiển thị số trên bell
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type NotificationFilter = 'all' | 'payment_success' | 'booking_confirmed' | 'booking_reminder' | 'booking_cancelled' | 'topup_success' | 'unread';

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastNotificationIdRef = useRef<string | null>(null);

  const loadNotifications = async () => {
    try {
      const response = await getNotifications({ page: 1, limit: 20 });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unread_count);
      
      // Track latest notification ID (không hiển thị toast - driver sẽ tự vào xem)
      if (response.data.notifications.length > 0) {
        const latestNotification = response.data.notifications[0];
        // Chỉ update lastNotificationIdRef để track, không hiển thị toast
        if (!lastNotificationIdRef.current) {
          lastNotificationIdRef.current = latestNotification.notification_id;
        } else if (latestNotification.notification_id !== lastNotificationIdRef.current) {
          // Có thông báo mới - chỉ update ref, không hiển thị toast
          lastNotificationIdRef.current = latestNotification.notification_id;
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useEffect(() => {
    // Load notifications on mount
    loadNotifications();

    // Poll for new notifications every 10 seconds
    pollingIntervalRef.current = setInterval(() => {
      loadNotifications();
    }, 10000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_success':
        return <Battery className="h-8 w-8 text-green-600" />;
      case 'payment_failed':
        return <X className="h-8 w-8 text-red-600" />;
      case 'booking_confirmed':
        return <Calendar className="h-8 w-8 text-blue-600" />;
      case 'booking_cancelled':
        return <X className="h-8 w-8 text-red-600" />;
      case 'booking_reminder':
      case 'booking_final_reminder':
        return <Bell className="h-8 w-8 text-orange-500" />;
      case 'topup_success':
        return <Battery className="h-8 w-8 text-green-600" />;
      default:
        return <Bell className="h-8 w-8 text-blue-600" />;
    }
  };

  const getNotificationIconBg = (type: string) => {
    switch (type) {
      case 'payment_success':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'payment_failed':
        return 'bg-red-100 dark:bg-red-900/30';
      case 'booking_confirmed':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case 'booking_cancelled':
        return 'bg-red-100 dark:bg-red-900/30';
      case 'booking_reminder':
      case 'booking_final_reminder':
        return 'bg-orange-100 dark:bg-orange-900/30';
      case 'topup_success':
        return 'bg-green-100 dark:bg-green-900/30';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30';
    }
  };

  const getActionButton = (notification: Notification) => {
    const data = notification.data || {};
    
    if (notification.type === 'payment_success' && data.transaction_id) {
      return (
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-7 rounded-lg"
          onClick={() => {
            handleMarkAsRead(notification.notification_id);
            setOpen(false);
            navigate('/driver/transactions');
          }}
        >
          Xem hóa đơn
        </Button>
      );
    }
    
    if (notification.type === 'booking_confirmed' && data.booking_id) {
      return (
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-7 rounded-lg"
          onClick={() => {
            handleMarkAsRead(notification.notification_id);
            setOpen(false);
            // Navigate to bookings page - user sẽ thấy booking trong list
            // Có thể thêm query param để highlight booking nếu cần
            navigate('/driver/bookings', { 
              state: { highlightBookingId: data.booking_id } 
            });
          }}
        >
          Chi tiết
        </Button>
      );
    }
    
    if ((notification.type === 'booking_reminder' || notification.type === 'booking_final_reminder') && data.station_id) {
      return (
        <Button
          size="sm"
          className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1 h-7 rounded-lg"
          onClick={() => {
            handleMarkAsRead(notification.notification_id);
            setOpen(false);
            navigate(`/driver/station/${data.station_id}`);
          }}
        >
          Xem đường đi
        </Button>
      );
    }
    
    return null;
  };

  const getTimeDisplay = (notification: Notification) => {
    const now = new Date();
    const createdAt = new Date(notification.created_at);
    
    // Tính thời gian đã trôi qua (cho tất cả notifications)
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // Format thời gian đã trôi qua
    let timeAgo = '';
    if (diffMins < 1) timeAgo = 'Vừa xong';
    else if (diffMins < 60) timeAgo = `${diffMins} phút trước`;
    else if (diffHours < 24) timeAgo = `${diffHours} giờ trước`;
    else if (diffDays < 7) timeAgo = `${diffDays} ngày trước`;
    else timeAgo = formatDate(notification.created_at);
    
    // Với các thông báo reminder và confirmed: Tính thời gian còn lại
    const data = notification.data || {};
    const shouldShowTimeRemaining = 
      (notification.type === 'booking_reminder' || 
       notification.type === 'booking_final_reminder' || 
       notification.type === 'booking_confirmed') &&
      !notification.type.includes('cancelled');
    
    if (shouldShowTimeRemaining && (data.scheduledTime || data.bookingTime)) {
      const scheduledTime = new Date(data.scheduledTime || data.bookingTime);
      const remainingMs = scheduledTime.getTime() - now.getTime();
      
      if (remainingMs > 0) {
        const remainingMins = Math.floor(remainingMs / 60000);
        const remainingHours = Math.floor(remainingMs / 3600000);
        const remainingDays = Math.floor(remainingMs / 86400000);
        
        let timeRemaining = '';
        if (remainingMins < 60) timeRemaining = `Còn ${remainingMins} phút`;
        else if (remainingHours < 24) timeRemaining = `Còn ${remainingHours} giờ`;
        else if (remainingDays < 7) timeRemaining = `Còn ${remainingDays} ngày`;
        else timeRemaining = formatDate(scheduledTime.toISOString());
        
        // Hiển thị cả thời gian còn lại và thời gian đã trôi qua
        return `${timeRemaining} • ${timeAgo}`;
      }
    }
    
    // Với các thông báo khác (cancelled, payment, etc.): Chỉ hiển thị thời gian đã trôi qua
    return timeAgo;
  };

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'booking_reminder') {
      return notification.type === 'booking_reminder' || notification.type === 'booking_final_reminder';
    }
    return notification.type === filter;
  });

  // Get filter label
  const getFilterLabel = (filterType: NotificationFilter): string => {
    switch (filterType) {
      case 'all': return 'Tất cả';
      case 'unread': return 'Chưa đọc';
      case 'payment_success': return 'Thanh toán';
      case 'booking_confirmed': return 'Đặt chỗ';
      case 'booking_reminder': return 'Nhắc nhở';
      case 'booking_cancelled': return 'Đã hủy';
      case 'topup_success': return 'Nạp tiền';
      default: return 'Tất cả';
    }
  };

  // Debug: Log when component renders
  useEffect(() => {
    console.log('NotificationBell mounted, unreadCount:', unreadCount);
  }, [unreadCount]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999]" style={{ pointerEvents: 'auto' }}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            className="relative h-14 w-14 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
          >
            <div className="flex items-center justify-center">
              <Bell className="h-9 w-9 text-white" strokeWidth={3} fill="rgba(255, 255, 255, 0.1)" />
            </div>
            {unreadCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 bg-white text-red-600 text-xs font-bold border-2 border-red-600"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-96 p-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl overflow-hidden" 
          align="end" 
          side="top"
          sideOffset={8}
          alignOffset={-16}
        >
        <div className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="flex items-center justify-between p-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Thông báo
              {unreadCount > 0 && (
                <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                  ({unreadCount} chưa đọc)
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-xs hover:bg-white/50 dark:hover:bg-slate-700/50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Đọc tất cả
                  </>
                )}
              </Button>
            )}
          </div>
          {/* Filter */}
          <div className="px-4 pb-3">
            <Select value={filter} onValueChange={(value) => setFilter(value as NotificationFilter)}>
              <SelectTrigger className="w-full h-9 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                <SelectValue placeholder="Lọc thông báo" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
                <SelectItem value="all">Tất cả ({notifications.length})</SelectItem>
                <SelectItem value="unread">Chưa đọc ({unreadCount})</SelectItem>
                <SelectItem value="payment_success">
                  Thanh toán ({notifications.filter(n => n.type === 'payment_success').length})
                </SelectItem>
                <SelectItem value="booking_confirmed">
                  Đặt chỗ ({notifications.filter(n => n.type === 'booking_confirmed').length})
                </SelectItem>
                <SelectItem value="booking_reminder">
                  Nhắc nhở ({notifications.filter(n => n.type === 'booking_reminder' || n.type === 'booking_final_reminder').length})
                </SelectItem>
                <SelectItem value="booking_cancelled">
                  Đã hủy ({notifications.filter(n => n.type === 'booking_cancelled').length})
                </SelectItem>
                <SelectItem value="topup_success">
                  Nạp tiền ({notifications.filter(n => n.type === 'topup_success').length})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <ScrollArea className="h-[500px] bg-slate-50 dark:bg-slate-900/50">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>
                {notifications.length === 0 
                  ? 'Chưa có thông báo nào' 
                  : `Không có thông báo "${getFilterLabel(filter)}"`}
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {filteredNotifications.map((notification) => {
                const actionButton = getActionButton(notification);
                const hasCheckmark = notification.type === 'payment_success' || notification.type === 'booking_confirmed';
                
                return (
                  <div
                    key={notification.notification_id}
                    className={`relative bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-2 ${
                      !notification.is_read 
                        ? 'border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-900/20' 
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`relative flex-shrink-0 ${getNotificationIconBg(notification.type)} rounded-full p-3`}>
                          {getNotificationIcon(notification.type)}
                          {hasCheckmark && (
                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white dark:border-slate-800">
                              <CheckCheck className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 flex-shrink-0"
                                onClick={() => handleMarkAsRead(notification.notification_id)}
                              >
                                <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {getTimeDisplay(notification)}
                            </p>
                            {actionButton && (
                              <div className="flex-shrink-0">
                                {actionButton}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
    </div>
  );
};

export default NotificationBell;

