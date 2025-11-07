import { API_BASE_URL } from "../config/api";
import authFetch from "./apiClient";

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface WalletBalanceResponse {
  success: boolean;
  message: string;
  data: WalletBalance;
}

export interface WalletTransaction {
  payment_id: string;
  user_id: string;
  topup_package_id?: string;
  transaction_id?: string;
  subscription_id?: string;
  payment_type?: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  payment_gateway_ref?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  topup_package?: {
    name: string;
  };
  transaction?: {
    transaction_code: string;
    booking?: {
      booking_code: string;
      station?: {
        name: string;
      };
    };
  };
  subscription?: {
    subscription_id: string;
    package?: {
      package_id: string;
      name: string;
      battery_capacity_kwh: number;
      billing_cycle: string;
    };
  };
}

export interface WalletTransactionsResponse {
  success: boolean;
  message: string;
  data: {
    transactions: WalletTransaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface TopUpRequest {
  package_id: string;
  payment_method?: "vnpay" | "momo" | "cash";
}

export interface TopUpResponse {
  success: boolean;
  message: string;
  data: {
    balance?: number;
    topup_amount?: number;
    bonus_amount?: number;
    actual_amount?: number;
    package_id?: string;
    payment_method?: string;
  };
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(): Promise<WalletBalanceResponse> {
  const url = `${API_BASE_URL}/driver/wallet/balance`;
  const res = await authFetch(url);
  return res;
}

/**
 * Get wallet transactions history
 */
export async function getWalletTransactions(params?: {
  page?: number;
  limit?: number;
}): Promise<WalletTransactionsResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));

  const url = `${API_BASE_URL}/driver/wallet/transactions${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await authFetch(url);
  return res;
}

/**
 * Top up wallet
 */
export async function topUpWallet(data: TopUpRequest): Promise<TopUpResponse> {
  const url = `${API_BASE_URL}/driver/wallet/topup`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res;
}

export default {
  getWalletBalance,
  getWalletTransactions,
  topUpWallet,
};

