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

export default {
  getPublicPackages,
};

