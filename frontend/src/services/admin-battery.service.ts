import { API_BASE_URL } from '../config/api';
import authFetch from './apiClient';

export interface Battery {
  battery_id: string;
  battery_code: string;
  model: string;
  status: 'available' | 'charging' | 'in_use' | 'maintenance' | 'damaged';
  health_percentage: number;
  cycle_count: number;
  station_id: string;
  created_at: string;
  updated_at: string;
  station?: {
    station_id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  transfer_logs_from?: BatteryTransferLog[];
}

export interface BatteryTransferLog {
  transfer_id: string;
  from_station: {
    name: string;
  };
  to_station: {
    name: string;
  };
  transfer_reason: string;
  transfer_status: string;
  transferred_at: string;
}

export interface CreateBatteryDto {
  station_id: string;
  model: string;
  battery_code: string;
  capacity_kwh?: number;
  status?: 'full' | 'reserved' | 'charging' | 'in_use' | 'maintenance' | 'damaged';
  health_percentage?: number;
  cycle_count?: number;
}

export interface UpdateBatteryDto {
  station_id?: string;
  model?: string;
  battery_code?: string;
  capacity_kwh?: number;
  status?: 'full' | 'reserved' | 'charging' | 'in_use' | 'maintenance' | 'damaged';
  health_percentage?: number;
  cycle_count?: number;
}

export interface GetBatteriesParams {
  station_id?: string;
  status?: string;
  model?: string;
  min_health?: number;
  page?: number;
  limit?: number;
}

export interface BatteryStats {
  total: number;
  by_status: {
    available?: number;
    charging?: number;
    in_use?: number;
    maintenance?: number;
    damaged?: number;
  };
  by_model: Array<{
    model: string;
    count: number;
  }>;
  low_health_count: number;
  avg_health: number;
  avg_cycle_count: number;
}

class AdminBatteryService {
  private baseURL = `${API_BASE_URL}/admin/batteries`;

  async getBatteries(params?: GetBatteriesParams) {
    const qs = new URLSearchParams();
    if (params?.station_id) qs.set('station_id', params.station_id);
    if (params?.status) qs.set('status', params.status);
    if (params?.model) qs.set('model', params.model);
    if (params?.min_health) qs.set('min_health', String(params.min_health));
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));

    const url = `${this.baseURL}${qs.toString() ? `?${qs.toString()}` : ''}`;
    return await authFetch(url);
  }

  async getBatteryStats() {
    const url = `${this.baseURL}/stats`;
    return await authFetch(url);
  }

  async getLowHealthBatteries(threshold: number = 70) {
    const url = `${this.baseURL}/low-health?threshold=${threshold}`;
    return await authFetch(url);
  }

  async getBatteryById(id: string) {
    const url = `${this.baseURL}/${id}`;
    return await authFetch(url);
  }

  async createBattery(data: CreateBatteryDto) {
    const url = this.baseURL;
    return await authFetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBattery(id: string, data: UpdateBatteryDto) {
    const url = `${this.baseURL}/${id}`;
    return await authFetch(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBattery(id: string) {
    const url = `${this.baseURL}/${id}`;
    return await authFetch(url, { method: 'DELETE' });
  }
}

export default new AdminBatteryService();
