import { API_ENDPOINTS } from "../config/api";

// Transaction Types
export interface Transaction {
  transaction_id: string;
  transaction_code: string;
  user_id: string;
  station_id: string;
  vehicle_id: string;
  old_battery_id?: string;
  new_battery_id?: string;
  staff_id?: string;
  booking_id?: string;
  amount: number;
  payment_status: "pending" | "completed" | "failed" | "refunded";
  swap_duration_minutes?: number;
  created_at: string;
  updated_at: string;
  
  // Related data
  station?: {
    station_id: string;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  vehicle?: {
    vehicle_id: string;
    license_plate: string;
    vehicle_type: string;
    model: string;
    make?: string;
    year?: number;
  };
  new_battery?: {
    battery_id: string;
    battery_code: string;
    model: string;
    capacity_kwh: number;
    current_charge: number;
    status?: string;
  };
  old_battery?: {
    battery_id: string;
    battery_code: string;
    model: string;
    capacity_kwh: number;
    current_charge: number;
    status?: string;
  };
  staff?: {
    user_id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  payment?: {
    payment_id: string;
    amount: number;
    payment_method: string;
    payment_status: string;
    payment_gateway_ref?: string;
    paid_at?: string;
    created_at: string;
  };
  station_rating?: {
    rating_id: string;
    rating: number;
    comment?: string;
    created_at: string;
  };
  booking?: {
    booking_id: string;
    booking_code: string;
    scheduled_at: string;
    status: string;
  };
}

export interface TransactionListResponse {
  success: boolean;
  message: string;
  data: {
    transactions: Transaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface TransactionDetailsResponse {
  success: boolean;
  message: string;
  data: Transaction;
}

export interface TransactionStatsResponse {
  success: boolean;
  message: string;
  data: {
    period: string;
    total_transactions: number;
    total_amount: number;
    average_duration: number;
    status_breakdown: Array<{
      payment_status: string;
      _count: {
        transaction_id: number;
      };
    }>;
    monthly_breakdown: Array<{
      created_at: string;
      _count: {
        transaction_id: number;
      };
      _sum: {
        amount: number;
      };
    }>;
  };
}

export interface GetTransactionsParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface PayTransactionData {
  payment_method?: "vnpay" | "cash" | "momo";
}

export interface RefundRequestData {
  transaction_id: string;
  reason: string;
  amount?: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const transactionService = {
  /**
   * Lấy danh sách giao dịch của user
   */
  async getTransactions(params: GetTransactionsParams = {}): Promise<TransactionListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append("status", params.status);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const url = `${API_ENDPOINTS.DRIVER.TRANSACTIONS}?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Không thể tải danh sách giao dịch");
    }

    return await response.json();
  },

  /**
   * Lấy chi tiết giao dịch
   */
  async getTransactionDetails(id: string): Promise<TransactionDetailsResponse> {
    const response = await fetch(`${API_ENDPOINTS.DRIVER.TRANSACTIONS}/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Không thể tải chi tiết giao dịch");
    }

    return await response.json();
  },

  /**
   * Lấy thống kê giao dịch
   */
  async getTransactionStats(period: number = 30): Promise<TransactionStatsResponse> {
    const url = `${API_ENDPOINTS.DRIVER.TRANSACTIONS}/stats?period=${period}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Không thể tải thống kê giao dịch");
    }

    return await response.json();
  },

  /**
   * Lấy giao dịch đang chờ thanh toán
   */
  async getPendingTransactions(): Promise<{ success: boolean; message: string; data: Transaction[] }> {
    const response = await fetch(`${API_ENDPOINTS.DRIVER.TRANSACTIONS}/pending`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Không thể tải giao dịch chờ thanh toán");
    }

    return await response.json();
  },

  /**
   * Thanh toán giao dịch
   */
  async payTransaction(id: string, data: PayTransactionData = {}): Promise<any> {
    const response = await fetch(`${API_ENDPOINTS.DRIVER.TRANSACTIONS}/${id}/pay`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể thanh toán giao dịch");
    }

    return await response.json();
  },

  /**
   * Tạo yêu cầu hoàn tiền
   */
  async createRefundRequest(data: RefundRequestData): Promise<any> {
    const response = await fetch(`${API_ENDPOINTS.DRIVER.TRANSACTIONS}/refund`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể tạo yêu cầu hoàn tiền");
    }

    return await response.json();
  },
};

export default transactionService;

