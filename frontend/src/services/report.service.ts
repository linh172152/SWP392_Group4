import { API_ENDPOINTS } from "../config/api";
import authFetch from "./apiClient";

export interface SystemReport {
  total_users: number;
  total_stations: number;
  total_batteries: number;
  total_vehicles: number;
  total_bookings: number;
  total_revenue: number;
  daily_stats: {
    total_swaps: number;
    total_revenue: number;
    active_stations: number;
    completion_rate: number;
  };
  monthly_stats: {
    total_swaps: number;
    total_revenue: number;
    active_subscriptions: number;
    new_users: number;
  };
  station_metrics: Array<{
    station_id: string;
    name: string;
    total_swaps: number;
    total_revenue: number;
    uptime: number;
  }>;
  battery_metrics: Array<{
    type: string;
    total_count: number;
    available: number;
    charging: number;
    maintenance: number;
  }>;
  peak_hours: Array<{
    hour: number;
    count: number;
  }>;
}

export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  station_id?: string;
}

export async function getSystemReport(filters?: ReportFilters) {
  const query = new URLSearchParams();
  if (filters?.start_date) query.set("start_date", filters.start_date);
  if (filters?.end_date) query.set("end_date", filters.end_date);
  if (filters?.station_id) query.set("station_id", filters.station_id);

  // Backend exposes system overview at /api/reports/overview
  const url = `${API_ENDPOINTS.ADMIN.REPORTS}/overview${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await authFetch(url);
  return res;
}

export async function getRevenueReports(filters?: ReportFilters) {
  const query = new URLSearchParams();
  if (filters?.start_date) query.set("start_date", filters.start_date);
  if (filters?.end_date) query.set("end_date", filters.end_date);
  if (filters?.station_id) query.set("station_id", filters.station_id);

  const url = `${API_ENDPOINTS.ADMIN.REPORTS}/revenue${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await authFetch(url);
  return res;
}

export async function getUsageReports(filters?: ReportFilters) {
  const query = new URLSearchParams();
  if (filters?.start_date) query.set("start_date", filters.start_date);
  if (filters?.end_date) query.set("end_date", filters.end_date);
  if (filters?.station_id) query.set("station_id", filters.station_id);

  const url = `${API_ENDPOINTS.ADMIN.REPORTS}/usage${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await authFetch(url);
  return res;
}

export async function getBatteryReports(filters?: ReportFilters) {
  const query = new URLSearchParams();
  if (filters?.start_date) query.set("start_date", filters.start_date);
  if (filters?.end_date) query.set("end_date", filters.end_date);
  if (filters?.station_id) query.set("station_id", filters.station_id);

  const url = `${API_ENDPOINTS.ADMIN.REPORTS}/batteries${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await authFetch(url);
  return res;
}

export interface StationReport {
  station_id: string;
  name: string;
  daily_stats: {
    total_swaps: number;
    total_revenue: number;
    uptime: number;
    battery_usage: number;
  };
  hourly_stats: Array<{
    hour: number;
    swaps: number;
    revenue: number;
  }>;
  battery_status: {
    total: number;
    available: number;
    charging: number;
    maintenance: number;
  };
  popular_hours: Array<{
    hour: number;
    count: number;
  }>;
}

export async function getStationReport(stationId: string, filters?: ReportFilters) {
  const query = new URLSearchParams();
  if (filters?.start_date) query.set("start_date", filters.start_date);
  if (filters?.end_date) query.set("end_date", filters.end_date);

  const url = `${API_ENDPOINTS.ADMIN.REPORTS}/stations/${stationId}${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await authFetch(url);
  return res;
}

export interface UserActivityReport {
  total_users: number;
  active_users: number;
  new_users: number;
  user_types: {
    drivers: number;
    staff: number;
    admins: number;
  };
  subscription_stats: {
    total: number;
    active: number;
    expired: number;
    by_package: Array<{
      package_name: string;
      count: number;
    }>;
  };
  activity_stats: {
    total_logins: number;
    avg_session_duration: number;
    peak_hours: Array<{
      hour: number;
      count: number;
    }>;
  };
}

export async function getUserActivityReport(filters?: ReportFilters) {
  const query = new URLSearchParams();
  if (filters?.start_date) query.set("start_date", filters.start_date);
  if (filters?.end_date) query.set("end_date", filters.end_date);

  const url = `${API_ENDPOINTS.ADMIN.REPORTS}/users${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await authFetch(url);
  return res;
}

export default {
  getSystemReport,
  getStationReport,
  getUserActivityReport,
};