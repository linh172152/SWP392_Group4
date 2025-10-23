import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const vehicleService = {
  // Tạo xe mới
  createVehicle: async (vehicleData: any) => {
    return await prisma.vehicle.create({
      data: vehicleData,
      include: {
        user: {
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
    return await prisma.vehicle.findMany({
      where: { user_id: userId },
      include: {
        user: {
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
    return await prisma.vehicle.findFirst({
      where: {
        vehicle_id: vehicleId,
        user_id: userId,
      },
      include: {
        user: {
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
  updateVehicle: async (
    vehicleId: string,
    updateData: any,
    _userId: string
  ) => {
    return await prisma.vehicle.update({
      where: { vehicle_id: vehicleId },
      data: updateData,
      include: {
        user: {
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
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        vehicle_id: vehicleId,
        user_id: userId,
      },
    });

    if (!vehicle) {
      return false;
    }

    await prisma.vehicle.delete({
      where: { vehicle_id: vehicleId },
    });

    return true;
  },
};
