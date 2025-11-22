import { API_BASE_URL, API_ENDPOINTS } from "../config/api";
import authFetch from "./apiClient";

// Booking interfaces
export interface StaffBooking {
  booking_id: string;
  booking_code: string;
  user_id: string;
  vehicle_id: string;
  station_id: string;
  battery_model: string;
  scheduled_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  checked_in_at?: string;
  checked_in_by_staff_id?: string;
  is_instant?: boolean;
  notes?: string;
  created_at: string;
  user?: {
    user_id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  vehicle?: {
    vehicle_id: string;
    license_plate: string;
    vehicle_type: string;
    model?: string;
    make?: string;
    year?: number;
    battery_model?: string;
    current_battery?: {
      battery_id: string;
      battery_code: string;
      status: string;
      current_charge: number;
    } | null;
  };
  locked_battery?: {
    battery_id: string;
    battery_code: string;
    model: string;
    status: string;
    current_charge: number;
  } | null;
  station?: {
    station_id: string;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    operating_hours?: string;
  };
  transaction?: {
    transaction_id: string;
    transaction_code: string;
    payment_status: string;
    amount: number;
    swap_at?: string;
    swap_started_at?: string;
    swap_completed_at?: string;
    swap_duration_minutes?: number;
    old_battery?: {
      battery_id: string;
      battery_code: string;
      model: string;
      current_charge: number;
    } | null;
    new_battery?: {
      battery_id: string;
      battery_code: string;
      model: string;
      current_charge: number;
    } | null;
  };
  checked_in_by_staff?: {
    user_id: string;
    full_name: string;
    email: string;
  };
}

export interface ConfirmBookingData {
  // Phone verification đã được bỏ - không cần phone nữa
}

export interface CompleteBookingData {
  old_battery_code: string;
  new_battery_code: string;
  battery_model: string;
  old_battery_status?: "good" | "damaged" | "maintenance";
  old_battery_charge: number;
  new_battery_charge: number;
  notes?: string;
}

export interface CancelBookingData {
  reason?: string;
}

// Staff user interface
export interface Staff {
  station_name: string;
  position: string;
  name: any;
  id: string;
  user_id: string; // API uses user_id instead of id
  full_name: string;
  email: string;
  phone: string;
  station_id?: string | null;
  station?: {
    id: string;
    name: string;
  } | null;
  status: "ACTIVE" | "INACTIVE"; // API uses uppercase status
  created_at: string; // This is used as join_date
  updated_at: string;
  avatar?: string | null;
  auth_provider?: string;
  email_verified?: boolean;
  google_id?: string | null;
  last_login_at?: string | null;
  role?: string;
  _count?: {
    checked_in_bookings: number;
    staff_transactions: number;
  };
}

export interface CreateStaffData {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  station_id: string | null;
  role?: string;
  status: "ACTIVE" | "INACTIVE";
}

export async function getAllStaff(params?: {
  station_id?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.station_id) qs.set("station_id", params.station_id);
  if (params?.status) qs.set("status", params.status);
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));

  const url = `${API_BASE_URL}/admin/staff${
    qs.toString() ? `?${qs.toString()}` : ""
  }`;
  const res = await authFetch(url);
  return res; // expected { success, message, data }
}

export async function getStaffById(id: string) {
  const url = `${API_BASE_URL}/admin/staff/${id}`;
  const res = await authFetch(url);
  return res;
}

export async function createStaff(data: CreateStaffData) {
  const url = `${API_BASE_URL}/admin/staff`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res;
}

export async function updateStaff(id: string, data: Partial<Staff>) {
  const url = `${API_BASE_URL}/admin/staff/${id}`;
  const res = await authFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res;
}

export async function deleteStaff(id: string) {
  const url = `${API_BASE_URL}/admin/staff/${id}`;
  const res = await authFetch(url, {
    method: "DELETE",
  });
  return res;
}

// ============================================
// STAFF BOOKING OPERATIONS (dành cho Staff)
// ============================================

/**
 * Lấy danh sách booking của trạm (cho staff)
 */
export async function getStationBookings(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));

  const url = `${API_ENDPOINTS.STAFF.BOOKINGS}${
    qs.toString() ? `?${qs.toString()}` : ""
  }`;
  const res = await authFetch(url);
  return res; // { success, message, data: { bookings, pagination } }
}

/**
 * Lấy chi tiết booking
 */
export async function getBookingDetails(bookingId: string) {
  const url = API_ENDPOINTS.STAFF.BOOKING_DETAILS(bookingId);
  const res = await authFetch(url);
  return res; // { success, message, data: booking }
}

/**
 * Xác nhận booking (verify số điện thoại)
 */
