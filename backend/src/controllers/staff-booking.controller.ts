import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";
import { notificationService } from "../server";

const prisma = new PrismaClient();

/**
 * Get station bookings
 */
export const getStationBookings = asyncHandler(
  async (req: Request, res: Response) => {
    const staffId = req.user?.userId;
    const { status, page = 1, limit = 10 } = req.query;

    if (!staffId) {
      throw new CustomError("Staff not authenticated", 401);
    }

    // Get staff's station
    const staff = await prisma.user.findUnique({
      where: { user_id: staffId },
      select: { station_id: true },
    });

    if (!staff?.station_id) {
      throw new CustomError("Staff not assigned to any station", 400);
    }

    const whereClause: any = { station_id: staff.station_id };
    if (status) {
      whereClause.status = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            model: true,
            make: true,
          },
        },
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
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
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit as string),
    });

    const total = await prisma.booking.count({ where: whereClause });

    res.status(200).json({
      success: true,
      message: "Station bookings retrieved successfully",
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
 * Get booking details
 */
export const getBookingDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const staffId = req.user?.userId;
    const { id } = req.params;

    if (!staffId) {
      throw new CustomError("Staff not authenticated", 401);
    }

    // Get staff's station
    const staff = await prisma.user.findUnique({
      where: { user_id: staffId },
      select: { station_id: true },
    });

    if (!staff?.station_id) {
      throw new CustomError("Staff not assigned to any station", 400);
    }

    const booking = await prisma.booking.findFirst({
      where: {
        booking_id: id,
        station_id: staff.station_id,
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
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
            battery_model: true,
          },
        },
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
            notes: true,
          },
        },
        checked_in_by_staff: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
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
 * Confirm booking
 */
export const confirmBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const staffId = req.user?.userId;
    const { id } = req.params;

    if (!staffId) {
      throw new CustomError("Staff not authenticated", 401);
    }

    const booking = await prisma.booking.findUnique({
      where: { booking_id: id },
      include: {
        station: {
          select: { station_id: true },
        },
      },
    });

    if (!booking) {
      throw new CustomError("Booking not found", 404);
    }

    if (booking.status !== "pending") {
      throw new CustomError("Booking cannot be confirmed", 400);
    }

    // Generate PIN code for user
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();

    const updatedBooking = await prisma.booking.update({
      where: { booking_id: id },
      data: {
        status: "confirmed",
        checked_in_at: new Date(),
        checked_in_by_staff_id: staffId,
        pin_code: pinCode,
      } as any,
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            model: true,
          },
        },
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
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

    // Send PIN code notification to user
    try {
      await notificationService.sendNotification({
        type: "pin_code",
        userId: booking.user_id,
        title: "Mã PIN xác nhận",
        message: `Mã PIN của bạn: ${pinCode}. Vui lòng sử dụng mã này khi đến trạm.`,
        data: {
          email: (updatedBooking as any).user.email,
          userName: (updatedBooking as any).user.full_name,
          bookingId: booking.booking_code,
          stationName: (updatedBooking as any).station.name,
          stationAddress: (updatedBooking as any).station.address,
          bookingTime: booking.scheduled_at,
          pinCode: pinCode,
        },
      });
    } catch (error) {
      console.error("Failed to send PIN code notification:", error);
    }

    res.status(200).json({
      success: true,
      message: "Booking confirmed successfully",
      data: {
        ...updatedBooking,
        pin_code: pinCode,
      },
    });
  }
);

/**
 * Verify PIN code for booking
 */
export const verifyPinCode = asyncHandler(
  async (req: Request, res: Response) => {
    const staffId = req.user?.userId;
    const { id } = req.params;
    const { pin_code } = req.body;

    if (!staffId) {
      throw new CustomError("Staff not authenticated", 401);
    }

    if (!pin_code) {
      throw new CustomError("PIN code is required", 400);
    }

    // Get staff's station
    const staff = await prisma.user.findUnique({
      where: { user_id: staffId },
      select: { station_id: true },
    });

    if (!staff?.station_id) {
      throw new CustomError("Staff not assigned to any station", 400);
    }

    const booking = await prisma.booking.findFirst({
      where: {
        booking_id: id,
        station_id: staff.station_id,
        status: "confirmed",
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            model: true,
          },
        },
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    if (!booking) {
      throw new CustomError("Booking not found or not confirmed", 404);
    }

    // Verify PIN code
    if ((booking as any).pin_code !== pin_code) {
      throw new CustomError("Invalid PIN code", 400);
    }

    // Check if PIN has already been verified
    if ((booking as any).pin_verified_at) {
      throw new CustomError("PIN code has already been verified", 400);
    }

    // Update booking with PIN verification
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: id },
      data: {
        pin_verified_at: new Date(),
      } as any,
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            model: true,
          },
        },
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "PIN code verified successfully",
      data: {
        booking: updatedBooking,
      },
    });
  }
);

