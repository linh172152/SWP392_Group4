import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";
import { prisma } from "../server";
import { calculateStationStats } from "../utils/station.util";

/**
 * Find nearby stations
 */
export const findNearbyStations = asyncHandler(
  async (req: Request, res: Response) => {
    // Support both lat/lng and latitude/longitude
    const latitude = req.query.latitude || req.query.lat;
    const longitude = req.query.longitude || req.query.lng;
    const radius = req.query.radius || 10;

    if (!latitude || !longitude) {
      throw new CustomError("Latitude and longitude are required", 400);
    }

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const searchRadius = parseFloat(radius as string);

    // Simple bounding box search (for production, use PostGIS or similar)
    const stations = await prisma.stations.findMany({
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

    // Calculate average rating and distance for each station
    const stationsWithRating = await Promise.all(
      stations.map(async (station) => {
        const avgRating =
          station.station_ratings.length > 0
            ? station.station_ratings.reduce((sum, r) => sum + r.rating, 0) /
              station.station_ratings.length
            : 0;

        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in kilometers
        const stationLat = Number(station.latitude) || 0;
        const stationLng = Number(station.longitude) || 0;
        const userLat = Number(lat);
        const userLng = Number(lng);
        const dLat = ((stationLat - userLat) * Math.PI) / 180;
        const dLng = ((stationLng - userLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((userLat * Math.PI) / 180) *
            Math.cos((stationLat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // ✅ Optimized: Calculate battery inventory and capacity warning in one go
        const stationStats = await calculateStationStats(
          station.station_id,
          station.capacity
        );

        return {
          ...station,
          latitude: station.latitude ? Number(station.latitude) : null,
          longitude: station.longitude ? Number(station.longitude) : null,
          batteries: station.batteries.map((b: any) => ({
            ...b,
            capacity_kwh: b.capacity_kwh ? Number(b.capacity_kwh) : null,
            voltage: b.voltage ? Number(b.voltage) : null,
            health_percentage: b.health_percentage
              ? Number(b.health_percentage)
              : null,
          })),
          average_rating: avgRating,
          available_batteries: station.batteries.length,
          distance_km: distance,
          capacity_percentage: stationStats.capacityPercentage,
          capacity_warning: stationStats.capacityWarning,
          battery_inventory: stationStats.batteryInventory,
        };
      })
    );

    // Sort by distance
    stationsWithRating.sort((a, b) => a.distance_km - b.distance_km);

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
        },
        users: {
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
    const avgRating =
      station.station_ratings.length > 0
        ? station.station_ratings.reduce(
            (sum: number, r: { rating: number }) => sum + r.rating,
            0
          ) / station.station_ratings.length
        : 0;

    // ✅ Optimized: Calculate battery inventory and capacity warning in one go
    const stationStats = await calculateStationStats(
      station.station_id,
      station.capacity
    );

    const stationWithRating = {
      ...station,
      latitude: station.latitude ? Number(station.latitude) : null,
      longitude: station.longitude ? Number(station.longitude) : null,
      batteries: station.batteries.map((b: any) => ({
        ...b,
        capacity_kwh: b.capacity_kwh ? Number(b.capacity_kwh) : null,
        voltage: b.voltage ? Number(b.voltage) : null,
        health_percentage: b.health_percentage
          ? Number(b.health_percentage)
          : null,
      })),
      average_rating: avgRating,
      total_ratings: station.station_ratings.length,
      capacity_percentage: stationStats.capacityPercentage,
      capacity_warning: stationStats.capacityWarning,
      battery_inventory: stationStats.batteryInventory,
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
    const mappedBatteries = batteries.map((battery: any) => ({
      ...battery,
      capacity_kwh: battery.capacity_kwh ? Number(battery.capacity_kwh) : null,
      voltage: battery.voltage ? Number(battery.voltage) : null,
      health_percentage: battery.health_percentage
        ? Number(battery.health_percentage)
        : null,
      station: battery.stations // ✅ Map stations -> station để frontend có thể dùng battery.station.name
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
    }));

    res.status(200).json({
      success: true,
      message: "Station batteries retrieved successfully",
      data: mappedBatteries,
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

    const whereClause: any = {
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
    });

    // Calculate average rating for each station
    const stationsWithRating = stations.map((station) => {
      const avgRating =
        station.station_ratings.length > 0
          ? station.station_ratings.reduce((sum, r) => sum + r.rating, 0) /
            station.station_ratings.length
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
