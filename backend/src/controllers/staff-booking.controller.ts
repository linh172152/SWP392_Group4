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
    const { phone } = req.body; // ✅ Staff nhập SĐT để verify

    if (!staffId) {
      throw new CustomError("Staff not authenticated", 401);
    }

    if (!phone) {
      throw new CustomError("Phone number is required for verification", 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { booking_id: id },
      include: {
        station: {
          select: { station_id: true },
        },
        user: {
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

    // Check if staff belongs to the station
    const staff = await prisma.user.findUnique({
      where: { user_id: staffId },
      select: { station_id: true },
    });

    if (!staff?.station_id || staff.station_id !== booking.station_id) {
      throw new CustomError(
        "Staff not assigned to this station or booking does not belong to your station",
        403
      );
    }

    if (booking.status !== "pending") {
      throw new CustomError("Booking cannot be confirmed", 400);
    }

    // ✅ Verify SĐT
    if (booking.user.phone !== phone) {
      throw new CustomError("Phone number does not match. Please verify again.", 400);
    }

    // Check if scheduled time has passed (or is_instant = true allows immediate)
    const scheduledTime = new Date(booking.scheduled_at);
    const now = new Date();
    if (!booking.is_instant && scheduledTime < now) {
      throw new CustomError("Scheduled time has already passed", 400);
    }

    // Re-check available batteries at scheduled time before confirming
    const confirmedBookingsAtTime = await prisma.booking.count({
      where: {
        station_id: booking.station_id,
        battery_model: booking.battery_model,
        scheduled_at: {
          gte: new Date(scheduledTime.getTime() - 30 * 60 * 1000),
          lte: new Date(scheduledTime.getTime() + 30 * 60 * 1000),
        },
        status: { in: ["pending", "confirmed"] },
        booking_id: { not: id },
      },
    });

    const hoursUntilScheduled = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    const fullBatteries = await prisma.battery.count({
      where: {
        station_id: booking.station_id,
        model: booking.battery_model,
        status: "full",
      },
    });

    const chargingBatteries = hoursUntilScheduled >= 1 ? await prisma.battery.count({
      where: {
        station_id: booking.station_id,
        model: booking.battery_model,
        status: "charging",
      },
    }) : 0;

    const totalAvailableBatteries = fullBatteries + chargingBatteries;
    const availableBatteries = totalAvailableBatteries - confirmedBookingsAtTime;

    if (availableBatteries <= 0) {
      throw new CustomError(
        `No batteries available at scheduled time. Please ask user to reschedule.`,
        400
      );
    }

    // ✅ Không tạo PIN code nữa
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: id },
      data: {
        status: "confirmed",
        checked_in_at: new Date(),
        checked_in_by_staff_id: staffId,
        // ✅ KHÔNG tạo pin_code
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

    // ✅ Send notification (In-App, không gửi email/SMS)
    try {
      await notificationService.sendNotification({
        type: "booking_confirmed",
        userId: booking.user_id,
        title: "Đặt chỗ đã được xác nhận",
        message: `Đặt chỗ của bạn tại ${updatedBooking.station.name} lúc ${new Date(booking.scheduled_at).toLocaleString("vi-VN")} đã được xác nhận. Vui lòng đến trạm.`,
        data: {
          booking_id: booking.booking_id,
          booking_code: booking.booking_code,
          station_name: updatedBooking.station.name,
          station_address: updatedBooking.station.address,
          scheduled_at: booking.scheduled_at,
        },
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }

    res.status(200).json({
      success: true,
      message: "Booking confirmed successfully",
      data: {
        booking: updatedBooking,
        message: "Đã xác nhận. User có thể đến đổi pin.",
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
    const { old_battery_code, battery_model, old_battery_status = "good", notes } = req.body; // ✅ Cải tiến

    if (!staffId) {
      throw new CustomError("Staff not authenticated", 401);
    }

    if (!old_battery_code || !battery_model) {
      throw new CustomError(
        "Old battery code and battery model are required",
        400
      );
    }

    // ✅ Validate old_battery_status
    if (!["good", "damaged", "maintenance"].includes(old_battery_status)) {
      throw new CustomError(
        "Old battery status must be: good, damaged, or maintenance",
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

    // ✅ Cho phép complete booking pending hoặc confirmed
    // Staff có thể complete booking pending nếu user đến sớm (verify SĐT)
    if (booking.status !== "confirmed" && booking.status !== "pending") {
      throw new CustomError("Booking must be pending or confirmed before completion", 400);
    }

    // ✅ Bỏ check PIN - không cần PIN nữa (đã verify SĐT khi confirm)

    // Check if staff belongs to the station
    const staff = await prisma.user.findUnique({
      where: { user_id: staffId },
      select: { station_id: true },
    });

    if (!staff?.station_id || staff.station_id !== booking.station_id) {
      throw new CustomError(
        "Staff not assigned to this station or booking does not belong to your station",
        403
      );
    }

    // ✅ Tìm old battery từ battery_code (thay vì battery_id)
    const oldBattery = await prisma.battery.findUnique({
      where: { battery_code: old_battery_code },
    });

    if (!oldBattery) {
      throw new CustomError(`Battery with code "${old_battery_code}" not found`, 404);
    }

    // Check if old battery is in use (user's current battery)
    if (oldBattery.status !== "in_use") {
      throw new CustomError(
        `Old battery status is invalid. Battery ${old_battery_code} is not in use. User must have a battery in use.`,
        400
      );
    }

    // ✅ Tự động assign new battery từ battery_model (thay vì new_battery_id)
    const newBattery = await prisma.battery.findFirst({
      where: {
        station_id: booking.station_id,
        model: battery_model,
        status: "full",
      },
      orderBy: { last_charged_at: "asc" }, // Pin cũ nhất sạc trước
    });

    if (!newBattery) {
      throw new CustomError(
        `Không có pin sẵn sàng cho loại "${battery_model}" tại trạm này`,
        400
      );
    }

    // Generate transaction code
    const transactionCode = `TXN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Import notificationService
    const { notificationService } = await import("../server");

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { booking_id: id },
        data: { status: "completed" },
      });

      // ✅ Tính giá từ BatteryPricing (case-insensitive matching)
      // BatteryPricing có unique constraint trên battery_model, nhưng để an toàn ta query tất cả và filter
      const allPricing = await tx.batteryPricing.findMany({
        where: { is_active: true },
      });
      
      const pricing = allPricing.find(
        (p) => p.battery_model.toLowerCase().trim() === booking.battery_model.toLowerCase().trim()
      );

      if (!pricing) {
        throw new CustomError(
          `Pricing not found or inactive for battery model "${booking.battery_model}"`,
          400
        );
      }

      const transactionAmount = pricing.price;

      // ✅ Check Wallet balance
      let wallet = await tx.wallet.findUnique({
        where: { user_id: booking.user_id },
      });

      // If wallet doesn't exist, create it with 0 balance
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            user_id: booking.user_id,
            balance: 0,
          },
        });
      }

      const walletBalance = Number(wallet.balance);
      const transactionAmountNum = Number(transactionAmount);

      // ✅ Thanh toán tự động - CHỈ dùng Wallet
      if (walletBalance < transactionAmountNum) {
        // KHÔNG đủ tiền → KHÔNG cho complete booking
        // User phải nạp thêm tiền vào ví trước
        throw new CustomError(
          `Số dư ví không đủ. Cần ${transactionAmountNum.toLocaleString("vi-VN")}đ, hiện có ${walletBalance.toLocaleString("vi-VN")}đ. Vui lòng nạp thêm ${(transactionAmountNum - walletBalance).toLocaleString("vi-VN")}đ vào ví trước khi hoàn tất đổi pin.`,
          400
        );
      }

      // Đủ tiền → Tự động trừ ví
      await tx.wallet.update({
        where: { user_id: booking.user_id },
        data: { balance: walletBalance - transactionAmountNum },
      });

      const paymentStatus: "completed" = "completed";
      const paymentMethod: "wallet" = "wallet";

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          transaction_code: transactionCode,
          booking_id: id,
          user_id: booking.user_id,
          vehicle_id: booking.vehicle_id,
          station_id: booking.station_id,
          old_battery_id: oldBattery.battery_id,
          new_battery_id: newBattery.battery_id,
          staff_id: staffId,
          swap_at: new Date(),
          swap_started_at: new Date(),
          swap_completed_at: new Date(),
          swap_duration_minutes: 0,
          payment_status: paymentStatus,
          amount: transactionAmount,
          notes,
        },
      });

      // ✅ Xử lý pin hỏng (Old battery status)
      if (old_battery_status === "damaged" || old_battery_status === "maintenance") {
        // Pin hỏng → KHÔNG sạc!
        await tx.battery.update({
          where: { battery_id: oldBattery.battery_id },
          data: {
            status: old_battery_status, // "maintenance" hoặc "damaged"
            station_id: booking.station_id,
            // KHÔNG set last_charged_at
          },
        });
      } else {
        // Pin tốt → Sạc bình thường
        await tx.battery.update({
          where: { battery_id: oldBattery.battery_id },
          data: {
            status: "charging",
            station_id: booking.station_id,
            current_charge: oldBattery.current_charge || 0,
            last_charged_at: null,
          },
        });
      }

      // Update new battery status
      await tx.battery.update({
        where: { battery_id: newBattery.battery_id },
        data: {
          status: "in_use", // User đang dùng
        },
      });

      // ✅ Create Payment record (nếu đã thanh toán)
      let payment = null;
      if (paymentStatus === "completed" && paymentMethod === "wallet") {
        payment = await tx.payment.create({
          data: {
            transaction_id: transaction.transaction_id,
            user_id: booking.user_id,
            amount: transactionAmount,
            payment_method: "wallet",
            payment_status: "completed",
            paid_at: new Date(),
          },
        });
      }

      return { 
        updatedBooking, 
        transaction, 
        payment, 
        paymentStatus, 
        walletBalance, 
        transactionAmount: transactionAmountNum 
      };
    });

    // ✅ Send notification về thanh toán
    try {
      if (result.paymentStatus === "completed") {
        await notificationService.sendNotification({
          type: "payment_success",
          userId: booking.user_id,
          title: "Thanh toán thành công",
          message: `Đã thanh toán ${Number(result.transactionAmount).toLocaleString("vi-VN")}đ từ ví. Số dư còn lại: ${Number(result.walletBalance).toLocaleString("vi-VN")}đ.`,
          data: {
            transaction_id: result.transaction.transaction_id,
            amount: Number(result.transactionAmount),
            payment_method: "wallet",
          },
        });
      } else {
        // Thiếu tiền - notification sẽ được gửi sau khi staff xử lý payment
      }
    } catch (error) {
      console.error("Failed to send payment notification:", error);
    }

    res.status(200).json({
      success: true,
      message: "Đổi pin hoàn tất",
      data: {
        transaction: {
          transaction_code: result.transaction.transaction_code,
          amount: Number(result.transactionAmount),
          payment_status: result.paymentStatus,
        },
        payment: {
          payment_method: "wallet",
          amount: Number(result.transactionAmount),
          status: "completed",
        },
        wallet_balance: Number(result.walletBalance),
        message: `Đã thanh toán ${Number(result.transactionAmount).toLocaleString("vi-VN")}đ từ ví. Số dư còn lại: ${Number(result.walletBalance).toLocaleString("vi-VN")}đ.`,
      },
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

    // Check if staff belongs to a station
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
    });

    if (!booking) {
      throw new CustomError("Booking not found or does not belong to your station", 404);
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
