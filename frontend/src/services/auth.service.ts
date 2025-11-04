import { API_ENDPOINTS } from "../config/api";

export interface UserProfile {
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
  station?: {
    station_id: string;
    name: string;
    address: string;
  };
  vehicles?: Array<{
    vehicle_id: string;
    license_plate: string;
    vehicle_type: string;
    model: string;
  }>;
}

export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const authService = {
  /**
   * Lấy thông tin profile của user hiện tại
   */
  async getProfile(): Promise<{ success: boolean; message: string; data: { user: UserProfile } }> {
    const response = await fetch(`${API_ENDPOINTS.AUTH.PROFILE}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const data = await response.json();
      const error: any = new Error(data.message || "Không thể tải thông tin profile");
      error.status = response.status;
      throw error;
    }

    return await response.json();
  },

  /**
   * Cập nhật thông tin profile
   */
  async updateProfile(data: UpdateProfileData): Promise<{ success: boolean; message: string; data: { user: UserProfile } }> {
    const baseUrl = API_ENDPOINTS.AUTH.PROFILE.replace('/me', '');
    const response = await fetch(`${baseUrl}/profile`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error: any = new Error(errorData.message || "Không thể cập nhật profile");
      error.status = response.status;
      throw error;
    }

    return await response.json();
  },

  /**
   * Đổi mật khẩu
   */
  async changePassword(data: ChangePasswordData): Promise<{ success: boolean; message: string }> {
    const baseUrl = API_ENDPOINTS.AUTH.PROFILE.replace('/me', '');
    const response = await fetch(`${baseUrl}/change-password`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        currentPassword: data.current_password,
        newPassword: data.new_password
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error: any = new Error(errorData.message || "Không thể đổi mật khẩu");
      error.status = response.status;
      throw error;
    }

    return await response.json();
  },

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File): Promise<{ success: boolean; message: string; data: { user: UserProfile; image_url: string } }> {
    const token = localStorage.getItem("accessToken");
    const baseUrl = API_ENDPOINTS.AUTH.PROFILE.replace('/me', '');
    
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${baseUrl}/upload-avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type, browser will set it with boundary for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error: any = new Error(errorData.message || "Không thể upload avatar");
      error.status = response.status;
      throw error;
    }

    return await response.json();
  },
};

export default authService;

