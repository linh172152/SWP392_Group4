import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";
import { prisma } from "../server";
import { calculateStationStats } from "../utils/station.util";

/**
 * Get all public stations
 */
export const getPublicStations = asyncHandler(
  async (req: Request, res: Response) => {
    const { status, page = 1, limit = 10, search } = req.query;

    const allowedStatuses = ["active", "maintenance", "closed"];
    const normalizedStatus = status
      ? String(status).toLowerCase().trim()
      : "active";

    if (
      normalizedStatus !== "all" &&
      !allowedStatuses.includes(normalizedStatus)
    ) {
      throw new CustomError(
        `Invalid status value. Allowed values: ${allowedStatuses.join(", ")} or "all"`,
        400
      );
    }

    const whereClause: any = {};

    if (normalizedStatus !== "all") {
      whereClause.status = normalizedStatus;
    }

    const searchTerm = typeof search === "string" ? search.trim() : undefined;

    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { address: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const stations = await prisma.stations.findMany({
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
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit as string),
    });

    // Calculate average rating for each station
    const stationsWithRating = stations.map((station: typeof stations[number]) => {
      const avgRating =
        station.station_ratings.length > 0
          ? station.station_ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) /
            station.station_ratings.length
          : 0;

      return {
        ...station,
        average_rating: avgRating,
        total_ratings: station.station_ratings.length,
        available_batteries: station.batteries.length,
      };
    });

    const total = await prisma.stations.count({ where: whereClause });

    res.status(200).json({
      success: true,
      message: "Public stations retrieved successfully",
      data: {
        stations: stationsWithRating,
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
 * Get public station details
 */
export const getPublicStationDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const station = await prisma.stations.findUnique({
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
            users: {
              select: {
                user_id: true,
                full_name: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
          take: 10,
        },
        users: {
          where: { role: "STAFF" },
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!station) {
      throw new CustomError("Station not found", 404);
    }

    // Calculate average rating
    const avgRating =
      station.station_ratings.length > 0
        ? station.station_ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) /
          station.station_ratings.length
        : 0;

    // Count batteries by status
    const batteryStats = station.batteries.reduce(
      (acc: Record<string, number>, battery: { status: string }) => {
        acc[battery.status] = (acc[battery.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // ✅ Optimized: Calculate battery inventory and capacity warning in one go
    const stationStats = await calculateStationStats(
      station.station_id,
      station.capacity
    );

    const stationWithStats = {
      ...station,
      average_rating: avgRating,
      total_ratings: station.station_ratings.length,
      battery_stats: batteryStats,
      available_batteries: station.batteries.filter((b: { status: string }) => b.status === "full")
        .length,
      battery_inventory: stationStats.batteryInventory,
      capacity_percentage: stationStats.capacityPercentage,
      capacity_warning: stationStats.capacityWarning,
    };

    res.status(200).json({
      success: true,
      message: "Public station details retrieved successfully",
      data: stationWithStats,
    });
  }
);

/**
 * Find nearby public stations
 */
export const findNearbyPublicStations = asyncHandler(
  async (req: Request, res: Response) => {
    const { latitude, longitude, radius = 10, battery_model } = req.query;

    if (!latitude || !longitude) {
      throw new CustomError("Latitude and longitude are required", 400);
    }

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const searchRadius = parseFloat(radius as string);

    // Improved bounding box search with buffer (1.5x radius for safety)
    // Then filter by actual Haversine distance to ensure accuracy
    // Buffer accounts for the fact that bounding box is square, not circular
    const buffer = (searchRadius * 1.5) / 111; // Add 50% buffer to bounding box
    const whereClause: any = {
      status: "active",
      latitude: {
        gte: lat - buffer,
        lte: lat + buffer,
      },
      longitude: {
        gte: lng - buffer,
        lte: lng + buffer,
      },
    };

    const stations = await prisma.stations.findMany({
      where: whereClause,
      include: {
        batteries: {
          where: {
            status: "full",
            ...(battery_model && { model: battery_model as string }),
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

    // Calculate distance and average rating for each station
    const stationsWithDistance = await Promise.all(
      stations.map(async (station: typeof stations[number]) => {
        const avgRating =
          station.station_ratings.length > 0
            ? station.station_ratings.reduce(
                (sum: number, r: any) => sum + r.rating,
                0
              ) / station.station_ratings.length
            : 0;

        // Calculate distance using Haversine formula
        const distance = calculateDistance(
          lat,
          lng,
          parseFloat(station.latitude?.toString() || "0"),
          parseFloat(station.longitude?.toString() || "0")
        );

        // ✅ Optimized: Calculate battery inventory and capacity warning in one go
        const stationStats = await calculateStationStats(
          station.station_id,
          station.capacity
        );

        return {
          ...station,
          average_rating: avgRating,
          total_ratings: station.station_ratings.length,
          available_batteries: station.batteries.length,
          distance_km: distance,
          capacity_percentage: stationStats.capacityPercentage,
          capacity_warning: stationStats.capacityWarning,
          battery_inventory: stationStats.batteryInventory,
        };
      })
    );

    // Filter by actual distance (within radius) and sort by distance
    // This ensures we only return stations actually within the requested radius
    const filteredStations = stationsWithDistance
      .filter((station: { distance_km: number }) => station.distance_km <= searchRadius)
      .sort((a: { distance_km: number }, b: { distance_km: number }) => a.distance_km - b.distance_km);

    res.status(200).json({
      success: true,
      message: "Nearby stations retrieved successfully",
      data: {
        stations: filteredStations,
        search_params: {
          latitude: lat,
          longitude: lng,
          radius_km: searchRadius,
          battery_model: battery_model || "all",
        },
      },
    });
  }
);

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}
