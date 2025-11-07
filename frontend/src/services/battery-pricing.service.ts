import { API_BASE_URL, API_ENDPOINTS } from "../config/api";
import authFetch from "./apiClient";

export interface BatteryPricing {
  pricing_id: string;
  battery_model: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BatteryPricingFilters {
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface BatteryPricingResponse {
  success: boolean;
  message: string;
  data: {
    pricings: BatteryPricing[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface SingleBatteryPricingResponse {
  success: boolean;
  message: string;
  data: BatteryPricing;
}

/**
 * Get all battery pricing (public endpoint - no auth required)
 */
export async function getBatteryPricing(filters?: BatteryPricingFilters): Promise<BatteryPricingResponse> {
  const qs = new URLSearchParams();
  if (filters?.is_active !== undefined) qs.set("is_active", String(filters.is_active));
  if (filters?.page) qs.set("page", String(filters.page));
  if (filters?.limit) qs.set("limit", String(filters.limit));

  // Use public pricing endpoint (no auth required)
  // Endpoint: /api/pricing (mounted from public-pricing.routes.ts)
  const url = `${API_ENDPOINTS.PUBLIC.PRICING}${qs.toString() ? `?${qs.toString()}` : ""}`;
  
  // Public endpoint doesn't need auth
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Pricing API error:', response.status, errorText);
    throw new Error(`Failed to fetch pricing: ${response.statusText}`);
  }
  const res = await response.json();
  console.log('Pricing response:', res);
  return res;
}

/**
 * Get battery pricing by ID
 */
export async function getBatteryPricingById(id: string): Promise<SingleBatteryPricingResponse> {
  const url = `${API_BASE_URL}/admin/pricing/${id}`;
  const res = await authFetch(url);
  return res;
}

/**
 * Create battery pricing
 */
export async function createBatteryPricing(payload: {
  battery_model: string;
  price: number;
  is_active?: boolean;
}): Promise<SingleBatteryPricingResponse> {
  const url = `${API_BASE_URL}/admin/pricing`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res;
}

/**
 * Update battery pricing
 */
export async function updateBatteryPricing(
  id: string,
  payload: {
    battery_model?: string;
    price?: number;
    is_active?: boolean;
  }
): Promise<SingleBatteryPricingResponse> {
  const url = `${API_BASE_URL}/admin/pricing/${id}`;
  const res = await authFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res;
}

/**
 * Delete battery pricing
 */
export async function deleteBatteryPricing(id: string): Promise<{ success: boolean; message: string }> {
  const url = `${API_BASE_URL}/admin/pricing/${id}`;
  const res = await authFetch(url, {
    method: "DELETE",
  });
  return res;
}

export default {
  getBatteryPricing,
  getBatteryPricingById,
  createBatteryPricing,
  updateBatteryPricing,
  deleteBatteryPricing,
};
