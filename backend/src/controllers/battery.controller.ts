import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";

const prisma = new PrismaClient();

/**
 * Get station batteries
 */
export const getStationBatteries = asyncHandler(
  async (req: Request, res: Response) => {
    const { stationId } = req.params;
    const { status, model } = req.query;

    const whereClause: any = { station_id: stationId };
    if (status) {
      whereClause.status = status;
    }
    if (model) {
      whereClause.model = model;
    }

    const batteries = await prisma.battery.findMany({
      where: whereClause,
      include: {
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json({
      success: true,
      message: "Station batteries retrieved successfully",
      data: batteries,
    });
  }
);

/**
 * Add new battery
 */
export const addBattery = asyncHandler(async (req: Request, res: Response) => {
  const { stationId } = req.params;
  const {
    battery_code,
    model,
    capacity_kwh,
    voltage,
    current_charge = 100,
    status = "full",
  } = req.body;

  if (!battery_code || !model) {
    throw new CustomError("Battery code and model are required", 400);
  }

  // Check if station exists
  const station = await prisma.station.findUnique({
    where: { station_id: stationId },
  });

  if (!station) {
    throw new CustomError("Station not found", 404);
  }

  // Check if battery code already exists
  const existingBattery = await prisma.battery.findFirst({
    where: { battery_code },
  });

  if (existingBattery) {
    throw new CustomError("Battery with this code already exists", 400);
  }

  const battery = await prisma.battery.create({
    data: {
      battery_code,
      station_id: stationId,
      model,
      capacity_kwh,
      voltage,
      current_charge,
      status,
      last_charged_at: status === "full" ? new Date() : null,
    },
    include: {
      station: {
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
    message: "Battery added successfully",
    data: battery,
  });
});

/**
 * Get battery details
 */
export const getBatteryDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const battery = await prisma.battery.findUnique({
      where: { battery_id: id },
      include: {
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        transfer_logs: {
          include: {
            from_station: {
              select: {
                station_id: true,
                name: true,
                address: true,
              },
            },
            to_station: {
              select: {
                station_id: true,
                name: true,
                address: true,
              },
            },
            transferred_by_user: {
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

    res.status(200).json({
      success: true,
      message: "Battery details retrieved successfully",
      data: battery,
    });
  }
);

/**
 * Update battery status
 */
export const updateBatteryStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, current_charge } = req.body;

    if (!status) {
      throw new CustomError("Status is required", 400);
    }

    const battery = await prisma.battery.findUnique({
      where: { battery_id: id },
    });

    if (!battery) {
      throw new CustomError("Battery not found", 404);
    }

    const updateData: any = { status };

    if (current_charge !== undefined) {
      updateData.current_charge = current_charge;
    }

    if (status === "full" && current_charge === 100) {
      updateData.last_charged_at = new Date();
    }

    // Auto charge logic for low battery
    if (status === "low" && current_charge < 20) {
      // Simulate charging process
      setTimeout(async () => {
        try {
          await prisma.battery.update({
            where: { battery_id: id },
            data: {
              status: "charging",
              current_charge: Math.min(current_charge + 20, 100),
            },
          });

          // If fully charged, update status
          if (current_charge + 20 >= 100) {
            await prisma.battery.update({
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

    const updatedBattery = await prisma.battery.update({
      where: { battery_id: id },
      data: updateData,
      include: {
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Battery status updated successfully",
      data: updatedBattery,
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

    const history = await prisma.batteryTransferLog.findMany({
      where: { battery_id: id },
      include: {
        from_station: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
        to_station: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
        transferred_by_user: {
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

    const total = await prisma.batteryTransferLog.count({
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

    const battery = await prisma.battery.findUnique({
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
    const activeTransactions = await prisma.transaction.findFirst({
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

    await prisma.battery.delete({
      where: { battery_id: id },
    });

    res.status(200).json({
      success: true,
      message: "Battery deleted successfully",
    });
  }
);
