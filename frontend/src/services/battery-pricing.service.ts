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
 * Get all battery pricing for driver
 * 
 * ⚠️ LƯU Ý: Hiện tại BE đang tạo endpoint mới cho driver.
 * 
 * Flow hiện tại:
 * 1. Ưu tiên dùng driver endpoint: `/api/driver/pricing` (hoặc `/api/pricing/public` tùy BE)
 * 2. Nếu driver endpoint chưa có (404), fallback về admin endpoint (có thể bị 403)
 * 3. Nếu cả 2 đều lỗi, trả về empty array (hiển thị "Liên hệ")
 * 
 * Khi BE hoàn thành endpoint mới:
 * - Chỉ cần cập nhật API_ENDPOINTS.DRIVER.PRICING trong api.ts
 * - Xóa phần fallback về admin endpoint
 */
export async function getBatteryPricing(filters?: BatteryPricingFilters): Promise<BatteryPricingResponse> {
  const qs = new URLSearchParams();
  if (filters?.is_active !== undefined) qs.set("is_active", String(filters.is_active));
  if (filters?.page) qs.set("page", String(filters.page));
  if (filters?.limit) qs.set("limit", String(filters.limit));

  const queryString = qs.toString() ? `?${qs.toString()}` : "";
  
  // ✅ Ưu tiên dùng driver endpoint (khi BE tạo xong)
  const driverUrl = `${API_ENDPOINTS.DRIVER.PRICING}${queryString}`;
  
  // ⚠️ Fallback về admin endpoint (tạm thời, sẽ xóa khi BE có endpoint mới)
  const adminUrl = `${API_BASE_URL}/admin/pricing${queryString}`;
  
  // Thử driver endpoint trước
  try {
    const res = await authFetch(driverUrl);
    return res;
  } catch (driverError: any) {
    // Nếu driver endpoint chưa có (404) hoặc lỗi khác, thử admin endpoint
    if (driverError?.status === 404) {
      console.log('Driver pricing endpoint chưa có, thử admin endpoint...');
      
      try {
        const res = await authFetch(adminUrl);
        return res;
      } catch (adminError: any) {
        // Nếu admin endpoint cũng lỗi (403/401), trả về empty array
        if (adminError?.status === 403 || adminError?.status === 401) {
          console.warn('Không có quyền truy cập pricing endpoint, trả về danh sách rỗng');
          return {
            success: true,
            message: "Battery pricing retrieved successfully",
            data: {
              pricings: [],
              pagination: {
                page: filters?.page || 1,
                limit: filters?.limit || 10,
                total: 0,
                pages: 0,
              },
            },
          };
        }
        throw adminError;
      }
    }
    
    // Nếu lỗi khác (không phải 404), throw error
    throw driverError;
  }
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
