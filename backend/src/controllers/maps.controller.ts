import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";

/**
 * Get directions from user location to station
 * Returns: route geometry, distance, and duration using Track-Asia Maps API
 */
export const getDirections = asyncHandler(
  async (req: Request, res: Response) => {
    const { from_lat, from_lng, to_lat, to_lng } = req.query;

    if (!from_lat || !from_lng || !to_lat || !to_lng) {
      throw new CustomError(
        "from_lat, from_lng, to_lat, and to_lng are required",
        400
      );
    }

    const trackAsiaToken = process.env.TRACKASIA_ACCESS_TOKEN;

    if (!trackAsiaToken) {
      throw new CustomError("Track-Asia API token not configured", 500);
    }

    // Track-Asia Directions API
    // Format: {lng},{lat};{lng},{lat}
    const fromLng = parseFloat(from_lng as string);
    const fromLat = parseFloat(from_lat as string);
    const toLng = parseFloat(to_lng as string);
    const toLat = parseFloat(to_lat as string);

    const directionsUrl = `https://api.trackasia.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}?access_token=${trackAsiaToken}&geometries=geojson&overview=full`;

    try {
      const response = await fetch(directionsUrl);
      const data = (await response.json()) as any;

      if (data.code !== "Ok") {
        throw new CustomError(data.message || "Failed to get directions", 400);
      }

      const route = data.routes[0];
      const distance = route.distance / 1000; // Convert meters to kilometers
      const duration = route.duration / 60; // Convert seconds to minutes

      res.status(200).json({
        success: true,
        message: "Directions retrieved successfully",
        data: {
          from: { lat: fromLat, lng: fromLng },
          to: { lat: toLat, lng: toLng },
          distance: Math.round(distance * 100) / 100, // km, 2 decimal places
          duration: Math.round(duration * 10) / 10, // minutes, 1 decimal place
          geometry: route.geometry, // GeoJSON geometry for map display
          steps: route.legs?.[0]?.steps || [], // Route steps for navigation
        },
      });
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to get directions from Track-Asia API",
        500
      );
    }
  }
);

/**
 * Calculate distance and duration from user to station
 * Simplified version - just returns distance and time
 */
export const getDistanceAndDuration = asyncHandler(
  async (req: Request, res: Response) => {
    const { from_lat, from_lng, to_lat, to_lng } = req.query;

    if (!from_lat || !from_lng || !to_lat || !to_lng) {
      throw new CustomError(
        "from_lat, from_lng, to_lat, and to_lng are required",
        400
      );
    }

    const trackAsiaToken = process.env.TRACKASIA_ACCESS_TOKEN;

    if (!trackAsiaToken) {
      throw new CustomError("Track-Asia API token not configured", 500);
    }

    const fromLng = parseFloat(from_lng as string);
    const fromLat = parseFloat(from_lat as string);
    const toLng = parseFloat(to_lng as string);
    const toLat = parseFloat(to_lat as string);

    // Use Directions API for accurate distance and duration
    const directionsUrl = `https://api.trackasia.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}?access_token=${trackAsiaToken}&geometries=geojson`;

    try {
      const response = await fetch(directionsUrl);
      const data = (await response.json()) as any;

      if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
        throw new CustomError(
          data.message || "Failed to calculate distance and duration",
          400
        );
      }

      const route = data.routes[0];
      const distance = route.distance / 1000; // meters to km
      const duration = route.duration / 60; // seconds to minutes

      res.status(200).json({
        success: true,
        message: "Distance and duration calculated successfully",
        data: {
          from: { lat: fromLat, lng: fromLng },
          to: { lat: toLat, lng: toLng },
          distance_km: Math.round(distance * 100) / 100,
          duration_minutes: Math.round(duration * 10) / 10,
          distance_meters: Math.round(route.distance),
          duration_seconds: Math.round(route.duration),
        },
      });
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to calculate distance and duration from Track-Asia API",
        500
      );
    }
  }
);

/**
 * Calculate distance using Haversine formula (straight-line distance)
 * Note: Use getDistanceAndDuration for road distance with Track-Asia API
 */
export const calculateDistance = asyncHandler(
  async (req: Request, res: Response) => {
    const { lat1, lng1, lat2, lng2 } = req.body;

    if (!lat1 || !lng1 || !lat2 || !lng2) {
      throw new CustomError("All coordinates are required", 400);
    }

    // Haversine formula for straight-line distance calculation
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    res.status(200).json({
      success: true,
      message: "Distance calculated successfully (straight-line)",
      data: {
        from: { lat: lat1, lng: lng1 },
        to: { lat: lat2, lng: lng2 },
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        unit: "kilometers",
        note: "This is straight-line distance. Use /distance for road distance and duration.",
      },
    });
  }
);

/**
 * Test Track-Asia Maps API connection
 */
export const testMaps = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    throw new CustomError("Latitude and longitude are required", 400);
  }

  const trackAsiaToken = process.env.TRACKASIA_ACCESS_TOKEN;

  if (!trackAsiaToken) {
    throw new CustomError("Track-Asia API token not configured", 500);
  }

  // Test reverse geocoding
  const geocodingUrl = `https://api.trackasia.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${trackAsiaToken}`;

  try {
    const response = await fetch(geocodingUrl);
    const data = (await response.json()) as any;

    res.status(200).json({
      success: true,
      message: "Track-Asia Maps API is working",
      data: {
        coordinates: {
          lat: parseFloat(lat as string),
          lng: parseFloat(lng as string),
        },
        geocoding: data,
        token_configured: !!trackAsiaToken,
      },
    });
  } catch (error) {
    throw new CustomError("Failed to test Track-Asia Maps API", 500);
  }
});
