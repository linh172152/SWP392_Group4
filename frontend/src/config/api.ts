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
  },
  ADMIN: {
    USERS: `${API_BASE_URL}/admin/users`,
    // other admin endpoints can be added here (stations, reports...)
  },
  HEALTH: `${API_BASE_URL}/health`,
};

export default API_ENDPOINTS;
