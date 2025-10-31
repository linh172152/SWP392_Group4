import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";

const prisma = new PrismaClient();

/**
 * Get user's vehicles
 */
export const getUserVehicles = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const vehicles = await prisma.vehicle.findMany({
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

    res.status(200).json({
      success: true,
      message: "Vehicles retrieved successfully",
      data: vehicles,
    });
  }
);

/**
 * Add new vehicle
 */
export const addVehicle = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { license_plate, vehicle_type, make, brand, model, year, battery_model } =
    req.body;

  if (!userId) {
    throw new CustomError("User not authenticated", 401);
  }

  if (!license_plate || !vehicle_type || !battery_model) {
    throw new CustomError(
      "License plate, vehicle type and battery model are required",
      400
    );
  }

  // Normalize vehicle_type: support both backend (car/motorbike) and frontend (CAR/MOTORBIKE/TRUCK)
  let normalizedVehicleType = vehicle_type?.toLowerCase();
  if (normalizedVehicleType === 'truck') {
    normalizedVehicleType = 'car';
  }
  if (normalizedVehicleType !== 'car' && normalizedVehicleType !== 'motorbike') {
    throw new CustomError(
      "Vehicle type must be 'car' or 'motorbike'",
      400
    );
  }

  // Handle make/brand: support both field names
  const vehicleMake = make || brand;

  // Check if license plate already exists
  const existingVehicle = await prisma.vehicle.findFirst({
    where: { license_plate },
  });

  if (existingVehicle) {
    throw new CustomError(
      "Vehicle with this license plate already exists",
      400
    );
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      license_plate,
      vehicle_type: normalizedVehicleType as any,
      make: vehicleMake,
      model,
      year,
      battery_model,
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

  res.status(201).json({
    success: true,
    message: "Vehicle added successfully",
    data: vehicle,
  });
});

/**
 * Get vehicle details
 */
export const getVehicleDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        vehicle_id: id,
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

    if (!vehicle) {
      throw new CustomError("Vehicle not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Vehicle details retrieved successfully",
      data: vehicle,
    });
  }
);

/**
 * Update vehicle
 */
export const updateVehicle = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { license_plate, vehicle_type, make, brand, model, year, battery_model } =
      req.body;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        vehicle_id: id,
        user_id: userId,
      },
    });

    if (!vehicle) {
      throw new CustomError("Vehicle not found", 404);
    }

    // Normalize vehicle_type if provided
    let normalizedVehicleType = vehicle_type;
    if (vehicle_type) {
      normalizedVehicleType = vehicle_type.toLowerCase();
      if (normalizedVehicleType === 'truck') {
        normalizedVehicleType = 'car';
      }
      if (normalizedVehicleType !== 'car' && normalizedVehicleType !== 'motorbike') {
        throw new CustomError(
          "Vehicle type must be 'car' or 'motorbike'",
          400
        );
      }
    }

    // Handle make/brand: support both field names
    const vehicleMake = make || brand;

    // Check if new license plate already exists (if changed)
    if (license_plate && license_plate !== vehicle.license_plate) {
      const existingVehicle = await prisma.vehicle.findFirst({
        where: {
          license_plate,
          vehicle_id: { not: id },
        },
      });

      if (existingVehicle) {
        throw new CustomError(
          "Vehicle with this license plate already exists",
          400
        );
      }
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { vehicle_id: id },
      data: {
        ...(license_plate && { license_plate }),
        ...(normalizedVehicleType && { vehicle_type: normalizedVehicleType as any }),
        ...(vehicleMake !== undefined && { make: vehicleMake }),
        ...(model !== undefined && { model }),
        ...(year !== undefined && { year }),
        ...(battery_model !== undefined && { battery_model }),
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

    res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      data: updatedVehicle,
    });
  }
);

/**
 * Delete vehicle
 */
export const deleteVehicle = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        vehicle_id: id,
        user_id: userId,
      },
    });

    if (!vehicle) {
      throw new CustomError("Vehicle not found", 404);
    }

    // Check if vehicle has active bookings
    const activeBookings = await prisma.booking.findFirst({
      where: {
        vehicle_id: id,
        status: { in: ["pending", "confirmed"] },
      },
    });

    if (activeBookings) {
      throw new CustomError("Cannot delete vehicle with active bookings", 400);
    }

    await prisma.vehicle.delete({
      where: { vehicle_id: id },
    });

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  }
);
