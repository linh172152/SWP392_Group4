import { API_ENDPOINTS } from "../config/api";

export interface Booking {
  booking_id: string;
  booking_code: string;
  user_id: string;
  vehicle_id: string;
  station_id: string;
  battery_model: string;
  scheduled_at: string;
  is_instant?: boolean;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  checked_in_at?: string;
  created_at: string;
  updated_at: string;
  station?: {
    station_id: string;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    operating_hours?: any;
  };
  vehicle?: {
    vehicle_id: string;
    license_plate: string;
    vehicle_type: string;
    make?: string;
    model: string;
    year?: number;
    current_battery?: {
      battery_id: string;
      battery_code: string;
      status: string;
      current_charge: number;
    } | null;
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
  // Fields from instant booking response
  use_subscription?: boolean;
  subscription_unlimited?: boolean;
  subscription_remaining_after?: number | null;
  subscription_name?: string;
  wallet_balance_after?: number | null;
  locked_wallet_amount?: number;
  hold_expires_at?: string;
  reservation_expires_at?: string;
  message?: string;
}

export interface CreateBookingData {
  vehicle_id: string;
  station_id: string;
  battery_model: string;
  scheduled_at: string;
  notes?: string;
  use_subscription?: boolean; // Ưu tiên sử dụng subscription nếu có (default: true)
}

export interface CreateInstantBookingData {
  vehicle_id: string;
  station_id: string;
  battery_model: string;
  notes?: string;
  use_subscription?: boolean; // Ưu tiên sử dụng subscription nếu có (default: true)
}

export interface UpdateBookingData {
  scheduled_at?: string;
  notes?: string;
}

export interface HoldSummary {
  battery_code?: string | null;
  use_subscription: boolean;
  subscription_unlimited?: boolean;
  subscription_remaining_after?: number | null;
  subscription_name?: string | null;
  wallet_amount_locked?: number;
  wallet_balance_after?: number | null;
  hold_expires_at?: string | null;
}

export interface PricingPreview {
  currency: string;
  base_price: number | null;
  estimated_price: number | null;
  pricing_source: "subscription" | "wallet" | "unavailable";
  has_active_subscription: boolean;
  is_covered_by_subscription: boolean;
  subscription?: any;
  message: string;
}

export interface CreateBookingResponse {
  booking: Booking;
  pricing_preview?: PricingPreview;
  hold_summary?: HoldSummary;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data:
    | Booking
    | CreateBookingResponse
    | {
        bookings: Booking[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      };
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const bookingService = {
  // Lấy danh sách bookings của người dùng
  async getUserBookings(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ bookings: Booking[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const url = `${API_ENDPOINTS.DRIVER.BOOKINGS}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Không thể lấy danh sách đặt chỗ");
    }

    return data.data;
  },

  // Tạo booking mới (đặt lịch)
  async createBooking(
    bookingData: CreateBookingData
  ): Promise<CreateBookingResponse> {
    // Default use_subscription = true nếu không được chỉ định
    const requestData = {
      ...bookingData,
      use_subscription:
        bookingData.use_subscription !== undefined
          ? bookingData.use_subscription
          : true,
    };

    console.log('📤 [CREATE BOOKING REQUEST]', requestData);

    const response = await fetch(API_ENDPOINTS.DRIVER.BOOKINGS, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [BACKEND ERROR - CREATE BOOKING]', {
        status: response.status,
        statusText: response.statusText,
        error: data,
        errorMessage: data.message,
        errorDetails: JSON.stringify(data, null, 2),
        requestData: requestData
      });
      // Hiển thị error message chi tiết từ backend
      const errorMessage = data.message || data.error || data.error?.message || "Không thể tạo đặt chỗ";
      console.error('❌ [BACKEND ERROR MESSAGE]', errorMessage);
      throw new Error(errorMessage);
    }

    // Response có thể chứa hold_summary và pricing_preview
    return data.data;
  },

  // Tạo instant booking (đổi pin ngay)
  async createInstantBooking(
    bookingData: CreateInstantBookingData
  ): Promise<Booking> {
    // Default use_subscription = true nếu không được chỉ định
    const requestData = {
      ...bookingData,
      use_subscription:
        bookingData.use_subscription !== undefined
          ? bookingData.use_subscription
          : true,
    };

    console.log('📤 [CREATE INSTANT BOOKING REQUEST]', requestData);

    const response = await fetch(`${API_ENDPOINTS.DRIVER.BOOKINGS}/instant`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [CREATE INSTANT BOOKING ERROR]', {
        status: response.status,
        statusText: response.statusText,
        error: data
      });
      // Hiển thị error message chi tiết từ backend
      const errorMessage = data.message || data.error || "Không thể tạo đặt chỗ đổi pin ngay";
      throw new Error(errorMessage);
    }

    return data.data;
  },

  // Lấy chi tiết booking
  async getBookingDetails(bookingId: string): Promise<Booking> {
    const response = await fetch(
      `${API_ENDPOINTS.DRIVER.BOOKINGS}/${bookingId}`,
      {
        headers: getAuthHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Không thể lấy thông tin đặt chỗ");
    }

    return data.data;
  },

  // Cập nhật booking
  async updateBooking(
    bookingId: string,
    bookingData: UpdateBookingData
  ): Promise<Booking> {
    const response = await fetch(
      `${API_ENDPOINTS.DRIVER.BOOKINGS}/${bookingId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(bookingData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Không thể cập nhật đặt chỗ");
    }

    return data.data;
  },

  // Hủy booking
  async cancelBooking(bookingId: string): Promise<any> {
    const response = await fetch(
      `${API_ENDPOINTS.DRIVER.BOOKINGS}/${bookingId}/cancel`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Không thể hủy đặt chỗ");
    }

    return data.data;
  },
};

export default bookingService;
