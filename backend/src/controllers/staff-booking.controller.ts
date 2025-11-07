import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import type { ServicePackage, UserSubscription } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";
import { notificationService } from "../server";
import {
  consumeBookingHold,
  type BookingHoldFields,
  buildBookingUncheckedUpdate,
} from "../services/booking-hold.service";

const prisma = new PrismaClient();

const normalizeBatteryModel = (value: string): string =>
  value.trim().toLowerCase();

const extractPackageModels = (pkg: ServicePackage | null): string[] => {
  if (!pkg || pkg.battery_models === null || pkg.battery_models === undefined) {
    return [];
  }

  const value = pkg.battery_models as unknown;

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : null))
      .filter((item): item is string => Boolean(item));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === "string" ? item : null))
          .filter((item): item is string => Boolean(item));
      }
      if (typeof parsed === "string") {
        return [parsed];
      }
    } catch {
      return [value];
    }
  }

  return [];
};

const getBatteryCapacityByModel = async (
  batteryModel: string
): Promise<number | null> => {
  const battery = await prisma.battery.findFirst({
    where: {
      model: {
        equals: batteryModel,
        mode: "insensitive",
      },
    },
    select: { capacity_kwh: true },
  });

  if (
    !battery ||
    battery.capacity_kwh === null ||
    battery.capacity_kwh === undefined
  ) {
    return null;
  }

  return Number(battery.capacity_kwh);
};

