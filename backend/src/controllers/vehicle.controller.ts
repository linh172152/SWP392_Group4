import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";
import { prisma } from "../server";

/**
 * Get user's vehicles
 */
export const getUserVehicles = asyncHandler(
  async (req: Request, res: Response) => {
    // Middleware already ensures req.user exists and role is DRIVER
    const userId = req.user!.userId;

    const vehicles = await prisma.vehicles.findMany({
      where: { user_id: userId },
      include: {
        users: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        batteries: {
          select: {
            battery_id: true,
            battery_code: true,
            status: true,
            current_charge: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const vehiclesWithBattery = vehicles.map(
      (vehicle: (typeof vehicles)[number]) => ({
        ...vehicle,
        batteries: vehicle.batteries ?? null,
      })
    );

    res.status(200).json({
      success: true,
      message: "Vehicles retrieved successfully",
      data: vehiclesWithBattery,
    });
  }
);

/**
 * Add new vehicle
 */
export const addVehicle = asyncHandler(async (req: Request, res: Response) => {
  // Middleware already ensures req.user exists and role is DRIVER
  const userId = req.user!.userId;
  const {
    license_plate,
    vehicle_type,
    make,
    brand,
    model,
    year,
    battery_model,
    current_battery_code,
  } = req.body;

  if (!license_plate || !vehicle_type || !battery_model) {
    throw new CustomError(
      "License plate, vehicle type and battery model are required",
      400
    );
  }

  // Normalize vehicle_type: support both backend (car/motorbike) and frontend (CAR/MOTORBIKE/TRUCK)
  let normalizedVehicleType = vehicle_type?.toLowerCase();
  if (normalizedVehicleType === "truck") {
    normalizedVehicleType = "car";
  }
  if (
    normalizedVehicleType !== "car" &&
    normalizedVehicleType !== "motorbike"
  ) {
    throw new CustomError("Vehicle type must be 'car' or 'motorbike'", 400);
  }

  // Handle make/brand: support both field names
  const vehicleMake = make || brand;

  // Check if license plate already exists
  const existingVehicle = await prisma.vehicles.findFirst({
    where: { license_plate },
  });

  if (existingVehicle) {
    throw new CustomError(
      "Vehicle with this license plate already exists",
      400
    );
  }

  const trimmedBatteryCode =
    typeof current_battery_code === "string"
      ? current_battery_code.trim()
      : current_battery_code === undefined || current_battery_code === null
        ? undefined
        : String(current_battery_code).trim();

  if (!trimmedBatteryCode) {
    throw new CustomError(
      "Current battery code is required when registering a vehicle",
      400
    );
  }

  const batteryExists = await prisma.batteries.findUnique({
    where: { battery_code: trimmedBatteryCode },
    select: { battery_id: true },
  });

  if (batteryExists) {
    throw new CustomError(
      `Battery code "${trimmedBatteryCode}" already exists. Please enter the exact code provided with the new vehicle.`,
      400
    );
  }

  const defaultStation = await prisma.stations.findFirst({
    where: { status: "active" },
    select: { station_id: true, name: true },
  });

  if (!defaultStation) {
    throw new CustomError(
      "Không tìm thấy trạm đang hoạt động để ghi nhận pin mới. Vui lòng liên hệ quản trị viên.",
      500
    );
  }

  console.log(
    `[addVehicle] Creating battery "${trimmedBatteryCode}" for vehicle ${license_plate}`
  );

  const { createdVehicle } = await prisma.$transaction(async (tx) => {
    const createdBattery = await tx.batteries.create({
      data: {
        battery_code: trimmedBatteryCode,
        model: battery_model,
        status: "in_use",
        current_charge: 100,
        station_id: defaultStation.station_id,
        updated_at: new Date(),
      } as Prisma.batteriesUncheckedCreateInput,
      select: {
        battery_id: true,
        battery_code: true,
        status: true,
        current_charge: true,
      },
    });

    const newVehicle = await tx.vehicles.create({
      data: {
        license_plate,
        vehicle_type: normalizedVehicleType as any,
        make: vehicleMake,
        model,
        year,
        battery_model,
        current_battery_id: createdBattery.battery_id,
        user_id: userId,
      } as any,
      include: {
        users: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        batteries: {
          select: {
            battery_id: true,
            battery_code: true,
            status: true,
            current_charge: true,
          },
        } as any,
      } as any,
    });

    await tx.battery_history.create({
      data: {
        battery_id: createdBattery.battery_id,
        vehicle_id: newVehicle.vehicle_id,
        station_id: defaultStation.station_id,
        action: "issued",
        notes: `Pin ${createdBattery.battery_code} đăng ký cùng xe ${newVehicle.license_plate}`,
      },
    });

    return { createdVehicle: newVehicle };
  });

  console.log(`[addVehicle] ✅ Vehicle created successfully:`, {
    vehicle_id: createdVehicle.vehicle_id,
    license_plate: createdVehicle.license_plate,
    current_battery_id: createdVehicle.current_battery_id,
    current_battery: createdVehicle.current_battery,
    has_current_battery: !!createdVehicle.current_battery,
  });

  res.status(201).json({
    success: true,
    message: "Vehicle added successfully",
    data: createdVehicle,
  });
});

/**
 * Get vehicle details
 */
export const getVehicleDetails = asyncHandler(
  async (req: Request, res: Response) => {
    // Middleware already ensures req.user exists and role is DRIVER
    const userId = req.user!.userId;
    const { id } = req.params;

    const vehicle = await prisma.vehicles.findFirst({
      where: {
        vehicle_id: id,
        user_id: userId,
      },
      include: {
        users: {
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
    // Middleware already ensures req.user exists and role is DRIVER
    const userId = req.user!.userId;
    const { id } = req.params;
    const {
      license_plate,
      vehicle_type,
      make,
      brand,
      model,
      year,
      battery_model,
      current_battery_code,
    } = req.body;

    const vehicle = await prisma.vehicles.findFirst({
      where: {
        vehicle_id: id,
        user_id: userId,
      },
      include: {
        batteries: {
          select: {
            battery_code: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new CustomError("Vehicle not found", 404);
    }

    // Normalize vehicle_type if provided
    let normalizedVehicleType = vehicle_type;
    if (vehicle_type) {
      normalizedVehicleType = vehicle_type.toLowerCase();
      if (normalizedVehicleType === "truck") {
        normalizedVehicleType = "car";
      }
      if (
        normalizedVehicleType !== "car" &&
        normalizedVehicleType !== "motorbike"
      ) {
        throw new CustomError("Vehicle type must be 'car' or 'motorbike'", 400);
      }
    }

    // Handle make/brand: support both field names
    const vehicleMake = make || brand;

    // Check if new license plate already exists (if changed)
    if (license_plate && license_plate !== vehicle.license_plate) {
      const existingVehicle = await prisma.vehicles.findFirst({
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

    if (current_battery_code !== undefined) {
      const trimmedNewCode =
        typeof current_battery_code === "string"
          ? current_battery_code.trim()
          : current_battery_code;

      const existingCode = vehicle.batteries?.battery_code ?? null;

      if (
        (trimmedNewCode === null || trimmedNewCode === "") &&
        existingCode !== null
      ) {
        throw new CustomError(
          "Không thể xoá mã pin hiện tại. Vui lòng liên hệ nhân viên trạm để hỗ trợ đổi pin.",
          400
        );
      }

      if (
        typeof trimmedNewCode === "string" &&
        trimmedNewCode.length > 0 &&
        trimmedNewCode !== existingCode
      ) {
        throw new CustomError(
          "Không thể thay đổi mã pin trực tiếp. Vui lòng liên hệ nhân viên trạm để đổi pin.",
          400
        );
      }
    }

    const updatedVehicle = await prisma.vehicles.update({
      where: { vehicle_id: id },
      data: {
        ...(license_plate && { license_plate }),
        ...(normalizedVehicleType && {
          vehicle_type: normalizedVehicleType as any,
        }),
        ...(vehicleMake !== undefined && { make: vehicleMake }),
        ...(model !== undefined && { model }),
        ...(year !== undefined && { year }),
        ...(battery_model !== undefined && { battery_model }),
      },
      include: {
        users: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        batteries: {
          select: {
            battery_id: true,
            battery_code: true,
            status: true,
            current_charge: true,
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
    // Middleware already ensures req.user exists and role is DRIVER
    const userId = req.user!.userId;
    const { id } = req.params;

    const vehicle = await prisma.vehicles.findFirst({
      where: {
        vehicle_id: id,
        user_id: userId,
      },
    });

    if (!vehicle) {
      throw new CustomError("Vehicle not found", 404);
    }

    // Check if vehicle has active bookings
    const activeBookings = await prisma.bookings.findFirst({
      where: {
        vehicle_id: id,
        status: { in: ["pending", "confirmed"] },
      },
    });

    if (activeBookings) {
      throw new CustomError("Cannot delete vehicle with active bookings", 400);
    }

    await prisma.vehicles.delete({
      where: { vehicle_id: id },
    });

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  }
);

/**
 * Get vehicle options (brands, models, battery models) from all vehicles in system
 */
export const getVehicleOptions = asyncHandler(
  async (_req: Request, res: Response) => {
    // Get all unique brands, models, and battery models from all vehicles
    const allVehicles = await prisma.vehicles.findMany({
      select: {
        make: true,
        model: true,
        battery_model: true,
      },
      where: {
        make: { not: null },
        model: { not: null },
      },
    });

    // Extract unique values
    const brandsSet = new Set<string>();
    const modelsSet = new Set<string>();
    const batteryModelsSet = new Set<string>();

    allVehicles.forEach((vehicle) => {
      if (vehicle.make) brandsSet.add(vehicle.make.trim());
      if (vehicle.model) modelsSet.add(vehicle.model.trim());
      if (vehicle.battery_model)
        batteryModelsSet.add(vehicle.battery_model.trim());
    });

    // Also get battery models from batteries table
    const allBatteries = await prisma.batteries.findMany({
      select: {
        model: true,
      },
      distinct: ["model"],
    });

    allBatteries.forEach((battery) => {
      if (battery.model) batteryModelsSet.add(battery.model.trim());
    });

    res.status(200).json({
      success: true,
      message: "Vehicle options retrieved successfully",
      data: {
        brands: Array.from(brandsSet).sort(),
        vehicleModels: Array.from(modelsSet).sort(),
        batteryModels: Array.from(batteryModelsSet).sort(),
      },
    });
  }
);
