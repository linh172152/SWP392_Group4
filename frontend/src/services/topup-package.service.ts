import { API_BASE_URL } from "../config/api";
import authFetch from "./apiClient";

export interface TopUpPackage {
  package_id: string;
  name: string;
  description?: string | null;
  topup_amount: number;
  bonus_amount: number;
  actual_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TopUpPackageFilters {
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface TopUpPackageResponse {
  success: boolean;
  message: string;
  data: {
    packages: TopUpPackage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface SingleTopUpPackageResponse {
  success: boolean;
  message: string;
  data: TopUpPackage;
}

/**
 * Get all top-up packages
 * For drivers: use /api/driver/topup-packages
 * For admins: use /api/admin/topup-packages
 */
export async function getTopUpPackages(filters?: TopUpPackageFilters & { forDriver?: boolean }): Promise<TopUpPackageResponse> {
  const qs = new URLSearchParams();
  if (filters?.is_active !== undefined) qs.set("is_active", String(filters.is_active));
  if (filters?.page) qs.set("page", String(filters.page));
  if (filters?.limit) qs.set("limit", String(filters.limit));

  // Use driver endpoint if forDriver is true, otherwise use admin endpoint
  const baseUrl = filters?.forDriver 
    ? `${API_BASE_URL}/driver/topup-packages`
    : `${API_BASE_URL}/admin/topup-packages`;
  
  const url = `${baseUrl}${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await authFetch(url);
  return res;
}

/**
 * Get top-up package by ID
 */
export async function getTopUpPackageById(id: string): Promise<SingleTopUpPackageResponse> {
  const url = `${API_BASE_URL}/admin/topup-packages/${id}`;
  const res = await authFetch(url);
  return res;
}

/**
 * Create top-up package
 */
export async function createTopUpPackage(payload: {
  name: string;
  description?: string;
  topup_amount: number;
  bonus_amount: number;
  is_active?: boolean;
}): Promise<SingleTopUpPackageResponse> {
  const url = `${API_BASE_URL}/admin/topup-packages`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res;
}

/**
 * Update top-up package
 */
export async function updateTopUpPackage(
  id: string,
  payload: {
    name?: string;
    description?: string;
    topup_amount?: number;
    bonus_amount?: number;
    is_active?: boolean;
  }
): Promise<SingleTopUpPackageResponse> {
  const url = `${API_BASE_URL}/admin/topup-packages/${id}`;
  const res = await authFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res;
}

/**
 * Delete top-up package
 */
export async function deleteTopUpPackage(id: string): Promise<{ success: boolean; message: string }> {
  const url = `${API_BASE_URL}/admin/topup-packages/${id}`;
  const res = await authFetch(url, {
    method: "DELETE",
  });
  return res;
}

export default {
  getTopUpPackages,
  getTopUpPackageById,
  createTopUpPackage,
  updateTopUpPackage,
  deleteTopUpPackage,
};
