import { API_BASE_URL } from '../config/api';
import authFetch from './apiClient';

export interface BatteryTransfer {
  transfer_id: string;
  battery_id: string;
  from_station_id: string;
  to_station_id: string;
  transfer_status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  transfer_reason: string;
  notes?: string;
  transferred_by: string;
  transferred_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  battery?: {
    battery_code: string;
    model: string;
    status: string;
  };
  from_station?: {
    name: string;
    address: string;
  };
  to_station?: {
    name: string;
    address: string;
  };
  transferred_by_user?: {
    full_name: string;
    email: string;
  };
}

export interface CreateBatteryTransferDto {
  battery_id: string;
  from_station_id: string;
  to_station_id: string;
  transfer_reason: string;
  notes?: string;
}

export interface UpdateBatteryTransferDto {
  transfer_status?: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  notes?: string;
}

export interface GetBatteryTransfersParams {
  page?: number;
  limit?: number;
  status?: string;
  from_station_id?: string;
  to_station_id?: string;
  battery_id?: string;
}

class BatteryTransferService {
  private baseURL = `${API_BASE_URL}/admin/battery-transfers`;

  async getBatteryTransfers(params?: GetBatteryTransfersParams) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.status) qs.set('status', params.status);
    if (params?.from_station_id) qs.set('from_station_id', params.from_station_id);
    if (params?.to_station_id) qs.set('to_station_id', params.to_station_id);
    if (params?.battery_id) qs.set('battery_id', params.battery_id);

    const url = `${this.baseURL}${qs.toString() ? `?${qs.toString()}` : ''}`;
    return await authFetch(url);
  }

  async getBatteryTransferById(id: string) {
    const url = `${this.baseURL}/${id}`;
    return await authFetch(url);
  }

  async createBatteryTransfer(data: CreateBatteryTransferDto) {
    const url = this.baseURL;
    // Backend chỉ cần battery_id, to_station_id, transfer_reason, notes
    // from_station_id được tự động xác định từ pin hiện tại
    // Backend production có thể expect format khác
    const payload: any = {
      battery_id: data.battery_id?.toString().trim(),
      to_station_id: data.to_station_id?.toString().trim(), 
      transfer_reason: data.transfer_reason?.toString().trim()
    };
    
    // Chỉ thêm notes nếu có
    if (data.notes && data.notes.trim()) {
      payload.notes = data.notes.trim();
    }
    
    console.log('Service payload:', payload);
    console.log('Original data:', data);
    
    return await authFetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateBatteryTransfer(id: string, data: UpdateBatteryTransferDto) {
    const url = `${this.baseURL}/${id}`;
    return await authFetch(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateBatteryTransferStatus(id: string, status: 'pending' | 'in_transit' | 'completed' | 'cancelled', notes?: string) {
    const url = `${this.baseURL}/${id}/status`;
    const payload: any = { status };
    if (notes) payload.notes = notes;
    
    return await authFetch(url, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteBatteryTransfer(id: string) {
    const url = `${this.baseURL}/${id}`;
    return await authFetch(url, { method: 'DELETE' });
  }
}

export default new BatteryTransferService();
