import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, CheckCircle } from 'lucide-react';
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
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logError } from '../../utils/errorHandler';

type NotificationFilter = 'all' | 'booking_confirmed' | 'booking_cancelled' | 'booking_reminder' | 'unread';

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadNotifications = async () => {
    try {
      const response = await getNotifications({ page: 1, limit: 20 });
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      logError(error, "NotificationBell.loadNotifications");
    }
  };

  useEffect(() => {
    // Load notifications on mount
    loadNotifications();

    // Poll for new notifications every 15 seconds
    pollingIntervalRef.current = setInterval(() => {
      loadNotifications();
    }, 15000);

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
      logError(error, "NotificationBell.handleMarkAsRead");
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      logError(error, "NotificationBell.handleMarkAllAsRead");
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'booking_cancelled':
        return <X className="h-8 w-8 text-red-600" />;
      case 'booking_reminder':
      case 'booking_final_reminder':
        return <Bell className="h-8 w-8 text-orange-500" />;
      case 'payment_success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'payment_failed':
        return <X className="h-8 w-8 text-red-600" />;
      default:
        return <Bell className="h-8 w-8 text-blue-600" />;
    }
  };

  const getNotificationIconBg = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'booking_cancelled':
        return 'bg-red-100 dark:bg-red-900/30';
      case 'booking_reminder':
      case 'booking_final_reminder':
        return 'bg-orange-100 dark:bg-orange-900/30';
      case 'payment_success':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'payment_failed':
        return 'bg-red-100 dark:bg-red-900/30';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30';
    }
  };

  const getActionButton = (notification: Notification) => {
    const data = notification.data || {};
    
    if (notification.type === 'booking_confirmed' && data.booking_id) {
      return (
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-7 rounded-lg"
          onClick={() => {
            handleMarkAsRead(notification.notification_id);
            setOpen(false);
            navigate('/staff/transactions', { 
              state: { highlightBookingId: data.booking_id } 
            });
          }}
        >
          Xem booking
        </Button>
      );
    }
    
    if (notification.type === 'booking_cancelled' && data.booking_id) {
      return (
        <Button
          size="sm"
          variant="outline"
          className="text-xs px-3 py-1 h-7 rounded-lg"
          onClick={() => {
            handleMarkAsRead(notification.notification_id);
            setOpen(false);
            navigate('/staff/transactions');
          }}
        >
          Xem danh sách
        </Button>
      );
    }
    
    return null;
  };

  const getTimeDisplay = (notification: Notification) => {
    const now = new Date();
    const createdAt = new Date(notification.created_at);
    
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    let timeAgo = '';
    if (diffMins < 1) timeAgo = 'Vừa xong';
    else if (diffMins < 60) timeAgo = `${diffMins} phút trước`;
    else if (diffHours < 24) timeAgo = `${diffHours} giờ trước`;
    else if (diffDays < 7) timeAgo = `${diffDays} ngày trước`;
    else timeAgo = formatDate(notification.created_at);
    
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
      case 'booking_confirmed': return 'Đã xác nhận';
      case 'booking_reminder': return 'Nhắc nhở';
      case 'booking_cancelled': return 'Đã hủy';
      default: return 'Tất cả';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-10 w-10 rounded-full hover:bg-green-50/50 dark:hover:bg-emerald-500/10"
        >
          <Bell className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs font-bold border-2 border-white dark:border-slate-800"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl overflow-hidden" 
        align="end" 
        side="bottom"
        sideOffset={8}
      >
        <div className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
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
                <SelectItem value="booking_confirmed">
                  Đã xác nhận ({notifications.filter(n => n.type === 'booking_confirmed').length})
                </SelectItem>
                <SelectItem value="booking_reminder">
                  Nhắc nhở ({notifications.filter(n => n.type === 'booking_reminder' || n.type === 'booking_final_reminder').length})
                </SelectItem>
                <SelectItem value="booking_cancelled">
                  Đã hủy ({notifications.filter(n => n.type === 'booking_cancelled').length})
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
                const hasCheckmark = notification.type === 'booking_confirmed';
                
                return (
                  <div
                    key={notification.notification_id}
                    className={`relative bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-2 ${
                      !notification.is_read 
                        ? 'border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-900/20' 
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
  );
};

export default NotificationBell;

