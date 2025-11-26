import { prisma } from "../server";
import { randomUUID } from "crypto";

export const vehicleService = {
  // Tạo xe mới
  createVehicle: async (vehicleData: any) => {
    // Đảm bảo có vehicle_id nếu chưa có
    if (!vehicleData.vehicle_id) {
      vehicleData.vehicle_id = randomUUID();
    }
    return await prisma.vehicles.create({
      data: vehicleData,
      include: {
        users: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });
  },

  // Lấy danh sách xe của user
  getUserVehicles: async (userId: string) => {
    return await prisma.vehicles.findMany({
      where: { user_id: userId },
      include: {
        users: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
  },

  // Lấy thông tin xe theo ID
  getVehicleById: async (vehicleId: string, userId: string) => {
    return await prisma.vehicles.findFirst({
      where: {
        vehicle_id: vehicleId,
        user_id: userId,
      },
      include: {
        users: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });
  },

  // Cập nhật thông tin xe
  updateVehicle: async (vehicleId: string, updateData: any) => {
    return await prisma.vehicles.update({
      where: { vehicle_id: vehicleId },
      data: updateData,
      include: {
        users: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });
  },

  // Xóa xe
  deleteVehicle: async (vehicleId: string, userId: string) => {
    const vehicle = await prisma.vehicles.findFirst({
      where: {
        vehicle_id: vehicleId,
        user_id: userId,
      },
    });

    if (!vehicle) {
      return false;
    }

    await prisma.vehicles.delete({
      where: { vehicle_id: vehicleId },
    });

    return true;
  },
};
