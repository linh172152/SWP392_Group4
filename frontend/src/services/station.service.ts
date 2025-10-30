import { API_ENDPOINTS } from "../config/api";
import authFetch from "./apiClient";

export interface Station {
  station_id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  status: string;
  capacity: number;
  available_batteries: number;
  charging_batteries: number;
  maintenance_batteries: number;
  daily_swaps: number;
  daily_revenue: number;
  uptime: number;
  manager: {
    user_id: string;
    full_name: string;
    phone?: string;
  };
  operating_hours: string;
}

export async function getAllStations(params?: { 
  page?: number; 
  limit?: number; 
  status?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);

  const url = `${API_ENDPOINTS.ADMIN.STATIONS}${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await authFetch(url);
  return res;
}

export async function getStationById(id: string) {
  const url = `${API_ENDPOINTS.ADMIN.STATIONS}/${id}`;
  const res = await authFetch(url);
  return res;
}

export async function createStation(data: {
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  capacity: number;
  manager_id?: string;
  operating_hours?: string;
}) {
  const res = await authFetch(API_ENDPOINTS.ADMIN.STATIONS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res;
}

export async function updateStation(id: string, data: {
  name?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  capacity?: number;
  manager_id?: string;
  operating_hours?: string;
}) {
  const url = `${API_ENDPOINTS.ADMIN.STATIONS}/${id}`;
  const res = await authFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res;
}

export async function updateStationStatus(id: string, status: string) {
  const url = `${API_ENDPOINTS.ADMIN.STATIONS}/${id}/status`;
  const res = await authFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return res;
}

export async function deleteStation(id: string) {
  const url = `${API_ENDPOINTS.ADMIN.STATIONS}/${id}`;
  const res = await authFetch(url, { method: 'DELETE' });
  return res;
}

export default {
  getAllStations,
  getStationById,
  createStation,
  updateStation,
  updateStationStatus,
  deleteStation,
};