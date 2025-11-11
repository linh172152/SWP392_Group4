import { API_BASE_URL } from '../config/api';
import authFetch from './apiClient';

export interface AdminStaffSchedule {
  schedule_id: string;
  staff_id: string;
  station_id: string | null;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  status: "scheduled" | "completed" | "absent" | "cancelled";
  notes?: string | null;
  created_at: string;
  updated_at: string;
  staff?: {
    user_id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  station?: {
    station_id: string;
    name: string;
    address: string;
  } | null;
}

export interface CreateStaffScheduleRequest {
  staff_id: string;
  station_id: string | null;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  status?: "scheduled" | "completed" | "absent" | "cancelled";
  notes?: string;
}

export interface UpdateStaffScheduleRequest {
  staff_id?: string;
  station_id?: string | null;
  shift_date?: string;
  shift_start?: string;
  shift_end?: string;
  status?: "scheduled" | "completed" | "absent" | "cancelled";
  notes?: string;
}

export interface GetStaffSchedulesParams {
  staff_id?: string;
  station_id?: string;
  shift_date?: string;
  from_date?: string;
  to_date?: string;
  status?: "scheduled" | "completed" | "absent" | "cancelled";
  page?: number;
  limit?: number;
}

export interface StaffScheduleResponse {
  success: boolean;
  message: string;
  data: {
    schedules: AdminStaffSchedule[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface SingleStaffScheduleResponse {
  success: boolean;
  message: string;
  data: AdminStaffSchedule;
}

/**
 * Get all staff schedules (Admin only)
 */
export async function adminGetStaffSchedules(params?: GetStaffSchedulesParams): Promise<StaffScheduleResponse> {
  const query = new URLSearchParams();
  if (params?.staff_id) query.set('staff_id', params.staff_id);
  if (params?.station_id) query.set('station_id', params.station_id);
  if (params?.shift_date) query.set('shift_date', params.shift_date);
  if (params?.from_date) query.set('from_date', params.from_date);
  if (params?.to_date) query.set('to_date', params.to_date);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const url = `${API_BASE_URL}/admin/staff-schedules${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await authFetch(url);
  return res;
}

/**
 * Get staff schedule by ID (Admin only)
 */
export async function adminGetStaffScheduleById(scheduleId: string): Promise<SingleStaffScheduleResponse> {
  const url = `${API_BASE_URL}/admin/staff-schedules/${scheduleId}`;
  const res = await authFetch(url);
  return res;
}

/**
 * Create new staff schedule (Admin only)
 */
export async function adminCreateStaffSchedule(data: CreateStaffScheduleRequest): Promise<SingleStaffScheduleResponse> {
  const url = `${API_BASE_URL}/admin/staff-schedules`;
  const res = await authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res;
}

/**
 * Update staff schedule (Admin only)
 */
export async function adminUpdateStaffSchedule(
  scheduleId: string, 
  data: UpdateStaffScheduleRequest
): Promise<SingleStaffScheduleResponse> {
  const url = `${API_BASE_URL}/admin/staff-schedules/${scheduleId}`;
  const res = await authFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res;
}

/**
 * Delete staff schedule (Admin only)
 */
export async function adminDeleteStaffSchedule(scheduleId: string): Promise<{ success: boolean; message: string }> {
  const url = `${API_BASE_URL}/admin/staff-schedules/${scheduleId}`;
  const res = await authFetch(url, {
    method: 'DELETE',
  });
  return res;
}

/**
 * Get schedules for a specific date range
 */
export async function adminGetSchedulesByDateRange(
  fromDate: string, 
  toDate: string, 
  params?: Omit<GetStaffSchedulesParams, 'from_date' | 'to_date'>
): Promise<StaffScheduleResponse> {
  return adminGetStaffSchedules({
    ...params,
    from_date: fromDate,
    to_date: toDate,
  });
}

/**
 * Get schedules for a specific staff member
 */
export async function adminGetSchedulesByStaff(
  staffId: string, 
  params?: Omit<GetStaffSchedulesParams, 'staff_id'>
): Promise<StaffScheduleResponse> {
  return adminGetStaffSchedules({
    ...params,
    staff_id: staffId,
  });
}

/**
 * Get schedules for a specific station
 */
export async function adminGetSchedulesByStation(
  stationId: string, 
  params?: Omit<GetStaffSchedulesParams, 'station_id'>
): Promise<StaffScheduleResponse> {
  return adminGetStaffSchedules({
    ...params,
    station_id: stationId,
  });
}

export default {
  adminGetStaffSchedules,
  adminGetStaffScheduleById,
  adminCreateStaffSchedule,
  adminUpdateStaffSchedule,
  adminDeleteStaffSchedule,
  adminGetSchedulesByDateRange,
  adminGetSchedulesByStaff,
  adminGetSchedulesByStation,
};