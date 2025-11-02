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
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  notes?: string;
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

export interface CreateBookingData {
  vehicle_id: string;
  station_id: string;
  battery_model: string;
  scheduled_at: string;
  notes?: string;
}

export interface CreateInstantBookingData {
  vehicle_id: string;
  station_id: string;
  battery_model: string;
  notes?: string;
}

export interface UpdateBookingData {
  scheduled_at?: string;
  notes?: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data: Booking | {
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
  async createBooking(bookingData: CreateBookingData): Promise<Booking> {
    const response = await fetch(API_ENDPOINTS.DRIVER.BOOKINGS, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Không thể tạo đặt chỗ");
    }

    return data.data;
  },

  // Tạo instant booking (đổi pin ngay)
  async createInstantBooking(
    bookingData: CreateInstantBookingData
  ): Promise<Booking> {
    const response = await fetch(`${API_ENDPOINTS.DRIVER.BOOKINGS}/instant`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Không thể tạo đặt chỗ đổi pin ngay");
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

