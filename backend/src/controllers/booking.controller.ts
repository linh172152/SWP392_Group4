import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";
import { prisma, notificationService } from "../server";

/**
 * Get user bookings
 */
export const getUserBookings = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { status, page = 1, limit = 10 } = req.query;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const whereClause: any = { user_id: userId };
    if (status) {
      whereClause.status = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        vehicle: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            make: true,
            model: true,
            year: true,
          },
        },
        transaction: {
          select: {
            transaction_id: true,
            transaction_code: true,
            payment_status: true,
            amount: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit as string),
    });

    const total = await prisma.booking.count({ where: whereClause });

    res.status(200).json({
      success: true,
      message: "User bookings retrieved successfully",
      data: {
        bookings,
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
 * Create new booking
 */
export const createBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { vehicle_id, station_id, battery_model, scheduled_at, notes } =
      req.body;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    if (!vehicle_id || !station_id || !battery_model || !scheduled_at) {
      throw new CustomError(
        "Vehicle ID, station ID, battery model and scheduled time are required",
        400
      );
    }

    // Validate UUIDs format (basic check)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(vehicle_id)) {
      throw new CustomError("Invalid vehicle ID format", 400);
    }
    if (!uuidRegex.test(station_id)) {
      throw new CustomError("Invalid station ID format", 400);
    }

    // Check if vehicle belongs to user
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        vehicle_id,
        user_id: userId,
      },
    });

    if (!vehicle) {
      throw new CustomError(
        "Vehicle not found or does not belong to user",
        404
      );
    }

    // Check if station exists and is active
    const station = await prisma.station.findUnique({
      where: { station_id },
    });

    if (!station || station.status !== "active") {
      throw new CustomError("Station not found or not active", 404);
    }

    // Check if battery model is compatible with vehicle (case-insensitive)
    if (
      vehicle.battery_model.toLowerCase().trim() !==
      battery_model.toLowerCase().trim()
    ) {
      throw new CustomError(
        `Battery model "${battery_model}" is not compatible with your vehicle (requires "${vehicle.battery_model}")`,
        400
      );
    }

    // Validate and parse scheduled_at
    let scheduledTime: Date;
    try {
      scheduledTime = new Date(scheduled_at);
      // Check if date is valid
      if (isNaN(scheduledTime.getTime())) {
        throw new CustomError(
          "Invalid date format for scheduled_at. Please use ISO 8601 format (e.g., 2024-01-15T14:00:00Z)",
          400
        );
      }
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Invalid date format for scheduled_at. Please use ISO 8601 format (e.g., 2024-01-15T14:00:00Z)",
        400
      );
    }

    const now = new Date();
    if (scheduledTime <= now) {
      throw new CustomError("Scheduled time must be in the future", 400);
    }

    // Option 3: Strict validation
    // Minimum: 30 minutes before
    const minTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
    if (scheduledTime < minTime) {
      throw new CustomError(
        "Scheduled time must be at least 30 minutes from now",
        400
      );
    }

    // Maximum: 12 hours before
    const maxTime = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours
    if (scheduledTime > maxTime) {
      throw new CustomError(
        "Scheduled time cannot be more than 12 hours from now",
        400
      );
    }

    // Normalize battery_model for comparison (case-insensitive, trim)
    const normalizedBatteryModel = battery_model.toLowerCase().trim();

    // Get all batteries at station and filter by model (case-insensitive)
    const allBatteriesAtStation = await prisma.battery.findMany({
      where: {
        station_id,
      },
      select: {
        model: true,
        status: true,
      },
    });

    // Filter batteries by model (case-insensitive)
    const batteriesOfModel = allBatteriesAtStation.filter(
      (b) => b.model.toLowerCase().trim() === normalizedBatteryModel
    );

    if (batteriesOfModel.length === 0) {
      // Get unique models for error message
      const availableModels = [
        ...new Set(allBatteriesAtStation.map((b) => b.model)),
      ];
      throw new CustomError(
        `No batteries of model "${battery_model}" found at this station. Available models: ${availableModels.join(", ") || "none"}.`,
        400
      );
    }

    // Check if there are available batteries at scheduled time
    // Exclude batteries that are reserved for confirmed bookings at the same scheduled time
    // Query bookings with case-insensitive battery_model comparison
    const allBookingsAtTime = await prisma.booking.findMany({
      where: {
        station_id,
        scheduled_at: {
          gte: new Date(scheduledTime.getTime() - 30 * 60 * 1000), // 30 minutes before
          lte: new Date(scheduledTime.getTime() + 30 * 60 * 1000), // 30 minutes after
        },
        status: { in: ["pending", "confirmed"] },
      },
      select: {
        battery_model: true,
      },
    });

    // Filter bookings by battery_model (case-insensitive)
    const confirmedBookingsAtTime = allBookingsAtTime.filter(
      (b) => b.battery_model.toLowerCase().trim() === normalizedBatteryModel
    ).length;

    // Get time difference in hours
    const hoursUntilScheduled =
      (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Check total available batteries:
    // 1. Batteries with status = "full" (ready now)
    const fullBatteries = batteriesOfModel.filter(
      (b) => b.status === "full"
    ).length;

    // 2. Batteries with status = "charging" that will be ready by scheduled time
    // Estimate: if battery is charging and scheduled time is >= 1 hour away,
    // assume it will be ready (conservative estimate: charging takes 1-2 hours typically)
    const chargingBatteries =
      hoursUntilScheduled >= 1
        ? batteriesOfModel.filter((b) => b.status === "charging").length
        : 0;

    // Total available = full batteries + charging batteries that will be ready
    const totalAvailableBatteries = fullBatteries + chargingBatteries;

    // Available batteries = total - reserved for other bookings
    const availableBatteries =
      totalAvailableBatteries - confirmedBookingsAtTime;

    if (availableBatteries <= 0) {
      // Provide detailed error message
      const reason =
        totalAvailableBatteries === 0
          ? `No batteries are ready (${fullBatteries} full, ${chargingBatteries} charging)`
          : `All ${totalAvailableBatteries} available batteries are reserved by other bookings (${confirmedBookingsAtTime} bookings in ±30 min window)`;

      throw new CustomError(
        `No available batteries for model "${battery_model}" at this station at ${scheduledTime.toLocaleString()}. ${reason}. Please choose another time or station.`,
        400
      );
    }

    // Generate booking code (max 20 chars: BK + timestamp last 10 digits + 2 random chars)
    const timestamp = Date.now().toString().slice(-10); // Last 10 digits
    const random = Math.random().toString(36).substr(2, 2).toUpperCase();
    const bookingCode = `BK${timestamp}${random}`; // BK + 10 + 2 = 14 chars

    const booking = await prisma.booking.create({
      data: {
        booking_code: bookingCode,
        user_id: userId,
        vehicle_id,
        station_id,
        battery_model,
        scheduled_at: scheduledTime, // Use validated date
        notes,
        status: "pending",
      },
      include: {
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        vehicle: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            make: true,
            model: true,
            year: true,
          },
        },
      },
    });

    // Send notification to user
    try {
      // Get user info for notification
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
        select: { email: true, full_name: true },
      });

      await notificationService.sendNotification({
        type: "booking_confirmed",
        userId: userId,
        title: "Đặt chỗ thành công!",
        message: `Đặt chỗ của bạn đã được xác nhận. Mã đặt chỗ: ${bookingCode}`,
        data: {
          email: user?.email || "",
          userName: user?.full_name || "User",
          bookingId: bookingCode,
          stationName: station.name,
          stationAddress: station.address,
          bookingTime: scheduled_at,
          batteryType: battery_model,
        },
      });
    } catch (error) {
      console.error("Failed to send booking notification:", error);
    }

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  }
);

