// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://ev-battery-backend.onrender.com/api";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    PROFILE: `${API_BASE_URL}/auth/me`,
    UPDATE_PROFILE: `${API_BASE_URL}/auth/profile`,
    CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
    UPLOAD_AVATAR: `${API_BASE_URL}/auth/upload-avatar`,
    VERIFY: `${API_BASE_URL}/auth/verify`,
  },
  // Code mới từ team (Updated upstream)
  GOOGLE: {
    AUTH: `${API_BASE_URL}/google/auth`,
    CALLBACK: `${API_BASE_URL}/google/callback`,
    LINK: `${API_BASE_URL}/google/link`,
    UNLINK: `${API_BASE_URL}/google/unlink`,
  },
  ADMIN: {
    USERS: `${API_BASE_URL}/admin/users`,
    STATIONS: `${API_BASE_URL}/admin/stations`,
    // Reports endpoint in backend is mounted at /api/admin/dashboard (admin-protected)
    REPORTS: `${API_BASE_URL}/admin/dashboard`,
    DASHBOARD: `${API_BASE_URL}/admin/dashboard`,
    BATTERIES: `${API_BASE_URL}/admin/batteries`,
  },
  STATION: {
    LIST: `${API_BASE_URL}/stations`,
    PUBLIC: `${API_BASE_URL}/stations/public`,
  },
  BATTERY: {
    LIST: `${API_BASE_URL}/batteries`,
    SWAP: `${API_BASE_URL}/batteries/swap`,
  },
  BOOKING: {
    CREATE: `${API_BASE_URL}/bookings`,
    LIST: `${API_BASE_URL}/bookings`,
    CANCEL: (id: string) => `${API_BASE_URL}/bookings/${id}/cancel`,
    CONFIRM: (id: string) => `${API_BASE_URL}/bookings/${id}/confirm`,
  },
  PAYMENT: {
    CREATE: `${API_BASE_URL}/payments`,
    VNPAY: {
      CREATE: `${API_BASE_URL}/payments/vnpay/create`,
      RETURN: `${API_BASE_URL}/payments/vnpay/return`,
      IPN: `${API_BASE_URL}/payments/vnpay/ipn`,
    },
  },
  VEHICLE: {
    LIST: `${API_BASE_URL}/vehicles`,
    VERIFY: `${API_BASE_URL}/vehicles/verify`,
  },
  SUBSCRIPTION: {
    PACKAGES: `${API_BASE_URL}/subscriptions/packages`,
    SUBSCRIBE: `${API_BASE_URL}/subscriptions/subscribe`,
  },
  SUPPORT: {
    CREATE: `${API_BASE_URL}/support`,
    LIST: `${API_BASE_URL}/support`,
    REPLY: (id: string) => `${API_BASE_URL}/support/${id}/reply`,
  },
  // Code của bạn - Driver endpoints (giữ nguyên)
  DRIVER: {
    VEHICLES: `${API_BASE_URL}/driver/vehicles`,
    STATIONS: `${API_BASE_URL}/driver/stations`,
    BOOKINGS: `${API_BASE_URL}/driver/bookings`,
    TRANSACTIONS: `${API_BASE_URL}/driver/transactions`,
    WALLET: {
      BALANCE: `${API_BASE_URL}/driver/wallet/balance`,
      TRANSACTIONS: `${API_BASE_URL}/driver/wallet/transactions`,
      TOPUP: `${API_BASE_URL}/driver/wallet/topup`,
    },
    TOPUP_PACKAGES: `${API_BASE_URL}/driver/topup-packages`,
    // TODO: BE đang tạo endpoint này, sẽ cập nhật khi BE hoàn thành
    // Pricing endpoint cho driver (chỉ đọc active pricing)
    PRICING: `${API_BASE_URL}/driver/pricing`, // Hoặc có thể là `${API_BASE_URL}/pricing/public` tùy BE
    NOTIFICATIONS: {
      BASE: `${API_BASE_URL}/driver/notifications`,
      MARK_READ: (id: string) => `${API_BASE_URL}/driver/notifications/${id}/read`,
      MARK_ALL_READ: `${API_BASE_URL}/driver/notifications/read-all`,
    },
  },
  // Code của bạn - Subscription endpoints (cập nhật theo BE)
  SUBSCRIPTIONS: {
    BASE: `${API_BASE_URL}/driver/subscriptions`,
    BY_ID: (id: string) => `${API_BASE_URL}/driver/subscriptions/${id}`,
    SUBSCRIBE: (packageId: string) => `${API_BASE_URL}/driver/subscriptions/packages/${packageId}/subscribe`,
    CANCEL: (subscriptionId: string) => `${API_BASE_URL}/driver/subscriptions/${subscriptionId}/cancel`,
  },
  PACKAGES: {
    BASE: `${API_BASE_URL}/packages`,
    BY_ID: (id: string) => `${API_BASE_URL}/packages/${id}`,
  },
  DRIVER_SUBSCRIPTIONS: {
    BASE: `${API_BASE_URL}/driver/subscriptions`,
    SUBSCRIBE: (packageId: string) => `${API_BASE_URL}/driver/subscriptions/packages/${packageId}/subscribe`,
    CANCEL: (subscriptionId: string) => `${API_BASE_URL}/driver/subscriptions/${subscriptionId}/cancel`,
  },
  PUBLIC: {
    STATIONS: `${API_BASE_URL}/stations/public`,
    PRICING: `${API_BASE_URL}/pricing`,
  },
  STAFF: {
    BOOKINGS: `${API_BASE_URL}/staff/bookings`,
    BOOKING_DETAILS: (id: string) => `${API_BASE_URL}/staff/bookings/${id}`,
    CONFIRM_BOOKING: (id: string) => `${API_BASE_URL}/staff/bookings/${id}/confirm`,
    COMPLETE_BOOKING: (id: string) => `${API_BASE_URL}/staff/bookings/${id}/complete`,
    CANCEL_BOOKING: (id: string) => `${API_BASE_URL}/staff/bookings/${id}/cancel`,
    
    // Battery endpoints
    BATTERIES: `${API_BASE_URL}/staff/batteries`,
    BATTERY_DETAILS: (id: string) => `${API_BASE_URL}/staff/batteries/${id}`,
    BATTERY_HISTORY: (id: string) => `${API_BASE_URL}/staff/batteries/${id}/history`,
    ADD_BATTERY: `${API_BASE_URL}/staff/batteries`,
    UPDATE_BATTERY: (id: string) => `${API_BASE_URL}/staff/batteries/${id}`,
    DELETE_BATTERY: (id: string) => `${API_BASE_URL}/staff/batteries/${id}`,
    
    // Schedule endpoints
    SCHEDULES: `${API_BASE_URL}/staff/schedules`,
    UPDATE_SCHEDULE_STATUS: (id: string) => `${API_BASE_URL}/staff/schedules/${id}/status`,
  },
  HEALTH: `${API_BASE_URL}/health`,
};

export async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}) {
  const accessToken = localStorage.getItem("accessToken");
  const headers: HeadersInit = {
    ...(init.headers || {}),
    "Content-Type": (init.headers as any)?.["Content-Type"] || "application/json",
  };
  if (accessToken) {
    (headers as any).Authorization = `Bearer ${accessToken}`;
  }
  const response = await fetch(input, { ...init, headers });
  // Optionally, handle 401 to refresh token here if needed
  return response;
}

export default API_ENDPOINTS;