const doesSubscriptionCoverModel = async (
  subscription: UserSubscription & { package: ServicePackage | null },
  batteryModel: string
): Promise<boolean> => {
  const pkg = subscription.package;
  if (!pkg) {
    return false;
  }

  const packageModels = extractPackageModels(pkg);
  const normalizedModel = normalizeBatteryModel(batteryModel);

  if (packageModels.length > 0) {
    return packageModels.some(
      (model) => normalizeBatteryModel(model) === normalizedModel
    );
  }

  const batteryCapacity = await getBatteryCapacityByModel(batteryModel);
  if (batteryCapacity !== null) {
    return batteryCapacity <= pkg.battery_capacity_kwh;
  }

  return true;
};

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
      throw new CustomError(
        "Phone number does not match. Please verify again.",
        400
      );
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

    const hoursUntilScheduled =
      (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    const fullBatteries = await prisma.battery.count({
      where: {
        station_id: booking.station_id,
        model: booking.battery_model,
        status: "full",
      },
    });

    const chargingBatteries =
      hoursUntilScheduled >= 1
        ? await prisma.battery.count({
            where: {
              station_id: booking.station_id,
              model: booking.battery_model,
              status: "charging",
            },
          })
        : 0;

    const totalAvailableBatteries = fullBatteries + chargingBatteries;
    const availableBatteries =
      totalAvailableBatteries - confirmedBookingsAtTime;

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
    const {
      old_battery_code,
      battery_model: batteryModelInput,
      old_battery_status = "good",
      notes,
    } = req.body; // ✅ Cải tiến

    if (!staffId) {
      throw new CustomError("Staff not authenticated", 401);
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
          select: { station_id: true, name: true },
        },
      },
    });

    if (!booking) {
      throw new CustomError("Booking not found", 404);
    }

    // ✅ Cho phép complete booking pending hoặc confirmed
    // Staff có thể complete booking pending nếu user đến sớm (verify SĐT)
    if (booking.status !== "confirmed" && booking.status !== "pending") {
      throw new CustomError(
        "Booking must be pending or confirmed before completion",
        400
      );
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

    const finalBatteryModel =
      typeof batteryModelInput === "string" &&
      batteryModelInput.trim().length > 0
        ? batteryModelInput.trim()
        : booking.battery_model;

    if (!finalBatteryModel) {
      throw new CustomError("Battery model is required", 400);
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { vehicle_id: booking.vehicle_id },
      select: {
        vehicle_id: true,
        license_plate: true,
        battery_model: true,
      },
    });

    if (!vehicle) {
      throw new CustomError("Vehicle not found", 404);
    }

    const bookingHold = booking as unknown as BookingHoldFields;
    const holdInfo: BookingHoldFields = {
      booking_id: booking.booking_id,
      user_id: booking.user_id,
      station_id: booking.station_id,
      locked_battery_id: bookingHold.locked_battery_id,
      locked_battery_previous_status:
        bookingHold.locked_battery_previous_status,
      locked_wallet_amount: bookingHold.locked_wallet_amount,
      locked_wallet_payment_id: bookingHold.locked_wallet_payment_id,
      locked_subscription_id: bookingHold.locked_subscription_id,
      locked_swap_count: bookingHold.locked_swap_count,
      use_subscription: bookingHold.use_subscription,
    };

    type SubscriptionWithPackage = Prisma.UserSubscriptionGetPayload<{
      include: { package: true };
    }>;

    if (!holdInfo.locked_battery_id) {
      throw new CustomError(
        "Booking chưa giữ pin. Vui lòng yêu cầu driver đặt lại để hệ thống giữ pin trước khi hoàn tất.",
        400
      );
    }

    const reservedBattery = await prisma.battery.findUnique({
      where: { battery_id: holdInfo.locked_battery_id },
    });

    if (!reservedBattery) {
      throw new CustomError(
        "Không tìm thấy pin đã giữ cho booking này. Vui lòng kiểm tra lại.",
        404
      );
    }

    if (reservedBattery.station_id !== booking.station_id) {
      throw new CustomError(
        "Pin đã giữ không còn ở trạm này. Vui lòng điều phối lại pin trước khi hoàn tất.",
        400
      );
    }

    const reservedStatus = reservedBattery.status as unknown as string;
    if (reservedStatus !== "reserved" && reservedStatus !== "full") {
      throw new CustomError(
        `Pin đã giữ hiện ở trạng thái ${reservedBattery.status}. Vui lòng kiểm tra lại trước khi hoàn tất.`,
        400
      );
    }

    if (
      reservedBattery.model.toLowerCase().trim() !==
      finalBatteryModel.toLowerCase().trim()
    ) {
      throw new CustomError(
        `Pin đã giữ (${reservedBattery.model}) không khớp với model yêu cầu (${finalBatteryModel}).`,
        400
      );
    }

    let oldBattery = null;
    if (
      typeof old_battery_code === "string" &&
      old_battery_code.trim().length > 0
    ) {
      oldBattery = await prisma.battery.findUnique({
        where: { battery_code: old_battery_code.trim() },
      });

      if (!oldBattery) {
        throw new CustomError(
          `Battery with code "${old_battery_code}" not found`,
          404
        );
      }
    } else {
      const lastTransaction = await prisma.transaction.findFirst({
        where: { user_id: booking.user_id },
        orderBy: { swap_at: "desc" },
        include: {
          new_battery: true,
        },
      });

      if (lastTransaction?.new_battery) {
        oldBattery = lastTransaction.new_battery;
      } else if (lastTransaction?.new_battery_id) {
        oldBattery = await prisma.battery.findUnique({
          where: { battery_id: lastTransaction.new_battery_id },
        });
      }

      if (!oldBattery) {
        throw new CustomError(
          "Unable to determine the current battery in use. Please provide old_battery_code.",
          400
        );
      }
    }

    if (oldBattery.status !== "in_use") {
      throw new CustomError(
        `Old battery status is invalid. Battery ${oldBattery.battery_code} is not in use. User must have a battery in use.`,
        400
      );
    }

    let subscriptionRecord: SubscriptionWithPackage | null = null;

    if (holdInfo.use_subscription) {
      if (!holdInfo.locked_subscription_id) {
        throw new CustomError(
          "Booking này sử dụng gói nhưng không tìm thấy thông tin giữ gói. Vui lòng kiểm tra lại.",
          400
        );
      }

      subscriptionRecord = (await prisma.userSubscription.findUnique({
        where: { subscription_id: holdInfo.locked_subscription_id },
        include: { package: true },
      })) as SubscriptionWithPackage | null;

      if (!subscriptionRecord) {
        throw new CustomError(
          "Không tìm thấy gói đã giữ cho booking này. Vui lòng kiểm tra lại.",
          404
        );
      }

      const covers = await doesSubscriptionCoverModel(
        subscriptionRecord,
        finalBatteryModel
      );

      if (!covers) {
        throw new CustomError(
          `Gói đã giữ không áp dụng cho loại pin "${finalBatteryModel}".`,
          400
        );
      }
    } else {
      if (
        !holdInfo.locked_wallet_payment_id ||
        !holdInfo.locked_wallet_amount
      ) {
        throw new CustomError(
          "Booking chưa giữ tiền ví. Vui lòng yêu cầu driver đặt lại trước khi hoàn tất.",
          400
        );
      }
    }

    // Generate transaction code
    const transactionCode = `TXN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Import notificationService
    const { notificationService } = await import("../server");

    const subscriptionUnlimited = subscriptionRecord?.remaining_swaps === null;
    const subscriptionRemainingAfter =
      subscriptionRecord?.remaining_swaps ?? null;

    let transactionAmountDecimal = holdInfo.use_subscription
      ? new Prisma.Decimal(0)
      : (holdInfo.locked_wallet_amount ?? new Prisma.Decimal(0));

    const transactionAmountNum = Number(transactionAmountDecimal);

    if (!holdInfo.use_subscription && transactionAmountDecimal.equals(0)) {
      throw new CustomError(
        "Không tìm thấy số tiền đã giữ cho booking này. Vui lòng kiểm tra lại.",
        400
      );
    }

    const oldBatteryHistoryAction =
      old_battery_status === "damaged"
        ? "damaged"
        : old_battery_status === "maintenance"
          ? "maintenance"
          : "returned";

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          transaction_code: transactionCode,
          booking_id: id,
          user_id: booking.user_id,
          vehicle_id: booking.vehicle_id,
          station_id: booking.station_id,
          old_battery_id: oldBattery.battery_id,
          new_battery_id: reservedBattery.battery_id,
          staff_id: staffId,
          swap_at: new Date(),
          swap_started_at: new Date(),
          swap_completed_at: new Date(),
          swap_duration_minutes: 0,
          payment_status: "completed",
          amount: transactionAmountDecimal,
          notes,
        },
      });

      const oldBatteryStatusUpdate =
        old_battery_status === "damaged"
          ? "damaged"
          : old_battery_status === "maintenance"
            ? "maintenance"
            : "charging";

      await tx.battery.update({
        where: { battery_id: oldBattery.battery_id },
        data: {
          status: oldBatteryStatusUpdate,
          station_id: booking.station_id,
          last_charged_at:
            oldBatteryStatusUpdate === "charging"
              ? null
              : oldBattery.last_charged_at,
        },
      });

      await tx.battery.update({
        where: { battery_id: reservedBattery.battery_id },
        data: {
          status: "in_use",
        },
      });

      await tx.vehicle.update({
        where: { vehicle_id: vehicle.vehicle_id },
        data: {
          current_battery_id: reservedBattery.battery_id,
          battery_model: finalBatteryModel,
        } as any,
      });

      await (tx as any).batteryHistory.create({
        data: {
          battery_id: oldBattery.battery_id,
          booking_id: booking.booking_id,
          station_id: booking.station_id,
          actor_user_id: staffId,
          action: oldBatteryHistoryAction,
          notes:
            old_battery_status === "good"
              ? "Staff xác nhận pin cũ trả về trạng thái tốt."
              : `Staff đánh dấu pin cũ ở trạng thái ${old_battery_status}.`,
        },
      });

      await (tx as any).batteryHistory.create({
        data: {
          battery_id: reservedBattery.battery_id,
          booking_id: booking.booking_id,
          station_id: booking.station_id,
          actor_user_id: staffId,
          action: "issued",
          notes: `Giao pin model ${reservedBattery.model} cho xe ${
            vehicle.license_plate ?? ""
          }.`,
        },
      });

      const consume = await consumeBookingHold({
        tx,
        booking: holdInfo,
        transactionId: transaction.transaction_id,
        notes: "booking_completed",
      });

      const bookingUpdateData: Prisma.BookingUncheckedUpdateInput = {
        ...buildBookingUncheckedUpdate(consume.bookingUpdate),
        status: "completed",
        battery_model: finalBatteryModel,
      };

      const updatedBooking = await tx.booking.update({
        where: { booking_id: id },
        data: bookingUpdateData,
      });

      const walletAfterRow = holdInfo.use_subscription
        ? null
        : await tx.wallet.findUnique({
            where: { user_id: booking.user_id },
            select: { balance: true },
          });

      return {
        updatedBooking,
        transaction,
        payment: consume.payment,
        transactionAmount: transactionAmountNum,
        walletBalanceAfter: walletAfterRow
          ? Number(walletAfterRow.balance)
          : null,
      };
    });

    // ✅ Send notification về thanh toán / sử dụng gói
    try {
      if (holdInfo.use_subscription && subscriptionRecord) {
        const remainingText = subscriptionUnlimited
          ? "Gói không giới hạn lượt."
          : `Bạn còn ${subscriptionRemainingAfter ?? 0} lượt.`;

        await notificationService.sendNotification({
          type: "payment_success",
          userId: booking.user_id,
          title: "Đổi pin bằng gói đăng ký",
          message: `Đã hoàn tất đổi pin bằng gói "${
            subscriptionRecord.package?.name ?? "Subscription"
          }". ${remainingText}`,
          data: {
            subscription_id: subscriptionRecord.subscription_id,
            remaining_swaps: subscriptionRemainingAfter,
            booking_id: booking.booking_id,
            payment_method: "subscription",
            amount: 0,
          },
        });
      } else if (result.transactionAmount > 0) {
        await notificationService.sendNotification({
          type: "payment_success",
          userId: booking.user_id,
          title: "Thanh toán thành công",
          message:
            `Đã sử dụng ${result.transactionAmount.toLocaleString(
              "vi-VN"
            )}đ đã giữ trước đó để hoàn tất đổi pin.` +
            (result.walletBalanceAfter !== null
              ? ` Số dư hiện tại: ${result.walletBalanceAfter.toLocaleString(
                  "vi-VN"
                )}đ.`
              : ""),
          data: {
            transaction_id: result.transaction.transaction_id,
            amount: result.transactionAmount,
            payment_method: "wallet",
          },
        });
      }
    } catch (error) {
      console.error("Failed to send payment notification:", error);
    }

    const responseMessage =
      holdInfo.use_subscription && subscriptionRecord
        ? subscriptionUnlimited
          ? `Đổi pin hoàn tất bằng gói "${
              subscriptionRecord.package?.name ?? "Subscription"
            }" (không giới hạn lượt).`
          : `Đổi pin hoàn tất bằng gói "${
              subscriptionRecord.package?.name ?? "Subscription"
            }". Bạn còn ${subscriptionRemainingAfter ?? 0} lượt.`
        : result.transactionAmount > 0
          ? `Đổi pin sử dụng số tiền đã giữ ${result.transactionAmount.toLocaleString(
              "vi-VN"
            )}đ. Số dư ví hiện tại: ${
              result.walletBalanceAfter !== null
                ? result.walletBalanceAfter.toLocaleString("vi-VN")
                : "--"
            }đ.`
          : "Đổi pin hoàn tất.";

    res.status(200).json({
      success: true,
      message: "Đổi pin hoàn tất",
      data: {
        transaction: {
          transaction_code: result.transaction.transaction_code,
          amount: result.transactionAmount,
          payment_status: holdInfo.use_subscription
            ? "covered_by_subscription"
            : "completed",
          payment_source: holdInfo.use_subscription ? "subscription" : "wallet",
        },
        payment: result.payment
          ? {
              payment_method: result.payment.payment_method,
              amount: Number(result.payment.amount),
              status: result.payment.payment_status,
            }
          : null,
        subscription_usage:
          holdInfo.use_subscription && subscriptionRecord
            ? {
                subscription_id: subscriptionRecord.subscription_id,
                subscription_name: subscriptionRecord.package?.name ?? null,
                remaining_swaps: subscriptionRemainingAfter,
                unlimited: subscriptionUnlimited,
              }
            : null,
        response_message: responseMessage,
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
      throw new CustomError(
        "Booking not found or does not belong to your station",
        404
      );
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