/**
 * Get booking details
 */
export const getBookingDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const booking = await prisma.booking.findFirst({
      where: {
        booking_id: id,
        user_id: userId,
      },
      include: {
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            operating_hours: true,
          },
        },
        vehicle: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            model: true,
            make: true,
            year: true,
          },
        },
        transaction: {
          select: {
            transaction_id: true,
            transaction_code: true,
            payment_status: true,
            amount: true,
            swap_at: true,
            swap_started_at: true,
            swap_completed_at: true,
            swap_duration_minutes: true,
          },
        },
        checked_in_by_staff: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new CustomError("Booking not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Booking details retrieved successfully",
      data: booking,
    });
  }
);

/**
 * Update booking
 */
export const updateBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { scheduled_at, notes } = req.body;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const booking = await prisma.booking.findFirst({
      where: {
        booking_id: id,
        user_id: userId,
        status: "pending",
      },
    });

    if (!booking) {
      throw new CustomError("Booking not found or cannot be updated", 404);
    }

    const updatedBooking = await prisma.booking.update({
      where: { booking_id: id },
      data: {
        scheduled_at: scheduled_at ? new Date(scheduled_at) : undefined,
        notes,
      },
      include: {
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
        vehicle: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            make: true,
            model: true,
            year: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  }
);

/**
 * Create instant booking (Đổi pin ngay)
 */
export const createInstantBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { vehicle_id, station_id, battery_model, notes } = req.body;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    if (!vehicle_id || !station_id || !battery_model) {
      throw new CustomError(
        "Vehicle ID, station ID, and battery model are required",
        400
      );
    }

    // Validate UUIDs format (basic check)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(vehicle_id)) {
      throw new CustomError("Invalid vehicle ID format", 400);
    }
    if (!uuidRegex.test(station_id)) {
      throw new CustomError("Invalid station ID format", 400);
    }

    // Check if vehicle belongs to user
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        vehicle_id,
        user_id: userId,
      },
    });

    if (!vehicle) {
      throw new CustomError(
        "Vehicle not found or does not belong to user",
        404
      );
    }

    // Check if station exists and is active
    const station = await prisma.station.findUnique({
      where: { station_id },
    });

    if (!station || station.status !== "active") {
      throw new CustomError("Station not found or not active", 404);
    }

    // Check if battery model is compatible (case-insensitive)
    if (
      vehicle.battery_model.toLowerCase().trim() !==
      battery_model.toLowerCase().trim()
    ) {
      throw new CustomError(
        `Battery model "${battery_model}" is not compatible with your vehicle (requires "${vehicle.battery_model}")`,
        400
      );
    }

    // ✅ Instant booking: scheduled_at = now + 15 minutes (reservation window)
    const now = new Date();
    const scheduledTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now

    // Normalize battery_model for comparison (case-insensitive, trim)
    const normalizedBatteryModel = battery_model.toLowerCase().trim();

    // Get all batteries at station and filter by model (case-insensitive)
    const allBatteriesAtStation = await prisma.battery.findMany({
      where: {
        station_id,
      },
      select: {
        model: true,
        status: true,
      },
    });

    // Filter batteries by model (case-insensitive)
    const batteriesOfModel = allBatteriesAtStation.filter(
      (b) => b.model.toLowerCase().trim() === normalizedBatteryModel
    );

    if (batteriesOfModel.length === 0) {
      // Get unique models for error message
      const availableModels = [
        ...new Set(allBatteriesAtStation.map((b) => b.model)),
      ];
      throw new CustomError(
        `No batteries of model "${battery_model}" found at this station. Available models: ${availableModels.join(", ") || "none"}.`,
        400
      );
    }

    // Check if there are available batteries RIGHT NOW (full batteries)
    const fullBatteries = batteriesOfModel.filter(
      (b) => b.status === "full"
    ).length;

    // Also check instant bookings that might reserve batteries
    const allInstantBookingsAtStation = await prisma.booking.findMany({
      where: {
        station_id,
        is_instant: true,
        status: { in: ["pending", "confirmed"] },
        scheduled_at: {
          gte: now,
          lte: new Date(now.getTime() + 15 * 60 * 1000), // Next 15 minutes
        },
      },
      select: {
        battery_model: true,
      },
    });

    // Filter bookings by battery_model (case-insensitive)
    const instantBookingsAtStation = allInstantBookingsAtStation.filter(
      (b) => b.battery_model.toLowerCase().trim() === normalizedBatteryModel
    ).length;

    const availableBatteries = fullBatteries - instantBookingsAtStation;

    if (availableBatteries <= 0) {
      const reason =
        fullBatteries === 0
          ? `No full batteries available (${batteriesOfModel.length} total batteries of this model)`
          : `All ${fullBatteries} full batteries are reserved by other instant bookings (${instantBookingsAtStation} bookings in next 15 min)`;

      throw new CustomError(
        `Không có pin sẵn sàng ngay. ${reason}. Vui lòng đặt lịch hẹn cho thời gian khác.`,
        400
      );
    }

    // Generate booking code (max 20 chars: INST + timestamp last 10 digits + 2 random chars)
    const timestamp = Date.now().toString().slice(-10); // Last 10 digits
    const random = Math.random().toString(36).substr(2, 2).toUpperCase();
    const bookingCode = `INST${timestamp}${random}`; // INST + 10 + 2 = 16 chars

    const booking = await prisma.booking.create({
      data: {
        booking_code: bookingCode,
        user_id: userId,
        vehicle_id,
        station_id,
        battery_model,
        scheduled_at: scheduledTime,
        is_instant: true, // ✅ Flag instant booking
        notes,
        status: "pending",
      },
      include: {
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        vehicle: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            make: true,
            model: true,
            year: true,
          },
        },
      },
    });

    // ✅ Send notification
    try {
      const { notificationService } = await import("../server");
      await notificationService.sendNotification({
        type: "booking_confirmed",
        userId: userId,
        title: "Đặt chỗ đổi pin ngay",
        message: `Bạn đã đặt chỗ đổi pin ngay tại ${station.name}. Pin đã được tạm giữ trong 15 phút.`,
        data: {
          booking_id: booking.booking_id,
          booking_code: bookingCode,
          station_name: station.name,
          is_instant: true,
          reservation_expires_at: scheduledTime,
        },
      });
    } catch (error) {
      console.error("Failed to send instant booking notification:", error);
    }

    res.status(201).json({
      success: true,
      message:
        "Instant booking created successfully. Battery reserved for 15 minutes.",
      data: {
        ...booking,
        reservation_expires_at: scheduledTime,
        message: "Pin đã được tạm giữ. Vui lòng đến trạm trong vòng 15 phút.",
      },
    });
  }
);

