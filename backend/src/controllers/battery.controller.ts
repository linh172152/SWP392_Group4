import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";
import { prisma } from "../server";

const batteryStatusLabels: Record<string, string> = {
  full: "Sẵn sàng",
  reserved: "Đã giữ chỗ",
  charging: "Đang sạc",
  in_use: "Đang gắn trên xe",
  maintenance: "Đang bảo trì",
  damaged: "Đã hỏng",
};

/**
 * Get station batteries
 * ✅ Staff: Chỉ xem pin của station mình được assign
 * ✅ Admin: Có thể xem tất cả pin (nếu không có station_id trong query)
 */
export const getStationBatteries = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { station_id, status, model } = req.query;

    const whereClause: any = {};
    let isStaff = false;

    // ✅ Nếu là staff, force chỉ xem pin của station mình (bỏ qua station_id trong query)
    if (userId) {
      const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: { station_id: true, role: true },
      });

      if (user?.station_id && user.role === "STAFF") {
        // ✅ Staff: Force chỉ xem pin của station mình, bỏ qua station_id trong query
        whereClause.station_id = user.station_id;
        isStaff = true;
      } else if (station_id) {
        // Admin hoặc user khác: Có thể filter theo station_id trong query
        whereClause.station_id = station_id;
      }
      // Admin không có station_id trong query → xem tất cả (không set whereClause.station_id)
    } else if (station_id) {
      // Không authenticated: Chỉ xem theo station_id trong query
      whereClause.station_id = station_id;
    }

    // ✅ Filter theo status
    if (status) {
      // ✅ Staff: Nếu filter status = "in_use", không trả về kết quả nào
      // vì pin đang được driver sử dụng không còn ở trong kho
      if (isStaff && status === "in_use") {
        whereClause.status = "in_use_NONE"; // Status không tồn tại → trả về empty array
      } else {
        whereClause.status = status;
      }
    } else if (isStaff) {
      // ✅ Staff: Nếu không có filter status, loại bỏ pin đã được driver lấy đi (in_use)
      // Vì pin đang được sử dụng trên xe không còn ở trong kho nữa
      whereClause.status = {
        not: "in_use",
      };
    }

    if (model) {
      whereClause.model = model;
    }

    const batteries = await prisma.batteries.findMany({
      where: whereClause,
      include: {
        stations: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // ✅ Map stations (số nhiều từ Prisma) thành station (số ít) để match với frontend interface
    const batteriesWithLabels = batteries.map(
      (battery: (typeof batteries)[number]) => ({
        ...battery,
        station: battery.stations || null, // ✅ Map stations -> station để frontend có thể dùng battery.station.name
        status_label: batteryStatusLabels[battery.status] ?? battery.status,
      })
    );

    res.status(200).json({
      success: true,
      message: "Station batteries retrieved successfully",
      data: batteriesWithLabels,
    });
  }
);

/**
 * Add new battery
 */
export const addBattery = asyncHandler(async (req: Request, res: Response) => {
  const {
    station_id,
    battery_code,
    model,
    capacity_kwh,
    voltage,
    current_charge = 100,
    status = "full",
    health_percentage = 100,
    cycle_count = 0,
  } = req.body;

  if (!battery_code || !model || !station_id) {
    throw new CustomError(
      "Battery code, model, and station_id are required",
      400
    );
  }

  // Check if station exists
  const station = await prisma.stations.findUnique({
    where: { station_id },
  });

  if (!station) {
    throw new CustomError("Station not found", 404);
  }

  // Check if battery code already exists
  const existingBattery = await prisma.batteries.findFirst({
    where: { battery_code },
  });

  if (existingBattery) {
    throw new CustomError("Battery with this code already exists", 400);
  }

  // ✅ Capacity Warning Logic (theo DOC)
  const currentBatteryCount = await prisma.batteries.count({
    where: { station_id },
  });

  const capacityPercentage =
    (currentBatteryCount / Number(station.capacity)) * 100;

  // >= 100% → Không cho thêm pin mới
  if (capacityPercentage >= 100) {
    throw new CustomError(
      `Trạm đã đầy (${currentBatteryCount}/${station.capacity} pin). Không thể thêm pin mới.`,
      400
    );
  }

  // >= 90% → Cảnh báo (nhưng vẫn cho thêm)
  let warningMessage = null;
  if (capacityPercentage >= 90) {
    warningMessage = `Cảnh báo: Trạm sắp đầy (${Math.round(capacityPercentage)}%). Chỉ còn ${station.capacity - currentBatteryCount} slot.`;
  }

  const healthValue = Number(health_percentage);
  if (Number.isNaN(healthValue) || healthValue < 0 || healthValue > 100) {
    throw new CustomError("health_percentage must be between 0 and 100", 400);
  }

  const cycleValue = Number(cycle_count);
  if (Number.isNaN(cycleValue) || cycleValue < 0) {
    throw new CustomError("cycle_count must be a non-negative number", 400);
  }

  const battery = await prisma.batteries.create({
    data: {
      battery_code: battery_code as string,
      station_id: station_id as string,
      model: model as string,
      capacity_kwh: capacity_kwh
        ? new Prisma.Decimal(capacity_kwh as number)
        : null,
      voltage: voltage ? new Prisma.Decimal(voltage as number) : null,
      current_charge: current_charge as number,
      status: status as string,
      last_charged_at: status === "full" ? new Date() : null,
      health_percentage: healthValue ? new Prisma.Decimal(healthValue) : null,
      cycle_count: cycleValue,
      updated_at: new Date(),
    } as Prisma.batteriesUncheckedCreateInput,
    include: {
      stations: {
        select: {
          station_id: true,
          name: true,
          address: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: warningMessage || "Battery added successfully",
    data: {
      ...battery,
      status_label: batteryStatusLabels[battery.status] ?? battery.status,
      capacity_info: {
        current_count: currentBatteryCount + 1,
        capacity: Number(station.capacity),
        capacity_percentage: Math.round(
          ((currentBatteryCount + 1) / Number(station.capacity)) * 100
        ),
        warning:
          capacityPercentage >= 90
            ? {
                level: "almost_full",
                percentage: Math.round(capacityPercentage),
              }
            : null,
      },
    },
  });
});

/**
 * Get battery details
 */
export const getBatteryDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const battery = await prisma.batteries.findUnique({
      where: { battery_id: id },
      include: {
        stations: {
          select: {
            station_id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        battery_transfer_logs: {
          include: {
            stations_battery_transfer_logs_from_station_idTostations: {
              select: {
                station_id: true,
                name: true,
                address: true,
              },
            },
            stations_battery_transfer_logs_to_station_idTostations: {
              select: {
                station_id: true,
                name: true,
                address: true,
              },
            },
            users: {
              select: {
                user_id: true,
                full_name: true,
                email: true,
              },
            },
          },
          orderBy: { transferred_at: "desc" },
        },
      },
    });

    if (!battery) {
      throw new CustomError("Battery not found", 404);
    }

    const batteryWithLabel = {
      ...battery,
      capacity_kwh: battery.capacity_kwh ? Number(battery.capacity_kwh) : null,
      voltage: battery.voltage ? Number(battery.voltage) : null,
      health_percentage: battery.health_percentage
        ? Number(battery.health_percentage)
        : null,
      status_label: batteryStatusLabels[battery.status] ?? battery.status,
      stations: battery.stations
        ? {
            ...battery.stations,
            latitude: battery.stations.latitude
              ? Number(battery.stations.latitude)
              : null,
            longitude: battery.stations.longitude
              ? Number(battery.stations.longitude)
              : null,
          }
        : null,
    };

    res.status(200).json({
      success: true,
      message: "Battery details retrieved successfully",
      data: batteryWithLabel,
    });
  }
);

/**
 * Update battery status
 */
export const updateBatteryStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, current_charge, health_percentage, cycle_count } = req.body;

    if (!status) {
      throw new CustomError("Status is required", 400);
    }

    const battery = await prisma.batteries.findUnique({
      where: { battery_id: id },
    });

    if (!battery) {
      throw new CustomError("Battery not found", 404);
    }

    const updateData: any = { status };

    if (current_charge !== undefined) {
      updateData.current_charge = current_charge;
    }

    if (health_percentage !== undefined) {
      const healthValue = Number(health_percentage);
      if (Number.isNaN(healthValue) || healthValue < 0 || healthValue > 100) {
        throw new CustomError(
          "health_percentage must be between 0 and 100",
          400
        );
      }
      updateData.health_percentage = healthValue;
    }

    if (cycle_count !== undefined) {
      const cycleValue = Number(cycle_count);
      if (Number.isNaN(cycleValue) || cycleValue < 0) {
        throw new CustomError("cycle_count must be a non-negative number", 400);
      }
      updateData.cycle_count = cycleValue;
    }

    if (status === "full" && current_charge === 100) {
      updateData.last_charged_at = new Date();
    }

    // Auto charge logic for low battery
    if (status === "low" && current_charge < 20) {
      // Simulate charging process
      setTimeout(async () => {
        try {
          await prisma.batteries.update({
            where: { battery_id: id },
            data: {
              status: "charging",
              current_charge: Math.min(current_charge + 20, 100),
            },
          });

          // If fully charged, update status
          if (current_charge + 20 >= 100) {
            await prisma.batteries.update({
              where: { battery_id: id },
              data: {
                status: "full",
                current_charge: 100,
                last_charged_at: new Date(),
              },
            });
          }
        } catch (error) {
          console.error("Auto charge failed:", error);
        }
      }, 5000); // 5 seconds delay to simulate charging
    }

    const updatedBattery = await prisma.batteries.update({
      where: { battery_id: id },
      data: updateData,
      include: {
        stations: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    const updatedBatteryWithLabel = {
      ...updatedBattery,
      status_label:
        batteryStatusLabels[updatedBattery.status] ?? updatedBattery.status,
    };

    res.status(200).json({
      success: true,
      message: "Battery status updated successfully",
      data: updatedBatteryWithLabel,
    });
  }
);

/**
 * Get battery history
 */
export const getBatteryHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const history = await prisma.battery_transfer_logs.findMany({
      where: { battery_id: id },
      include: {
        stations_battery_transfer_logs_from_station_idTostations: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
        stations_battery_transfer_logs_to_station_idTostations: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
        users: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { transferred_at: "desc" },
      skip,
      take: parseInt(limit as string),
    });

    const total = await prisma.battery_transfer_logs.count({
      where: { battery_id: id },
    });

    res.status(200).json({
      success: true,
      message: "Battery history retrieved successfully",
      data: {
        history,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  }
);

/**
 * Delete battery
 */
export const deleteBattery = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const battery = await prisma.batteries.findUnique({
      where: { battery_id: id },
    });

    if (!battery) {
      throw new CustomError("Battery not found", 404);
    }

    // Check if battery is in use
    if (battery.status === "in_use") {
      throw new CustomError(
        "Cannot delete battery that is currently in use",
        400
      );
    }

    // Check if battery has active transactions
    const activeTransactions = await prisma.transactions.findFirst({
      where: {
        OR: [{ old_battery_id: id }, { new_battery_id: id }],
        payment_status: { in: ["pending", "completed"] },
      },
    });

    if (activeTransactions) {
      throw new CustomError(
        "Cannot delete battery with active transactions",
        400
      );
    }

    await prisma.batteries.delete({
      where: { battery_id: id },
    });

    res.status(200).json({
      success: true,
      message: "Battery deleted successfully",
    });
  }
);
