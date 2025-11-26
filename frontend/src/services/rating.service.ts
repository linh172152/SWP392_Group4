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
export async function createRating(
  data: CreateRatingRequest
): Promise<CreateRatingResponse> {
  const url = API_ENDPOINTS.RATINGS.BASE;
  const result = await authFetch(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result;
}

export interface StationRating {
  rating_id: string;
  user_id: string;
  station_id: string;
  transaction_id: string | null;
  rating: number;
  comment?: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    user_id: string;
    full_name: string;
    email: string;
  };
  transaction?: {
    transaction_id: string;
    transaction_code: string;
    swap_at: string;
  };
}

export interface StationRatingSummary {
  station_id: string;
  total_ratings: number;
  average_rating: number;
  rating_distribution: Record<number, number>;
}

export interface GetStationRatingsResponse {
  success: boolean;
  message: string;
  data: {
    ratings: StationRating[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface GetStationRatingSummaryResponse {
  success: boolean;
  message: string;
  data: StationRatingSummary;
}

/**
 * Get station ratings
 */
export async function getStationRatings(
  stationId: string,
  page: number = 1,
  limit: number = 10
): Promise<GetStationRatingsResponse> {
  const url = `${API_ENDPOINTS.RATINGS.BASE}/stations/${stationId}?page=${page}&limit=${limit}`;
  const result = await authFetch(url);
  return result;
}

/**
 * Get station rating summary
 */
export async function getStationRatingSummary(
  stationId: string
): Promise<GetStationRatingSummaryResponse> {
  const url = `${API_ENDPOINTS.RATINGS.BASE}/stations/${stationId}/summary`;
  const result = await authFetch(url);
  return result;
}

export default {
  createRating,
  getStationRatings,
  getStationRatingSummary,
};
