import { API_BASE_URL } from "../config/api";
import authFetch from "./apiClient";

export interface StationInfo {
  station_id: string;
  name?: string;
  address?: string;
}

export interface Battery {
  battery_id: string;
  battery_code: string;
  station_id: string;
  model?: string;
  capacity_kwh?: number;
  voltage?: number;
  current_charge?: number;
  status?: string;
  health_percentage?: number;
  last_charged_at?: string | null;
  created_at?: string;
  station?: StationInfo;
}

export interface BatteryFilters {
  station_id?: string;
  status?: string;
  model?: string;
}

export async function getBatteries(filters?: BatteryFilters) {
  const qs = new URLSearchParams();
  if (filters?.station_id) qs.set("station_id", filters.station_id);
  if (filters?.status) qs.set("status", filters.status);
  if (filters?.model) qs.set("model", filters.model);

  const url = `${API_BASE_URL}/staff/batteries${qs.toString() ? `?${qs.toString()}` : ""}`;

  // Try calling backend (requires auth + STAFF role). Caller should handle errors/fallbacks.
  const res = await authFetch(url);
  return res; // expected { success, message, data }
}

export async function addBattery(payload: {
  station_id: string;
  battery_code: string;
  model: string;
  capacity_kwh: number;
  voltage?: number;
  current_charge?: number;
  health_percentage?: number;
}) {
  const url = `${API_BASE_URL}/staff/batteries`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res;
}

export async function updateBattery(id: string, payload: { status?: string; current_charge?: number; health_percentage?: number }) {
  const url = `${API_BASE_URL}/staff/batteries/${id}`;
  const res = await authFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res;
}

export async function getBatteryHistory(batteryId: string, page = 1, limit = 10) {
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  const url = `${API_BASE_URL}/staff/batteries/${batteryId}/history?${qs.toString()}`;
  const res = await authFetch(url);
  return res; // expected { success, message, data: { history, pagination } }
}

export async function getBatteryDetails(batteryId: string) {
  const url = `${API_BASE_URL}/staff/batteries/${batteryId}`;
  const res = await authFetch(url);
  return res; // expected { success, message, data }
}

export function getBatteriesMock(): Promise<{ success: true; data: Battery[] }> {
  const mock: Battery[] = [
    {
      battery_id: "BAT-001",
      battery_code: "STD-001",
      station_id: "ST001",
      model: "Standard Range",
      capacity_kwh: 40,
      voltage: 400,
      current_charge: 86,
      status: "AVAILABLE",
      health_percentage: 98,
      last_charged_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      station: { station_id: "ST001", name: "Trạm Thành phố", address: "123 Đường Chính" },
    },
    {
      battery_id: "BAT-002",
      battery_code: "LR-002",
      station_id: "ST002",
      model: "Long Range",
      capacity_kwh: 60,
      voltage: 400,
      current_charge: 34,
      status: "CHARGING",
      health_percentage: 92,
      last_charged_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
      created_at: new Date().toISOString(),
      station: { station_id: "ST002", name: "Trung tâm TM", address: "456 Đại lộ Mua sắm" },
    },
    {
      battery_id: "BAT-003",
      battery_code: "MT-003",
      station_id: "ST003",
      model: "Standard Range",
      capacity_kwh: 40,
      voltage: 400,
      current_charge: 12,
      status: "MAINTENANCE",
      health_percentage: 75,
      last_charged_at: null,
      created_at: new Date().toISOString(),
      station: { station_id: "ST003", name: "Trạm Cao tốc", address: "Km 42" },
    },
  ];

  return Promise.resolve({ success: true, data: mock });
}

export default {
  getBatteries,
  getBatteriesMock,
  addBattery,
  updateBattery,
  getBatteryHistory,
  getBatteryDetails,
};
