import { API_BASE_URL } from "../config/api";
import authFetch from "./apiClient";

export interface ServicePackage {
  package_id: string;
  name: string;
  description?: string | null;
  price: number;
  battery_capacity_kwh: number;
  swap_limit?: number | null;
  duration_days: number;
  battery_models?: any; // JSON field
  benefits?: any; // JSON field
  billing_cycle: "monthly" | "yearly" | "custom";
  metadata?: any; // JSON field
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetPackagesResponse {
  success: boolean;
  message: string;
  data: ServicePackage[];
}

/**
 * Get public service packages
 * @param capacity Optional filter by battery capacity (kWh)
 */
export async function getPublicPackages(capacity?: number): Promise<GetPackagesResponse> {
  const url = new URL(`${API_BASE_URL}/packages`);
  if (capacity !== undefined) {
    url.searchParams.set("capacity", String(capacity));
  }
  const res = await authFetch(url.toString());
  return res;
}

/**
 * Get all service packages (Admin only)
 */
export async function adminGetPackages(): Promise<GetPackagesResponse> {
  const res = await authFetch(`${API_BASE_URL}/admin/packages`);
  return res;
}

export interface CreatePackageRequest {
  name: string;
  description?: string;
  battery_capacity_kwh: number;
  duration_days: number;
  price: number;
  billing_cycle: "monthly" | "yearly" | "custom";
  benefits?: string[];
  is_active?: boolean;
  metadata?: any;
}

export interface UpdatePackageRequest {
  name?: string;
  description?: string;
  battery_capacity_kwh?: number;
  duration_days?: number;
  price?: number;
  billing_cycle?: "monthly" | "yearly" | "custom";
  benefits?: string[];
  is_active?: boolean;
  metadata?: any;
}

export interface CreatePackageResponse {
  success: boolean;
  message: string;
  data: ServicePackage;
}

export interface UpdatePackageResponse {
  success: boolean;
  message: string;
  data: ServicePackage;
}

/**
 * Create a new service package (Admin only)
 */
export async function adminCreatePackage(packageData: CreatePackageRequest): Promise<CreatePackageResponse> {
  const res = await authFetch(`${API_BASE_URL}/admin/packages`, {
    method: 'POST',
    body: JSON.stringify(packageData),
  });
  return res;
}

/**
 * Update an existing service package (Admin only)
 */
export async function adminUpdatePackage(packageId: string, packageData: UpdatePackageRequest): Promise<UpdatePackageResponse> {
  const res = await authFetch(`${API_BASE_URL}/admin/packages/${packageId}`, {
    method: 'PUT',
    body: JSON.stringify(packageData),
  });
  return res;
}

export default {
  getPublicPackages,
  adminGetPackages,
  adminCreatePackage,
  adminUpdatePackage,
};

