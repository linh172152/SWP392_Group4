import { API_BASE_URL } from "../config/api";
import authFetch from "./apiClient";

export interface UserSubscription {
  subscription_id: string;
  user_id: string;
  package_id: string;
  start_date: string;
  end_date: string;
  remaining_swaps?: number | null;
  status: "active" | "expired" | "cancelled";
  auto_renew: boolean;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  metadata?: any;
  created_at: string;
  updated_at: string;
  package: {
    package_id: string;
    name: string;
    description?: string | null;
    price: number;
    battery_capacity_kwh: number;
    swap_limit?: number | null;
    duration_days: number;
    billing_cycle: "monthly" | "yearly" | "custom";
    is_active: boolean;
  };
  payments?: Array<{
    payment_id: string;
    amount: number;
    payment_method: string;
    payment_status: string;
    created_at: string;
  }>;
}

export interface GetSubscriptionsResponse {
  success: boolean;
  message: string;
  data: UserSubscription[];
}

export interface SubscribeToPackageResponse {
  success: boolean;
  message: string;
  data: UserSubscription;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  data: {
    subscription: UserSubscription;
    refund?: {
      payment_id: string;
      amount: number;
      payment_type: string;
    };
    wallet_balance?: number;
  };
}

/**
 * Get driver's subscriptions
 */
export async function getMySubscriptions(): Promise<GetSubscriptionsResponse> {
  const url = `${API_BASE_URL}/driver/subscriptions`;
  const res = await authFetch(url);
  return res;
}

/**
 * Subscribe to a service package
 * @param packageId The package ID to subscribe to
 * @param autoRenew Whether to auto-renew the subscription
 */
export async function subscribeToPackage(
  packageId: string,
  autoRenew: boolean = false
): Promise<SubscribeToPackageResponse> {
  const url = `${API_BASE_URL}/driver/subscriptions/packages/${packageId}/subscribe`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ autoRenew }),
  });
  return res;
}

/**
 * Cancel a subscription
 * @param subscriptionId The subscription ID to cancel
 * @param reason Optional cancellation reason
 */
export async function cancelSubscription(
  subscriptionId: string,
  reason?: string
): Promise<CancelSubscriptionResponse> {
  const url = `${API_BASE_URL}/driver/subscriptions/${subscriptionId}/cancel`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return res;
}

export default {
  getMySubscriptions,
  subscribeToPackage,
  cancelSubscription,
};

