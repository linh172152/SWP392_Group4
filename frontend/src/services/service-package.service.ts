import api from '../config/api';

export interface ServicePackage {
  package_id: string;
  name: string;
  description: string | null;
  battery_capacity: string | null; // "75kWh", "100kWh", "all"
  swap_limit: number | null; // Số lượt đổi pin
  duration_days: number; // Thời hạn gói (ngày)
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateServicePackageDto {
  name: string;
  description?: string;
  battery_capacity?: string;
  swap_limit?: number;
  duration_days: number;
  price: number;
  is_active?: boolean;
}

export interface UpdateServicePackageDto {
  name?: string;
  description?: string;
  battery_capacity?: string;
  swap_limit?: number;
  duration_days?: number;
  price?: number;
  is_active?: boolean;
}

class ServicePackageService {
  private readonly BASE_URL = '/admin/service-packages';

  async getServicePackages(params?: { limit?: number; offset?: number; is_active?: boolean }) {
    try {
      const response = await api.get(this.BASE_URL, { params });
      return response.data;
    } catch (error: any) {
      console.error('Get service packages error:', error);
      throw error.response?.data || error;
    }
  }

  async getServicePackageById(packageId: string) {
    try {
      const response = await api.get(`${this.BASE_URL}/${packageId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get service package error:', error);
      throw error.response?.data || error;
    }
  }

  async createServicePackage(data: CreateServicePackageDto) {
    try {
      const response = await api.post(this.BASE_URL, data);
      return response.data;
    } catch (error: any) {
      console.error('Create service package error:', error);
      throw error.response?.data || error;
    }
  }

  async updateServicePackage(packageId: string, data: UpdateServicePackageDto) {
    try {
      const response = await api.put(`${this.BASE_URL}/${packageId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update service package error:', error);
      throw error.response?.data || error;
    }
  }

  async deleteServicePackage(packageId: string) {
    try {
      const response = await api.delete(`${this.BASE_URL}/${packageId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete service package error:', error);
      throw error.response?.data || error;
    }
  }
}

export default new ServicePackageService();
