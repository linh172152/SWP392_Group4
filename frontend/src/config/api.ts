// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://ev-battery-backend.onrender.com/api";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    PROFILE: `${API_BASE_URL}/auth/me`,
    VERIFY: `${API_BASE_URL}/auth/verify`,
    GOOGLE: `${API_BASE_URL}/auth/google`,
    GOOGLE_CALLBACK: `${API_BASE_URL}/auth/google/callback`,
  },
  ADMIN: {
    USERS: `${API_BASE_URL}/admin/users`,
    STATIONS: `${API_BASE_URL}/admin/stations`,
    // Reports endpoint in backend is mounted at /api/reports (admin-protected)
    REPORTS: `${API_BASE_URL}/reports`,
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
  DRIVER: {
    VEHICLES: `${API_BASE_URL}/driver/vehicles`,
    STATIONS: `${API_BASE_URL}/driver/stations`,
    BOOKINGS: `${API_BASE_URL}/driver/bookings`,
    TRANSACTIONS: `${API_BASE_URL}/driver/transactions`,
  },
  HEALTH: `${API_BASE_URL}/health`,
};

export default API_ENDPOINTS;