/**
 * Cancel booking
 */
export const cancelBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const booking = await prisma.booking.findFirst({
      where: {
        booking_id: id,
        user_id: userId,
        status: { in: ["pending", "confirmed"] },
      },
      include: {
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
        vehicle: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            make: true,
            model: true,
            year: true,
            battery_model: true,
          },
        },
      },
    });

    if (!booking) {
      throw new CustomError("Booking not found or cannot be cancelled", 404);
    }

    // ✅ Chính sách hủy muộn
    const scheduledTime = new Date(booking.scheduled_at);
    const now = new Date();
    const minutesUntilScheduled =
      (scheduledTime.getTime() - now.getTime()) / (1000 * 60);

    const cancellationFee = 0;
    const cancelMessage = "Booking cancelled successfully";

    // Nếu hủy trong vòng 15 phút trước giờ hẹn → Không cho hủy HOẶC phạt phí
    if (minutesUntilScheduled < 15 && minutesUntilScheduled > 0) {
      // Option: Không cho hủy
      throw new CustomError(
        "Cannot cancel booking within 15 minutes of scheduled time. Please contact staff.",
        400
      );
      // Hoặc Option: Phạt phí (uncomment nếu muốn)
      // cancellationFee = 20000; // 20k VND phí hủy muộn
      // cancelMessage = `Booking cancelled with late cancellation fee: ${cancellationFee.toLocaleString("vi-VN")}đ`;
    }

    // Transaction để xử lý phí hủy (nếu có)
    const result = await prisma.$transaction(async (tx) => {
      // Cập nhật booking status
      const updatedBooking = await tx.booking.update({
        where: { booking_id: id },
        data: { status: "cancelled" },
      });

      // Nếu có phí hủy → Trừ ví
      if (cancellationFee > 0) {
        let wallet = await tx.wallet.findUnique({
          where: { user_id: userId },
        });

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: {
              user_id: userId,
              balance: 0,
            },
          });
        }

        const balance = Number(wallet.balance);
        if (balance >= cancellationFee) {
          await tx.wallet.update({
            where: { user_id: userId },
            data: { balance: balance - cancellationFee },
          });
        } else {
          // Không đủ tiền → Ghi nợ hoặc báo lỗi
          throw new CustomError(
            `Insufficient wallet balance. Cancellation fee: ${cancellationFee.toLocaleString("vi-VN")}đ, Balance: ${Number(wallet.balance).toLocaleString("vi-VN")}đ`,
            400
          );
        }
      }

      return { updatedBooking, cancellationFee };
    });

    // ✅ Send notification
    try {
      const { notificationService } = await import("../server");
      await notificationService.sendNotification({
        type: "booking_cancelled",
        userId: userId,
        title: "Đã hủy đặt chỗ",
        message:
          cancellationFee > 0
            ? `Đã hủy đặt chỗ. Phí hủy muộn: ${cancellationFee.toLocaleString("vi-VN")}đ`
            : "Đã hủy đặt chỗ thành công",
        data: {
          booking_id: booking.booking_id,
          booking_code: booking.booking_code,
          cancellation_fee: cancellationFee,
        },
      });
    } catch (error) {
      console.error("Failed to send cancellation notification:", error);
    }

    res.status(200).json({
      success: true,
      message: cancelMessage,
      data: {
        booking: result.updatedBooking,
        cancellation_fee: result.cancellationFee,
        wallet_balance:
          cancellationFee > 0
            ? await prisma.wallet
                .findUnique({
                  where: { user_id: userId },
                  select: { balance: true },
                })
                .then((w) => w?.balance || 0)
            : null,
      },
    });
  }
);
