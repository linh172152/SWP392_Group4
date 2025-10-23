import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";

const prisma = new PrismaClient();

/**
 * Find nearby stations
 */
export const findNearbyStations = asyncHandler(
  async (req: Request, res: Response) => {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      throw new CustomError("Latitude and longitude are required", 400);
    }

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const searchRadius = parseFloat(radius as string);

    // Simple bounding box search (for production, use PostGIS or similar)
    const stations = await prisma.station.findMany({
      where: {
        status: "active",
        latitude: {
          gte: lat - searchRadius / 111, // Rough conversion: 1 degree ≈ 111 km
          lte: lat + searchRadius / 111,
        },
        longitude: {
          gte: lng - searchRadius / 111,
          lte: lng + searchRadius / 111,
        },
      },
      include: {
        batteries: {
          where: {
            status: "full",
          },
          select: {
            battery_id: true,
            battery_code: true,
            model: true,
            capacity_kwh: true,
            current_charge: true,
          },
        },
        station_ratings: {
          select: {
            rating: true,
          },
        },
      },
    });

    // Calculate average rating for each station
    const stationsWithRating = stations.map(station => {
      const avgRating = station.station_ratings.length > 0
        ? station.station_ratings.reduce((sum, r) => sum + r.rating, 0) / station.station_ratings.length
        : 0;

      return {
        ...station,
        average_rating: avgRating,
        available_batteries: station.batteries.length,
      };
    });

    res.status(200).json({
      success: true,
      message: "Nearby stations retrieved successfully",
      data: stationsWithRating,
    });
  }
);

/**
 * Get station details
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
            last_charged_at: true,
          },
        },
        station_ratings: {
          include: {
            user: {
              select: {
                user_id: true,
                full_name: true,
              },
            },
          },
        },
        staff: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    if (!station) {
      throw new CustomError("Station not found", 404);
    }

    // Calculate average rating
    const avgRating = station.station_ratings.length > 0
      ? station.station_ratings.reduce((sum, r) => sum + r.rating, 0) / station.station_ratings.length
      : 0;

    const stationWithRating = {
      ...station,
      average_rating: avgRating,
      total_ratings: station.station_ratings.length,
    };

    res.status(200).json({
      success: true,
      message: "Station details retrieved successfully",
      data: stationWithRating,
    });
  }
);

/**
 * Get station batteries
 */
export const getStationBatteries = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.query;

    const whereClause: any = { station_id: id };
    if (status) {
      whereClause.status = status;
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
 * Search stations
 */
export const searchStations = asyncHandler(
  async (req: Request, res: Response) => {
    const { query, latitude, longitude, radius = 10 } = req.query;

    if (!query) {
      throw new CustomError("Search query is required", 400);
    }

    const searchQuery = query as string;
    const lat = latitude ? parseFloat(latitude as string) : null;
    const lng = longitude ? parseFloat(longitude as string) : null;
    const searchRadius = parseFloat(radius as string);

    let whereClause: any = {
      status: "active",
      OR: [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { address: { contains: searchQuery, mode: "insensitive" } },
      ],
    };

    // If coordinates provided, add location filter
    if (lat && lng) {
      whereClause.latitude = {
        gte: lat - searchRadius / 111,
        lte: lat + searchRadius / 111,
      };
      whereClause.longitude = {
        gte: lng - searchRadius / 111,
        lte: lng + searchRadius / 111,
      };
    }

    const stations = await prisma.station.findMany({
      where: whereClause,
      include: {
        batteries: {
          where: {
            status: "full",
          },
          select: {
            battery_id: true,
            battery_code: true,
            model: true,
            capacity_kwh: true,
            current_charge: true,
          },
        },
        station_ratings: {
          select: {
            rating: true,
          },
        },
      },
    });

    // Calculate average rating for each station
    const stationsWithRating = stations.map(station => {
      const avgRating = station.station_ratings.length > 0
        ? station.station_ratings.reduce((sum, r) => sum + r.rating, 0) / station.station_ratings.length
        : 0;

      return {
        ...station,
        average_rating: avgRating,
        available_batteries: station.batteries.length,
      };
    });

    res.status(200).json({
      success: true,
      message: "Stations search completed successfully",
      data: stationsWithRating,
    });
  }
);