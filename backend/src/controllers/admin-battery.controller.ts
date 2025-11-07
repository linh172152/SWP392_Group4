import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { asyncHandler, CustomError } from "../middlewares/error.middleware";
import { prisma } from "../server";

const BATTERY_STATUS_VALUES = [
  "available",
  "charging",
  "in_use",
  "maintenance",
  "damaged",
] as const;

type BatteryStatusValue = (typeof BATTERY_STATUS_VALUES)[number];

const batteryInclude = {
  station: {
    select: {
      station_id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
    },
  },
} satisfies Prisma.BatteryInclude;

/**
 * Get all batteries (admin view - all stations)
 */
export const getAllBatteries = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      station_id,
      status,
      model,
      min_health,
      page = 1,
      limit = 20,
    } = req.query;

    const whereClause: Prisma.BatteryWhereInput = {};

    if (station_id) whereClause.station_id = station_id as string;
    if (status) {
      const statusValue = status as string;
      if (!BATTERY_STATUS_VALUES.includes(statusValue as BatteryStatusValue)) {
        throw new CustomError("Invalid battery status filter", 400);
      }
      whereClause.status = statusValue as BatteryStatusValue;
    }
    if (model) {
      whereClause.model = {
        contains: model as string,
        mode: "insensitive",
      };
    }
    if (min_health) {
      whereClause.health_percentage = {
        gte: parseFloat(min_health as string),
      };
    }

    const take = Math.max(1, parseInt(limit as string, 10));
    const skip = (Math.max(1, parseInt(page as string, 10)) - 1) * take;

    const [batteries, total] = await prisma.$transaction([
      prisma.battery.findMany({
        where: whereClause,
        include: batteryInclude,
        orderBy: [{ station_id: "asc" }, { created_at: "desc" }],
        skip,
        take,
      }),
      prisma.battery.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      message: "Batteries retrieved successfully",
      data: {
        batteries,
        pagination: {
          page: Math.max(1, parseInt(page as string, 10)),
          limit: take,
          total,
          pages: Math.ceil(total / take) || 1,
        },
      },
    });
  }
);

/**
 * Get battery by ID
 */
export const getBatteryById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new CustomError("Battery ID is required", 400);
    }

    const battery = await prisma.battery.findUnique({
      where: { battery_id: id },
      include: {
        ...batteryInclude,
        transfer_logs_from: {
          take: 10,
          orderBy: { transferred_at: "desc" },
          include: {
            from_station: {
              select: { name: true },
            },
            to_station: {
              select: { name: true },
            },
          },
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
 * Create new battery
 */
export const createBattery = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      station_id,
      model,
      battery_code,
      status = "available",
      health_percentage = 100,
      cycle_count = 0,
    } = req.body;

    if (!station_id || !model || !battery_code) {
      throw new CustomError(
        "station_id, model, and battery_code are required",
        400
      );
    }

    // Validate status
    if (!BATTERY_STATUS_VALUES.includes(status as BatteryStatusValue)) {
      throw new CustomError("Invalid battery status", 400);
    }

    // Check if station exists
    const station = await prisma.station.findUnique({
      where: { station_id },
      select: {
        station_id: true,
        capacity: true,
        _count: {
          select: { batteries: true },
        },
      },
    });

    if (!station) {
      throw new CustomError("Station not found", 404);
    }

    // Check station capacity
    if (station._count.batteries >= station.capacity) {
      throw new CustomError(
        `Station is at full capacity (${station.capacity} batteries)`,
        400
      );
    }

    // Check if battery code already exists
    const existingBattery = await prisma.battery.findFirst({
      where: { battery_code },
    });

    if (existingBattery) {
      throw new CustomError("Battery code already exists", 409);
    }

    const battery = await prisma.battery.create({
      data: {
        station_id,
        model,
        battery_code,
        status: status as BatteryStatusValue,
        health_percentage,
        cycle_count,
      },
      include: batteryInclude,
    });

    res.status(201).json({
      success: true,
      message: "Battery created successfully",
      data: battery,
    });
  }
);

/**
 * Update battery
 */
export const updateBattery = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      station_id,
      model,
      battery_code,
      status,
      health_percentage,
      cycle_count,
    } = req.body;

    if (!id) {
      throw new CustomError("Battery ID is required", 400);
    }

    // Check if battery exists
    const existingBattery = await prisma.battery.findUnique({
      where: { battery_id: id },
    });

    if (!existingBattery) {
      throw new CustomError("Battery not found", 404);
    }

    // Validate status if provided
    if (status && !BATTERY_STATUS_VALUES.includes(status as BatteryStatusValue)) {
      throw new CustomError("Invalid battery status", 400);
    }

    // If changing station, check capacity
    if (station_id && station_id !== existingBattery.station_id) {
      const newStation = await prisma.station.findUnique({
        where: { station_id },
        select: {
          station_id: true,
          capacity: true,
          _count: {
            select: { batteries: true },
          },
        },
      });

      if (!newStation) {
        throw new CustomError("New station not found", 404);
      }

      if (newStation._count.batteries >= newStation.capacity) {
        throw new CustomError(
          `New station is at full capacity (${newStation.capacity} batteries)`,
          400
        );
      }
    }

    // If changing battery code, check uniqueness
    if (battery_code && battery_code !== existingBattery.battery_code) {
      const codeExists = await prisma.battery.findFirst({
        where: {
          battery_code,
          battery_id: { not: id },
        },
      });

      if (codeExists) {
        throw new CustomError("Battery code already exists", 409);
      }
    }

    const updateData: Prisma.BatteryUpdateInput = {};
    if (station_id) updateData.station_id = station_id;
    if (model) updateData.model = model;
    if (battery_code) updateData.battery_code = battery_code;
    if (status) updateData.status = status as BatteryStatusValue;
    if (health_percentage !== undefined)
      updateData.health_percentage = health_percentage;
    if (cycle_count !== undefined) updateData.cycle_count = cycle_count;

    const battery = await prisma.battery.update({
      where: { battery_id: id },
      data: updateData,
      include: batteryInclude,
    });

    res.status(200).json({
      success: true,
      message: "Battery updated successfully",
      data: battery,
    });
  }
);