export async function confirmBooking(
  bookingId: string,
  data: ConfirmBookingData
) {
  const url = API_ENDPOINTS.STAFF.CONFIRM_BOOKING(bookingId);
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res; // { success, message, data: { booking, message } }
}

/**
 * Hoàn thành booking (đổi pin)
 */
export async function completeBooking(
  bookingId: string,
  data: CompleteBookingData
) {
  const url = API_ENDPOINTS.STAFF.COMPLETE_BOOKING(bookingId);
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res; // { success, message, data: { transaction, payment, wallet_balance, message } }
}

/**
 * Hủy booking
 */
export async function cancelBooking(
  bookingId: string,
  data?: CancelBookingData
) {
  const url = API_ENDPOINTS.STAFF.CANCEL_BOOKING(bookingId);
  const res = await authFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {}),
  });
  return res; // { success, message, data: booking }
}

// ============================================
// STAFF BATTERY OPERATIONS
// ============================================

export interface Battery {
  battery_id: string;
  battery_code: string;
  station_id: string;
  model: string;
  capacity_kwh?: number | null;
  voltage?: number | null;
  current_charge: number;
  health_percentage?: number | null;
  cycle_count?: number | null;
  status: "full" | "reserved" | "charging" | "in_use" | "maintenance" | "damaged";
  last_charged_at?: string | null;
  created_at: string;
  updated_at: string;
  station?: {
    station_id: string;
    name: string;
    address: string;
  };
}

// ============================================
// STAFF SCHEDULE INTERFACES
// ============================================

export interface StaffSchedule {
  schedule_id: string;
  staff_id: string;
  station_id: string | null;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  status: "scheduled" | "completed" | "absent" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
  station?: {
    station_id: string;
    name: string;
    address: string;
  } | null;
}

/**
 * Lấy danh sách pin của trạm (cho staff)
 */
export async function getStationBatteries(params?: {
  status?: string;
  model?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.model) qs.set("model", params.model);

  const url = `${API_ENDPOINTS.STAFF.BATTERIES}${
    qs.toString() ? `?${qs.toString()}` : ""
  }`;
  const res = await authFetch(url);
  return res; // { success, message, data: batteries[] }
}

/**
 * Lấy danh sách pin có sẵn cho booking (cho staff)
 */
export interface AvailableBattery {
  battery_id: string;
  battery_code: string;
  model: string;
  status: string;
  current_charge: number;
  capacity_kwh?: number | null;
  health_percentage?: number | null;
}

export interface GetAvailableBatteriesResponse {
  success: boolean;
  message: string;
  data: {
    batteries: AvailableBattery[];
    booking: {
      booking_id: string;
      battery_model: string;
      locked_battery_id: string | null;
    };
  };
}

export async function getAvailableBatteries(
  bookingId: string
): Promise<GetAvailableBatteriesResponse> {
  const url = API_ENDPOINTS.STAFF.AVAILABLE_BATTERIES(bookingId);
  const res = await authFetch(url);
  return res;
}

// ============================================
// STAFF SCHEDULE OPERATIONS
// ============================================

/**
 * Lấy danh sách lịch làm việc của nhân viên đang đăng nhập
 */
export async function getMyStaffSchedules(params?: {
  from?: string;
  to?: string;
  status?: "scheduled" | "completed" | "absent" | "cancelled";
  include_past?: boolean;
}) {
  const qs = new URLSearchParams();
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  if (params?.status) qs.set("status", params.status);
  // Backend expects string "true" or "false", not boolean
  if (params?.include_past !== undefined)
    qs.set("include_past", params.include_past ? "true" : "false");

  const url = `${API_ENDPOINTS.STAFF.SCHEDULES}${
    qs.toString() ? `?${qs.toString()}` : ""
  }`;
  
  console.log('Fetching schedules from:', url);
  const res = await authFetch(url);
  console.log('API response:', res);
  return res; // { success, message, data: schedules[] }
}

/**
 * Cập nhật trạng thái lịch làm việc
 */
export async function updateScheduleStatus(
  scheduleId: string,
  data: {
    status: "completed" | "absent" | "cancelled";
    notes?: string;
  }
) {
  const url = API_ENDPOINTS.STAFF.UPDATE_SCHEDULE_STATUS(scheduleId);
  const res = await authFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res; // { success, message, data: schedule }
}

export default {
  // Admin operations
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,

  // Staff booking operations
  getStationBookings,
  getBookingDetails,
  confirmBooking,
  completeBooking,
  cancelBooking,

  // Staff battery operations
  getStationBatteries,
  getAvailableBatteries,

  // Staff schedule operations
  getMyStaffSchedules,
  updateScheduleStatus,
};
