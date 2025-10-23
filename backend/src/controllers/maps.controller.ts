import { Request, Response } from "express";
import { CustomError } from "../middlewares/error.middleware";

/**
 * Test Track-Asia Maps API
 */
export const testMaps = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      throw new CustomError("Latitude and longitude are required", 400);
    }

    // Test Track-Asia API with coordinates
    const trackAsiaToken = process.env.TRACKASIA_ACCESS_TOKEN;

    if (!trackAsiaToken) {
      throw new CustomError("Track-Asia API token not configured", 500);
    }

    // Test reverse geocoding
    const geocodingUrl = `https://api.trackasia.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${trackAsiaToken}`;

    const response = await fetch(geocodingUrl);
    const data = await response.json();

    res.status(200).json({
      success: true,
      message: "Track-Asia Maps API is working",
      data: {
        coordinates: {
          lat: parseFloat(lat as string),
          lng: parseFloat(lng as string),
        },
        geocoding: data,
        token: trackAsiaToken.substring(0, 10) + "...", // Hide full token
      },
    });
  } catch (error) {
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to test Track-Asia Maps API",
      });
    }
  }
};

/**
 * Calculate distance between two points
 */
export const calculateDistance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { lat1, lng1, lat2, lng2 } = req.body;

    if (!lat1 || !lng1 || !lat2 || !lng2) {
      throw new CustomError("All coordinates are required", 400);
    }

    // Haversine formula for distance calculation
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
      message: "Distance calculated successfully",
      data: {
        from: { lat: lat1, lng: lng1 },
        to: { lat: lat2, lng: lng2 },
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        unit: "kilometers",
      },
    });
  } catch (error) {
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to calculate distance",
      });
    }
  }
};







