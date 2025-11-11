import { API_ENDPOINTS } from "../config/api";
import authFetch from "./apiClient";

export interface CreateRatingRequest {
  station_id: string;
  transaction_id: string;
  rating: number; // 1-5
  comment?: string;
}

export interface Rating {
  rating_id: string;
  user_id: string;
  station_id: string;
  transaction_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  user?: {
    user_id: string;
    full_name: string;
    email: string;
  };
  station?: {
    station_id: string;
    name: string;
    address: string;
  };
}

export interface CreateRatingResponse {
  success: boolean;
  message: string;
  data: Rating;
}

/**
 * Create station rating
 */
export async function createRating(data: CreateRatingRequest): Promise<CreateRatingResponse> {
  const url = API_ENDPOINTS.RATINGS.BASE;
  const result = await authFetch(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result;
}

export default {
  createRating,
};

