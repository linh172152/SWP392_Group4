import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import authFetch from './apiClient';

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
  };
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
  };
  checked_in_by_staff?: {
    user_id: string;
    full_name: string;
    email: string;
  };
}

export interface ConfirmBookingData {
  phone: string;
}

export interface CompleteBookingData {
  old_battery_code: string;
  battery_model: string;
  old_battery_status?: "good" | "damaged" | "maintenance";
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
  user_id: string;  // API uses user_id instead of id
  full_name: string;
  email: string;
  phone: string;
  station_id?: string | null;
  station?: {
    id: string;
    name: string;
  } | null;
  status: 'ACTIVE' | 'INACTIVE';  // API uses uppercase status
  created_at: string;  // This is used as join_date
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
  status: 'ACTIVE' | 'INACTIVE';
}

export async function getAllStaff(params?: {
  station_id?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.station_id) qs.set('station_id', params.station_id);
  if (params?.status) qs.set('status', params.status);
  if (params?.search) qs.set('search', params.search);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));

  const url = `${API_BASE_URL}/admin/staff${qs.toString() ? `?${qs.toString()}` : ''}`;
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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res;
}

export async function updateStaff(id: string, data: Partial<Staff>) {
  const url = `${API_BASE_URL}/admin/staff/${id}`;
  const res = await authFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res;
}

export async function deleteStaff(id: string) {
  const url = `${API_BASE_URL}/admin/staff/${id}`;
  const res = await authFetch(url, {
    method: 'DELETE',
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
  if (params?.status) qs.set('status', params.status);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));

  const url = `${API_ENDPOINTS.STAFF.BOOKINGS}${qs.toString() ? `?${qs.toString()}` : ''}`;
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
export async function confirmBooking(bookingId: string, data: ConfirmBookingData) {
  const url = API_ENDPOINTS.STAFF.CONFIRM_BOOKING(bookingId);
  const res = await authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res; // { success, message, data: { booking, message } }
}

/**
 * Hoàn thành booking (đổi pin)
 */
export async function completeBooking(bookingId: string, data: CompleteBookingData) {
  const url = API_ENDPOINTS.STAFF.COMPLETE_BOOKING(bookingId);
  const res = await authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res; // { success, message, data: { transaction, payment, wallet_balance, message } }
}

/**
 * Hủy booking
 */
export async function cancelBooking(bookingId: string, data?: CancelBookingData) {
  const url = API_ENDPOINTS.STAFF.CANCEL_BOOKING(bookingId);
  const res = await authFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {}),
  });
  return res; // { success, message, data: booking }
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
};