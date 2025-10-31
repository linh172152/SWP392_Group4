import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";

const prisma = new PrismaClient();

/**
 * Get all stations (Admin)
 */
export const getAllStations = asyncHandler(
  async (req: Request, res: Response) => {
    const { status, page = 1, limit = 10, search } = req.query;

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { address: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const stations = await prisma.station.findMany({
      where: whereClause,
      include: {
        batteries: {
          select: {
            battery_id: true,
            status: true,
          },
        },
        staff: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            transactions: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit as string),
    });

    const stationsWithStats = stations.map((station) => {
      const batteryStatusCount = station.batteries.reduce(
        (acc, battery) => {
          acc[battery.status] = (acc[battery.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        ...station,
        battery_stats: batteryStatusCount,
        total_batteries: station.batteries.length,
        total_bookings: station._count.bookings,
        total_transactions: station._count.transactions,
        staff_count: station.staff.length,
      };
    });

    const total = await prisma.station.count({ where: whereClause });

    res.status(200).json({
      success: true,
      message: "Stations retrieved successfully",
      data: stationsWithStats,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  }
);

/**
 * Get station details (Admin)
 */
export const getStationDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const station = await prisma.station.findUnique({
      where: { station_id: id },
      include: {
        batteries: {
          select: {
            battery_id: true,
            battery_code: true,
            model: true,
            capacity_kwh: true,
            current_charge: true,
            status: true,
            created_at: true,
          },
        },
        staff: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
            status: true,
            created_at: true,
          },
        },
        station_ratings: {
          select: {
            rating: true,
            comment: true,
            created_at: true,
            user: {
              select: {
                full_name: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
            transactions: true,
          },
        },
      },
    });

    if (!station) {
      throw new CustomError("Station not found", 404);
    }

    const batteryStatusCount = station.batteries.reduce(
      (acc, battery) => {
        acc[battery.status] = (acc[battery.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const avgRating =
      station.station_ratings.length > 0
        ? station.station_ratings.reduce((sum, r) => sum + r.rating, 0) /
          station.station_ratings.length
        : 0;

    res.status(200).json({
      success: true,
      message: "Station details retrieved successfully",
      data: {
        ...station,
        battery_stats: batteryStatusCount,
        total_batteries: station.batteries.length,
        average_rating: avgRating,
        total_ratings: station.station_ratings.length,
        total_bookings: station._count.bookings,
        total_transactions: station._count.transactions,
        staff_count: station.staff.length,
      },
    });
  }
);

/**
 * Create new station (Admin)
 */
export const createStation = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      address,
      latitude,
      longitude,
      capacity,
      supported_models,
      operating_hours,
      status = "active",
    } = req.body;

    if (!name || !address || !capacity) {
      throw new CustomError(
        "Name, address, and capacity are required",
        400
      );
    }

    if (capacity < 1) {
      throw new CustomError("Capacity must be at least 1", 400);
    }

    // Validate supported_models if provided
    if (supported_models) {
      if (!Array.isArray(supported_models)) {
        throw new CustomError(
          "supported_models must be an array",
          400
        );
      }
    }

    // Check if station with same name already exists
    const existingStation = await prisma.station.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingStation) {
      throw new CustomError(
        "Station with this name already exists",
        400
      );
    }

    const station = await prisma.station.create({
      data: {
        name,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        capacity: parseInt(capacity),
        supported_models: supported_models || [],
        operating_hours,
        status,
      },
    });

    res.status(201).json({
      success: true,
      message: "Station created successfully",
      data: station,
    });
  }
);

/**
 * Update station (Admin)
 */
export const updateStation = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      name,
      address,
      latitude,
      longitude,
      capacity,
      supported_models,
      operating_hours,
      status,
    } = req.body;

    const station = await prisma.station.findUnique({
      where: { station_id: id },
    });

    if (!station) {
      throw new CustomError("Station not found", 404);
    }

    // If name is being updated, check for duplicates
    if (name && name !== station.name) {
      const existingStation = await prisma.station.findFirst({
        where: {
          name: {
            equals: name,
            mode: "insensitive",
          },
          station_id: {
            not: id,
          },
        },
      });

      if (existingStation) {
        throw new CustomError(
          "Station with this name already exists",
          400
        );
      }
    }

    // Validate capacity if provided
    if (capacity !== undefined) {
      if (capacity < 1) {
        throw new CustomError("Capacity must be at least 1", 400);
      }
    }

    // Validate supported_models if provided
    if (supported_models !== undefined) {
      if (!Array.isArray(supported_models)) {
        throw new CustomError(
          "supported_models must be an array",
          400
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    if (capacity !== undefined) updateData.capacity = parseInt(capacity);
    if (supported_models !== undefined) updateData.supported_models = supported_models;
    if (operating_hours !== undefined) updateData.operating_hours = operating_hours;
    if (status !== undefined) updateData.status = status;

    const updatedStation = await prisma.station.update({
      where: { station_id: id },
      data: updateData,
      include: {
        batteries: {
          select: {
            battery_id: true,
            status: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            transactions: true,
            staff: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Station updated successfully",
      data: updatedStation,
    });
  }
);

/**
 * Delete station (Admin)
 */
export const deleteStation = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const station = await prisma.station.findUnique({
      where: { station_id: id },
      include: {
        _count: {
          select: {
            batteries: true,
            bookings: true,
            staff: true,
            transactions: true,
          },
        },
      },
    });

    if (!station) {
      throw new CustomError("Station not found", 404);
    }

    // Check if station has active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        station_id: id,
        status: {
          in: ["pending", "confirmed"],
        },
      },
    });

    if (activeBookings > 0) {
      throw new CustomError(
        "Cannot delete station with active bookings",
        400
      );
    }

    // Check if station has staff assigned
    if (station._count.staff > 0) {
      throw new CustomError(
        "Cannot delete station with assigned staff. Please reassign staff first",
        400
      );
    }

    // Delete station (cascade will handle batteries if configured)
    await prisma.station.delete({
      where: { station_id: id },
    });

    res.status(200).json({
      success: true,
      message: "Station deleted successfully",
    });
  }
);

