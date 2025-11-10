import { API_ENDPOINTS, fetchWithAuth } from '../config/api';

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
  private readonly BASE_URL = `${API_ENDPOINTS.ADMIN.STATIONS.replace('/admin/stations', '/admin/service-packages')}`;

  async getServicePackages(params?: { limit?: number; offset?: number; is_active?: boolean }) {
    try {
      let url = this.BASE_URL;
      if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
        if (searchParams.toString()) {
          url += `?${searchParams.toString()}`;
        }
      }
      const response = await fetchWithAuth(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return await response.json();
    } catch (error: any) {
      console.error('Get service packages error:', error);
      throw error;
    }
  }

  async getServicePackageById(packageId: string) {
    try {
      const response = await fetchWithAuth(`${this.BASE_URL}/${packageId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return await response.json();
    } catch (error: any) {
      console.error('Get service package error:', error);
      throw error;
    }
  }

  async createServicePackage(data: CreateServicePackageDto) {
    try {
      const response = await fetchWithAuth(this.BASE_URL, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return await response.json();
    } catch (error: any) {
      console.error('Create service package error:', error);
      throw error;
    }
  }

  async updateServicePackage(packageId: string, data: UpdateServicePackageDto) {
    try {
      const response = await fetchWithAuth(`${this.BASE_URL}/${packageId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return await response.json();
    } catch (error: any) {
      console.error('Update service package error:', error);
      throw error;
    }
  }

  async deleteServicePackage(packageId: string) {
    try {
      const response = await fetchWithAuth(`${this.BASE_URL}/${packageId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return await response.json();
    } catch (error: any) {
      console.error('Delete service package error:', error);
      throw error;
    }
  }
}

export default new ServicePackageService();
