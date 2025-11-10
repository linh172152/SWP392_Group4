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
        current_battery: {
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
  const { license_plate, vehicle_type, make, brand, model, year, battery_model, current_battery_code } =
    req.body;
  
  console.log(`[addVehicle] Received request body:`, {
    license_plate,
    vehicle_type,
    battery_model,
    current_battery_code,
    current_battery_code_type: typeof current_battery_code,
    current_battery_code_length: current_battery_code?.length,
    full_body: JSON.stringify(req.body),
  });

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

  // Convert current_battery_code to current_battery_id if provided
  // ✅ Nếu pin không tồn tại (pin mới từ hãng), tự động tạo pin mới với status "in_use"
  let currentBatteryId: string | undefined = undefined;
  
  if (current_battery_code && typeof current_battery_code === 'string' && current_battery_code.trim().length > 0) {
    const trimmedCode = current_battery_code.trim();
    console.log(`[addVehicle] Processing battery code: "${trimmedCode}"`);
    
    try {
      // Tìm pin trong database
      let battery = await prisma.battery.findUnique({
        where: { battery_code: trimmedCode },
        select: { battery_id: true, status: true, battery_code: true, model: true, station_id: true },
      });

      if (!battery) {
        // ✅ Pin không tồn tại → Tạo pin mới (pin từ hãng, đang gắn trên xe mới)
        console.log(`[addVehicle] ⚠️ Battery "${trimmedCode}" not found. Creating new battery (from manufacturer)...`);
        
        // Tạo pin mới với status "in_use" (đang gắn trên xe)
        // Lưu ý: pin mới từ hãng chưa có station_id, sẽ được set khi đổi pin lần đầu
        // Tạm thời lấy station đầu tiên (sẽ được update khi đổi pin)
        const defaultStation = await prisma.station.findFirst({ 
          where: { status: "active" }, 
          select: { station_id: true } 
        });
        
        if (!defaultStation) {
          throw new CustomError(
            "Không tìm thấy trạm nào để tạo pin mới. Vui lòng liên hệ quản trị viên.",
            500
          );
        }
        
        battery = await prisma.battery.create({
          data: {
            battery_code: trimmedCode,
            model: battery_model, // Dùng battery_model từ vehicle
            status: "in_use", // Pin mới từ hãng đang gắn trên xe
            current_charge: 100, // Giả định pin mới đầy
            station_id: defaultStation.station_id, // Tạm thời gán station đầu tiên, sẽ được update khi đổi pin
          },
          select: { battery_id: true, status: true, battery_code: true, model: true, station_id: true },
        });
        
        console.log(`[addVehicle] ✅ Created new battery: ${battery.battery_code} (ID: ${battery.battery_id})`);
      } else {
        console.log(`[addVehicle] ✅ Found existing battery: ${battery.battery_code}, status: ${battery.status}`);
        
        // Validate battery status - nếu pin đã tồn tại, phải là in_use hoặc available
        if (battery.status !== "in_use" && battery.status !== "full" && battery.status !== "charging") {
          console.log(`[addVehicle] ❌ Battery "${trimmedCode}" has invalid status: ${battery.status}`);
          throw new CustomError(
            `Battery "${trimmedCode}" is not available (status: ${battery.status}). Battery must be in_use, full, or charging.`,
            400
          );
        }
      }

      currentBatteryId = battery.battery_id;
      console.log(`[addVehicle] ✅ Linked battery ${battery.battery_code} (ID: ${currentBatteryId}) to vehicle`);
    } catch (error: any) {
      // Nếu là CustomError, re-throw
      if (error instanceof CustomError) {
        throw error;
      }
      console.error(`[addVehicle] ❌ Error processing battery code "${trimmedCode}":`, error);
      throw new CustomError(
        `Failed to process battery code "${trimmedCode}": ${error.message}`,
        500
      );
    }
  } else {
    console.log(`[addVehicle] ⚠️ No current_battery_code provided (value: "${current_battery_code}", type: ${typeof current_battery_code})`);
  }

  console.log(`[addVehicle] About to create vehicle with currentBatteryId:`, currentBatteryId);

  const vehicle = await prisma.vehicle.create({
    data: {
      license_plate,
      vehicle_type: normalizedVehicleType as any,
      make: vehicleMake,
      model,
      year,
      battery_model,
      current_battery_id: currentBatteryId,
      user_id: userId,
    } as any,
    include: {
      user: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
      current_battery: {
        select: {
          battery_id: true,
          battery_code: true,
          status: true,
          current_charge: true,
        },
      } as any,
    } as any,
  });

  console.log(`[addVehicle] ✅ Vehicle created successfully:`, {
    vehicle_id: (vehicle as any).vehicle_id,
    license_plate: (vehicle as any).license_plate,
    current_battery_id: (vehicle as any).current_battery_id,
    current_battery: (vehicle as any).current_battery,
    has_current_battery: !!(vehicle as any).current_battery,
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
    const { license_plate, vehicle_type, make, brand, model, year, battery_model, current_battery_code } =
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

    // Convert current_battery_code to current_battery_id if provided
    let currentBatteryId: string | undefined | null = undefined;
    if (current_battery_code !== undefined) {
      if (current_battery_code === null || current_battery_code === '') {
        // Allow clearing current_battery_id
        currentBatteryId = null;
      } else if (typeof current_battery_code === 'string' && current_battery_code.trim().length > 0) {
        const battery = await prisma.battery.findUnique({
          where: { battery_code: current_battery_code.trim() },
          select: { battery_id: true, status: true },
        });

        if (!battery) {
          throw new CustomError(
            `Battery with code "${current_battery_code}" not found`,
            404
          );
        }

        // Validate battery status - should be in_use or available
        if (battery.status !== "in_use" && battery.status !== "full" && battery.status !== "charging") {
          throw new CustomError(
            `Battery "${current_battery_code}" is not available (status: ${battery.status})`,
            400
          );
        }

        currentBatteryId = battery.battery_id;
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
        ...(currentBatteryId !== undefined && { current_battery_id: currentBatteryId }),
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        current_battery: {
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
