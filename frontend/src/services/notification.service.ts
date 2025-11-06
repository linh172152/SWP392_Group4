import { API_BASE_URL } from "../config/api";
import authFetch from "./apiClient";

export interface Notification {
  notification_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  data?: any;
  created_at: string;
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  data: {
    notifications: Notification[];
    unread_count: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

/**
 * Get user notifications
 */
export async function getNotifications(params?: {
  is_read?: boolean;
  page?: number;
  limit?: number;
}): Promise<NotificationsResponse> {
  const qs = new URLSearchParams();
  if (params?.is_read !== undefined) qs.set("is_read", String(params.is_read));
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));

  const url = `${API_BASE_URL}/driver/notifications${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await authFetch(url);
  return res;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const url = `${API_BASE_URL}/driver/notifications/${notificationId}/read`;
  const res = await authFetch(url, {
    method: "PUT",
  });
  return res;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
  message: string;
}> {
  const url = `${API_BASE_URL}/driver/notifications/read-all`;
  const res = await authFetch(url, {
    method: "PUT",
  });
  return res;
}

export default {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};

