import { API_ENDPOINTS } from '../config/api';
import authFetch from './apiClient';

// Battery interfaces
export interface Battery {
  battery_id: string;
  battery_code: string;
  station_id: string;
  model: string;
  capacity_kwh?: number;
  voltage?: number;
  current_charge: number;
  health_percentage?: number;
  status: 'full' | 'charging' | 'in_use' | 'maintenance' | 'damaged';
  last_charged_at?: string;
  created_at: string;
  updated_at: string;
  station?: {
    station_id: string;
    name: string;
    address: string;
    capacity?: number;
  };
}

export interface AddBatteryData {
  battery_code: string;
  model: string;
  capacity_kwh?: number;
  voltage?: number;
  current_charge?: number;
  status?: 'full' | 'charging' | 'in_use' | 'maintenance' | 'damaged';
}

export interface UpdateBatteryData {
  status?: 'full' | 'charging' | 'in_use' | 'maintenance' | 'damaged';
  current_charge?: number;
  health_percentage?: number;
}

export interface BatteryTransferLog {
  transfer_id: string;
  battery_id: string;
  from_station_id: string;
  to_station_id: string;
  transfer_reason: string;
  transferred_by: string;
  transferred_at: string;
  notes?: string;
  from_station?: {
    station_id: string;
    name: string;
    address: string;
  };
  to_station?: {
    station_id: string;
    name: string;
    address: string;
  };
  transferred_by_user?: {
    user_id: string;
    full_name: string;
    email: string;
  };
}

/**
 * Lấy danh sách pin của trạm (cho staff)
 */
export async function getStationBatteries(params?: {
  status?: string;
  model?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.model) qs.set('model', params.model);

  const url = `${API_ENDPOINTS.STAFF.BATTERIES}${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await authFetch(url);
  return res; // { success, message, data: Battery[] }
}

/**
 * Lấy chi tiết pin
 */
export async function getBatteryDetails(batteryId: string) {
  const url = API_ENDPOINTS.STAFF.BATTERY_DETAILS(batteryId);
  const res = await authFetch(url);
  return res; // { success, message, data: Battery with transfer_logs }
}

/**
 * Lấy lịch sử chuyển trạm của pin
 */
export async function getBatteryHistory(batteryId: string, params?: {
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));

  const url = `${API_ENDPOINTS.STAFF.BATTERY_HISTORY(batteryId)}${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await authFetch(url);
  return res; // { success, message, data: { history, pagination } }
}

/**
 * Thêm pin mới
 */
export async function addBattery(data: AddBatteryData) {
  const url = API_ENDPOINTS.STAFF.ADD_BATTERY;
  const res = await authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res; // { success, message, data: Battery with capacity_info }
}

/**
 * Cập nhật trạng thái pin
 */
export async function updateBatteryStatus(batteryId: string, data: UpdateBatteryData) {
  const url = API_ENDPOINTS.STAFF.UPDATE_BATTERY(batteryId);
  const res = await authFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res; // { success, message, data: Battery }
}

/**
 * Xóa pin
 */
export async function deleteBattery(batteryId: string) {
  const url = API_ENDPOINTS.STAFF.DELETE_BATTERY(batteryId);
  const res = await authFetch(url, {
    method: 'DELETE',
  });
  return res; // { success, message }
}

export default {
  getStationBatteries,
  getBatteryDetails,
  getBatteryHistory,
  addBattery,
  updateBatteryStatus,
  deleteBattery,
};
