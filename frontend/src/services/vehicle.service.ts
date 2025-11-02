import { API_ENDPOINTS } from "../config/api";

export interface Vehicle {
  vehicle_id: string;
  user_id: string;
  license_plate: string;
  vehicle_type: "MOTORBIKE" | "CAR" | "TRUCK";
  brand: string;
  make?: string; // Alias for brand
  model: string;
  year?: number;
  battery_capacity?: number;
  battery_model?: string; // Model/type of the battery
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleData {
  license_plate: string;
  vehicle_type: "MOTORBIKE" | "CAR" | "TRUCK";
  brand: string;
  model: string;
  year?: number;
  battery_capacity?: number;
  battery_model?: string;
}

export interface UpdateVehicleData {
  license_plate?: string;
  vehicle_type?: "MOTORBIKE" | "CAR" | "TRUCK";
  brand?: string;
  model?: string;
  year?: number;
  battery_capacity?: number;
  battery_model?: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const vehicleService = {
  // Lấy danh sách xe của người dùng
  async getVehicles(): Promise<Vehicle[]> {
    const response = await fetch(API_ENDPOINTS.DRIVER.VEHICLES, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Không thể lấy danh sách xe");
    }

    return data.data;
  },

  // Thêm xe mới
  async addVehicle(vehicleData: CreateVehicleData): Promise<Vehicle> {
    const response = await fetch(API_ENDPOINTS.DRIVER.VEHICLES, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(vehicleData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Không thể thêm xe");
    }

    return data.data;
  },

  // Lấy chi tiết xe
  async getVehicleDetails(vehicleId: string): Promise<Vehicle> {
    const response = await fetch(
      `${API_ENDPOINTS.DRIVER.VEHICLES}/${vehicleId}`,
      {
        headers: getAuthHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Không thể lấy thông tin xe");
    }

    return data.data;
  },

  // Cập nhật thông tin xe
  async updateVehicle(
    vehicleId: string,
    vehicleData: UpdateVehicleData
  ): Promise<Vehicle> {
    const response = await fetch(
      `${API_ENDPOINTS.DRIVER.VEHICLES}/${vehicleId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(vehicleData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Không thể cập nhật xe");
    }

    return data.data;
  },

  // Xóa xe
  async deleteVehicle(vehicleId: string): Promise<void> {
    const response = await fetch(
      `${API_ENDPOINTS.DRIVER.VEHICLES}/${vehicleId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Không thể xóa xe");
    }
  },
};

