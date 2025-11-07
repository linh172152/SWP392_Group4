import { API_BASE_URL } from "../config/api";
import authFetch from "./apiClient";

export interface Transaction {
  transaction_id: string;
  transaction_code: string;
  user_id: string;
  station_id: string;
  vehicle_id: string;
  new_battery_id: string;
  old_battery_id: string;
  staff_id?: string;
  swap_at: string;
  created_at: string;
  station?: {
    station_id: string;
    name: string;
    address: string;
  };
  vehicle?: {
    vehicle_id: string;
    license_plate: string;
    vehicle_type: string;
    model: string;
  };
  new_battery?: {
    battery_id: string;
    battery_code: string;
    model: string;
    capacity_kwh: number;
    current_charge: number;
  };
  old_battery?: {
    battery_id: string;
    battery_code: string;
    model: string;
    capacity_kwh: number;
    current_charge: number;
  };
  staff?: {
    user_id: string;
    full_name: string;
    email: string;
  };
  payment?: {
    payment_id: string;
    amount: number;
    payment_method: string;
    payment_status: string;
    paid_at?: string;
  };
  station_rating?: {
    rating_id: string;
    rating: number;
    comment?: string;
  };
}

export interface TransactionsResponse {
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

/**
 * Get user transactions
 */
export async function getUserTransactions(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<TransactionsResponse> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));

  const url = `${API_BASE_URL}/driver/transactions${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await authFetch(url);
  return res;
}

/**
 * Get transaction details
 */
export async function getTransactionDetails(transactionId: string): Promise<{
  success: boolean;
  message: string;
  data: Transaction;
}> {
  const url = `${API_BASE_URL}/driver/transactions/${transactionId}`;
  const res = await authFetch(url);
  return res;
}

export default {
  getUserTransactions,
  getTransactionDetails,
};
