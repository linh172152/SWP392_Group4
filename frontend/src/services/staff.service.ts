import { API_BASE_URL } from '../config/api';
import authFetch from './apiClient';

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

export default {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
};