/**
 * Complete booking
 */
export const completeBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const staffId = req.user?.userId;
    const { id } = req.params;
    const { old_battery_id, new_battery_id, notes } = req.body;

    if (!staffId) {
      throw new CustomError("Staff not authenticated", 401);
    }

    if (!old_battery_id || !new_battery_id) {
      throw new CustomError(
        "Old battery ID and new battery ID are required",
        400
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { booking_id: id },
      include: {
        station: {
          select: { station_id: true },
        },
      },
    }) as any;

    if (!booking) {
      throw new CustomError("Booking not found", 404);
    }

    if (booking.status !== "confirmed") {
      throw new CustomError("Booking must be confirmed before completion", 400);
    }

    // Check if PIN has been verified
    if (!booking.pin_verified_at) {
      throw new CustomError(
        "PIN code must be verified before completing booking",
        400
      );
    }

    // Check if batteries exist and are available
    const oldBattery = await prisma.battery.findUnique({
      where: { battery_id: old_battery_id },
    });

    const newBattery = await prisma.battery.findUnique({
      where: { battery_id: new_battery_id },
    });

    if (!oldBattery || !newBattery) {
      throw new CustomError("One or both batteries not found", 404);
    }

    if (newBattery.status !== "full") {
      throw new CustomError("New battery is not available", 400);
    }

    // Generate transaction code
    const transactionCode = `TXN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { booking_id: id },
        data: { status: "completed" },
      });

      // Check if user has active subscription (not expired)
      const activeSubscription = await tx.userSubscription.findFirst({
        where: {
          user_id: booking.user_id,
          status: "active",
          end_date: { gte: new Date() },
          remaining_swaps: { gt: 0 },
        },
      });

      let transactionAmount = 0;
      let paymentStatus: "pending" | "completed" = "pending";

      if (activeSubscription && activeSubscription.remaining_swaps && activeSubscription.remaining_swaps > 0) {
        // User has subscription - free swap
        transactionAmount = 0;
        paymentStatus = "completed";
        
        // Update remaining swaps
        await tx.userSubscription.update({
          where: { subscription_id: activeSubscription.subscription_id },
          data: { remaining_swaps: (activeSubscription.remaining_swaps || 0) - 1 },
        });
      } else {
        // No subscription - calculate payment amount
        // TODO: Implement pricing logic based on battery model, station, etc.
        transactionAmount = 50000; // Default 50k VND
        paymentStatus = "pending";
      }

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          transaction_code: transactionCode,
          booking_id: id,
          user_id: booking.user_id,
          vehicle_id: booking.vehicle_id,
          station_id: booking.station_id,
          old_battery_id,
          new_battery_id,
          staff_id: staffId,
          swap_at: new Date(),
          swap_started_at: new Date(),
          swap_completed_at: new Date(),
          swap_duration_minutes: 0, // Will be calculated by frontend
          payment_status: paymentStatus,
          amount: transactionAmount,
          notes,
        },
      });

      // Update battery statuses
      await tx.battery.update({
        where: { battery_id: old_battery_id },
        data: { status: "in_use" },
      });

      await tx.battery.update({
        where: { battery_id: new_battery_id },
        data: { status: "in_use" },
      });

      return { updatedBooking, transaction };
    });

    res.status(200).json({
      success: true,
      message: "Booking completed successfully",
      data: result,
    });
  }
);

/**
 * Cancel booking
 */
export const cancelBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const staffId = req.user?.userId;
    const { id } = req.params;
    const { reason } = req.body;

    if (!staffId) {
      throw new CustomError("Staff not authenticated", 401);
    }

    const booking = await prisma.booking.findUnique({
      where: { booking_id: id },
    });

    if (!booking) {
      throw new CustomError("Booking not found", 404);
    }

    if (booking.status === "completed") {
      throw new CustomError("Cannot cancel completed booking", 400);
    }

    if (booking.status === "cancelled") {
      throw new CustomError("Booking is already cancelled", 400);
    }

    const updatedBooking = await prisma.booking.update({
      where: { booking_id: id },
      data: {
        status: "cancelled",
        notes: reason
          ? `${booking.notes || ""}\nCancelled by staff: ${reason}`.trim()
          : booking.notes,
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            model: true,
          },
        },
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: updatedBooking,
    });
  }
);
