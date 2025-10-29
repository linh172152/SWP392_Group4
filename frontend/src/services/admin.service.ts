import { API_ENDPOINTS } from "../config/api";
import authFetch from "./apiClient";

export interface AdminUser {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  status?: string;
  phone?: string;
  avatar?: string;
}

export async function getAllUsers(params?: { page?: number; limit?: number; role?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.role) query.set("role", params.role);
  if (params?.status) query.set("status", params.status);

  const url = `${API_ENDPOINTS.ADMIN.USERS}${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await authFetch(url);
  return res;
}

export async function getUserById(id: string) {
  const url = `${API_ENDPOINTS.ADMIN.USERS}/${id}`;
  const res = await authFetch(url);
  return res;
}

export async function createUser(data: {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
  station_id?: string | null;
}) {
  // Use auth register endpoint to let backend hash password correctly
  const body = {
    full_name: data.full_name,
    email: data.email,
    password: data.password,
    phone: data.phone,
    role: data.role?.toUpperCase() || 'DRIVER',
  };

  const res = await authFetch(API_ENDPOINTS.AUTH.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return res;
}

export async function updateUser(id: string, data: { full_name?: string; email?: string; phone?: string; avatar?: string }) {
  const url = `${API_ENDPOINTS.ADMIN.USERS}/${id}`;
  const res = await authFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res;
}

export async function updateUserStatus(id: string, status: string) {
  const url = `${API_ENDPOINTS.ADMIN.USERS}/${id}/status`;
  const res = await authFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return res;
}

export async function updateUserRole(id: string, role: string, station_id?: string | null) {
  const url = `${API_ENDPOINTS.ADMIN.USERS}/${id}/role`;
  const res = await authFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: role.toUpperCase(), station_id }),
  });
  return res;
}

export async function deleteUser(id: string) {
  const url = `${API_ENDPOINTS.ADMIN.USERS}/${id}`;
  const res = await authFetch(url, { method: 'DELETE' });
  return res;
}

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
};