/**
 * Delete battery
 */
export const deleteBattery = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new CustomError("Battery ID is required", 400);
    }

    const battery = await prisma.battery.findUnique({
      where: { battery_id: id },
    });

    if (!battery) {
      throw new CustomError("Battery not found", 404);
    }

    // Check if battery is in use
    if (battery.status === "in_use") {
      throw new CustomError("Cannot delete a battery that is in use", 400);
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

/**
 * Get battery statistics
 */
export const getBatteryStats = asyncHandler(
  async (req: Request, res: Response) => {
    const [
      total,
      byStatus,
      byModel,
      lowHealthCount,
      avgHealth,
      avgCycleCount,
    ] = await prisma.$transaction([
      // Total batteries
      prisma.battery.count(),

      // Group by status
      prisma.battery.groupBy({
        by: ["status"],
        _count: true,
      }),

      // Group by model
      prisma.battery.groupBy({
        by: ["model"],
        _count: true,
        orderBy: {
          _count: {
            model: "desc",
          },
        },
      }),

      // Low health batteries (< 70%)
      prisma.battery.count({
        where: {
          health_percentage: { lt: 70 },
        },
      }),

      // Average health
      prisma.battery.aggregate({
        _avg: {
          health_percentage: true,
        },
      }),

      // Average cycle count
      prisma.battery.aggregate({
        _avg: {
          cycle_count: true,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "Battery statistics retrieved successfully",
      data: {
        total,
        by_status: byStatus.reduce(
          (acc, item) => {
            acc[item.status] = item._count;
            return acc;
          },
          {} as Record<string, number>
        ),
        by_model: byModel.map((item) => ({
          model: item.model,
          count: item._count,
        })),
        low_health_count: lowHealthCount,
        avg_health: avgHealth._avg.health_percentage || 0,
        avg_cycle_count: avgCycleCount._avg.cycle_count || 0,
      },
    });
  }
);

/**
 * Get batteries with low health
 */
export const getLowHealthBatteries = asyncHandler(
  async (req: Request, res: Response) => {
    const { threshold = 70 } = req.query;

    const healthThreshold = parseFloat(threshold as string);

    const batteries = await prisma.battery.findMany({
      where: {
        health_percentage: { lt: healthThreshold },
      },
      include: batteryInclude,
      orderBy: { health_percentage: "asc" },
    });

    res.status(200).json({
      success: true,
      message: "Low health batteries retrieved successfully",
      data: {
        batteries,
        threshold: healthThreshold,
        count: batteries.length,
      },
    });
  }
);
