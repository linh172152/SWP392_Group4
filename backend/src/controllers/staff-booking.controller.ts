import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import type { service_packages, user_subscriptions } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";
import { notificationService } from "../server";
import {
  consumeBookingHold,
  releaseBookingHold,
  type BookingHoldFields,
  buildBookingUncheckedUpdate,
} from "../services/booking-hold.service";
import { decimalToNumber } from "../utils/decimal.util";

const prisma = new PrismaClient();

type VehicleWithCurrentBattery = Prisma.vehiclesGetPayload<{
  include: {
    batteries: {
      select: {
        battery_id: true;
        battery_code: true;
        status: true;
      };
    };
  };
}>;

const normalizeBatteryModel = (value: string): string =>
  value.trim().toLowerCase();

const extractPackageModels = (pkg: service_packages | null): string[] => {
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
  const battery = await prisma.batteries.findFirst({
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
  subscription: user_subscriptions & {
    service_packages: service_packages | null;
  },
  batteryModel: string
): Promise<boolean> => {
  const pkg = subscription.service_packages;
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

const parseChargePercentage = (value: unknown, fieldLabel: string): number => {
  if (value === undefined || value === null) {
    throw new CustomError(`${fieldLabel} is required`, 400);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new CustomError(`${fieldLabel} must be a number`, 400);
  }

  const normalized = Math.round(parsed);
  if (normalized < 0 || normalized > 100) {
    throw new CustomError(`${fieldLabel} must be between 0 and 100`, 400);
  }

  return normalized;
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
    const staff = await prisma.users.findUnique({
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

    const bookings = await prisma.bookings.findMany({
      where: whereClause,
      include: {
        users_bookings_user_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        vehicles: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            model: true,
            make: true,
            batteries: {
              select: {
                battery_id: true,
                battery_code: true,
                model: true,
                status: true,
                current_charge: true,
              },
            },
          },
        },
        stations: {
          select: {
            station_id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        transactions: {
          select: {
            transaction_id: true,
            transaction_code: true,
            payment_status: true,
            amount: true,
            swap_at: true,
            swap_started_at: true,
            swap_completed_at: true,
            batteries_transactions_old_battery_idTobatteries: {
              select: {
                battery_id: true,
                battery_code: true,
                model: true,
                current_charge: true,
              },
            },
            batteries_transactions_new_battery_idTobatteries: {
              select: {
                battery_id: true,
                battery_code: true,
                model: true,
                current_charge: true,
              },
            },
          },
        },
        users_bookings_checked_in_by_staff_idTousers: {
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

    const total = await prisma.bookings.count({ where: whereClause });

    const mappedBookings = bookings.map((booking: any) => {
      const {
        users_bookings_user_idTousers,
        vehicles,
        transactions,
        stations,
        ...rest
      } = booking;
      const user = users_bookings_user_idTousers || null;
      const vehicle = vehicles
        ? {
            ...vehicles,
            current_battery: (vehicles as any).batteries || null,
          }
        : null;
      // Remove batteries field if it exists
      if (vehicle && (vehicle as any).batteries) {
        delete (vehicle as any).batteries;
      }
      const transaction = transactions
        ? {
            ...transactions,
            amount: Number(transactions.amount),
            old_battery:
              (transactions as any)
                .batteries_transactions_old_battery_idTobatteries || null,
            new_battery:
              (transactions as any)
                .batteries_transactions_new_battery_idTobatteries || null,
          }
        : null;
      // Remove old battery fields if they exist
      if (transaction) {
        if (
          (transaction as any).batteries_transactions_old_battery_idTobatteries
        ) {
          delete (transaction as any)
            .batteries_transactions_old_battery_idTobatteries;
        }
        if (
          (transaction as any).batteries_transactions_new_battery_idTobatteries
        ) {
          delete (transaction as any)
            .batteries_transactions_new_battery_idTobatteries;
        }
      }
      const station = stations
        ? {
            ...stations,
            latitude: stations.latitude ? Number(stations.latitude) : null,
            longitude: stations.longitude ? Number(stations.longitude) : null,
          }
        : null;
      return {
        ...rest,
        user,
        vehicle,
        transaction,
        station,
      };
    });

    res.status(200).json({
      success: true,
      message: "Station bookings retrieved successfully",
      data: {
        bookings: mappedBookings,
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
    const staff = await prisma.users.findUnique({
      where: { user_id: staffId },
      select: { station_id: true },
    });

    if (!staff?.station_id) {
      throw new CustomError("Staff not assigned to any station", 400);
    }

    const booking = await prisma.bookings.findFirst({
      where: {
        booking_id: id,
        station_id: staff.station_id,
      },
      include: {
        users_bookings_user_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        vehicles: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            model: true,
            make: true,
            year: true,
            battery_model: true,
            current_battery_id: true,
            batteries: {
              select: {
                battery_id: true,
                battery_code: true,
                model: true,
                status: true,
                current_charge: true,
              },
            },
          },
        },
        stations: {
          select: {
            station_id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            operating_hours: true,
          },
        },
        transactions: {
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
        users_bookings_checked_in_by_staff_idTousers: {
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

    const {
      users_bookings_user_idTousers,
      vehicles,
      transactions,
      stations,
      ...rest
    } = booking;
    const user = users_bookings_user_idTousers || null;
    const vehicle = vehicles
      ? {
          ...vehicles,
          current_battery: (vehicles as any).batteries || null,
        }
      : null;
    // Remove batteries field if it exists
    if (vehicle && (vehicle as any).batteries) {
      delete (vehicle as any).batteries;
    }
    const mappedTransaction = transactions
      ? {
          ...transactions,
          amount: Number(transactions.amount),
          old_battery:
            (transactions as any)
              .batteries_transactions_old_battery_idTobatteries || null,
          new_battery:
            (transactions as any)
              .batteries_transactions_new_battery_idTobatteries || null,
        }
      : null;
    const station = stations
      ? {
          ...stations,
          latitude: stations.latitude ? Number(stations.latitude) : null,
          longitude: stations.longitude ? Number(stations.longitude) : null,
        }
      : null;
    // Remove old battery fields if they exist
    if (mappedTransaction) {
      if (
        (mappedTransaction as any)
          .batteries_transactions_old_battery_idTobatteries
      ) {
        delete (mappedTransaction as any)
          .batteries_transactions_old_battery_idTobatteries;
      }
      if (
        (mappedTransaction as any)
          .batteries_transactions_new_battery_idTobatteries
      ) {
        delete (mappedTransaction as any)
          .batteries_transactions_new_battery_idTobatteries;
      }
    }
    const mappedBooking = {
      ...rest,
      user,
      vehicle,
      transaction: mappedTransaction,
      station,
    };

    res.status(200).json({
      success: true,
      message: "Booking details retrieved successfully",
      data: mappedBooking,
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

    const booking = await prisma.bookings.findUnique({
      where: { booking_id: id },
      include: {
        stations: {
          select: { station_id: true },
        },
        users_bookings_user_idTousers: {
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
    const staff = await prisma.users.findUnique({
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

    // Check if scheduled time has passed
    // Allow confirmation within 3 hours after scheduled time (for late arrivals)
    const scheduledTime = new Date(booking.scheduled_at);
    const now = new Date();
    const hoursAfterScheduled =
      (now.getTime() - scheduledTime.getTime()) / (1000 * 60 * 60);

    // For instant bookings, allow anytime
    // For scheduled bookings, allow up to 3 hours after scheduled time
    if (!booking.is_instant && hoursAfterScheduled > 3) {
      throw new CustomError(
        `Scheduled time has already passed more than 3 hours. Please contact admin if customer arrived late.`,
        400
      );
    }

    // ✅ Không cần check availability khi confirm
    // - Nếu booking có locked_battery_id: pin đã được lock khi tạo booking
    // - Nếu booking không có locked_battery_id: staff sẽ chọn pin khi complete
    // Việc check availability đã được làm khi tạo booking rồi

    // ✅ Chỉ đổi status, KHÔNG set checked_in_at (sẽ set khi complete)
    const updatedBooking = await prisma.bookings.update({
      where: { booking_id: id },
      data: {
        status: "confirmed",
        // ✅ KHÔNG set checked_in_at và checked_in_by_staff_id ở đây
        // Sẽ set khi completeBooking (khi driver thực sự đến đổi pin)
      },
      include: {
        users_bookings_user_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        vehicles: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            model: true,
          },
        },
        stations: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
        users_bookings_checked_in_by_staff_idTousers: {
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
        message: `Đặt chỗ của bạn tại ${updatedBooking.stations.name} lúc ${new Date(booking.scheduled_at).toLocaleString("vi-VN")} đã được xác nhận. Vui lòng đến trạm.`,
        data: {
          booking_id: booking.booking_id,
          booking_code: booking.booking_code,
          station_name: updatedBooking.stations.name,
          station_address: updatedBooking.stations.address,
          scheduled_at: booking.scheduled_at,
        },
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }

    const mappedBooking = {
      ...updatedBooking,
      user: updatedBooking.users_bookings_user_idTousers || null,
      vehicle: updatedBooking.vehicles
        ? {
            ...updatedBooking.vehicles,
            current_battery: (updatedBooking.vehicles as any).batteries || null,
          }
        : null,
    };

    res.status(200).json({
      success: true,
      message: "Booking confirmed successfully",
      data: {
        booking: mappedBooking,
        message: "Đã xác nhận. User có thể đến đổi pin.",
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
      new_battery_code,
      battery_model: batteryModelInput,
      old_battery_status = "good",
      old_battery_charge,
      new_battery_charge,
      notes,
    } = req.body;

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

    if (
      typeof old_battery_code !== "string" ||
      old_battery_code.trim().length === 0
    ) {
      throw new CustomError(
        "Old battery code is required for verification",
        400
      );
    }

    if (
      typeof new_battery_code !== "string" ||
      new_battery_code.trim().length === 0
    ) {
      throw new CustomError(
        "New battery code is required for verification",
        400
      );
    }

    const oldBatteryChargeValue = parseChargePercentage(
      old_battery_charge,
      "Old battery charge"
    );
    const newBatteryChargeValue = parseChargePercentage(
      new_battery_charge,
      "New battery charge"
    );

    const booking = await prisma.bookings.findUnique({
      where: { booking_id: id },
      include: {
        stations: {
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
    const staff = await prisma.users.findUnique({
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

    const vehicle = (await prisma.vehicles.findUnique({
      where: { vehicle_id: booking.vehicle_id },
      include: {
        batteries: {
          select: {
            battery_id: true,
            battery_code: true,
            status: true,
          },
        },
      },
    })) as VehicleWithCurrentBattery | null;

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

    type SubscriptionWithPackage = Prisma.user_subscriptionsGetPayload<{
      include: { service_packages: true };
    }>;

    // ✅ Pin đã được lock từ lúc driver đặt booking
    // Nếu không có locked_battery_id → có thể là booking cũ (trước khi implement lock) hoặc lỗi hệ thống
    if (!holdInfo.locked_battery_id) {
      throw new CustomError(
        "Lỗi hệ thống: Booking không có pin đã giữ. Vui lòng liên hệ admin để kiểm tra.",
        500
      );
    }

    const reservedBattery = await prisma.batteries.findUnique({
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

    const trimmedNewBatteryCode = new_battery_code.trim();
    if (
      reservedBattery.battery_code.toLowerCase().trim() !==
      trimmedNewBatteryCode.toLowerCase()
    ) {
      throw new CustomError(
        `Mã pin mới "${new_battery_code}" không khớp với pin đã giữ (${reservedBattery.battery_code}). Vui lòng kiểm tra lại.`,
        400
      );
    }

    const trimmedOldBatteryCode = old_battery_code.trim();

    // ✅ Tìm hoặc tạo pin cũ (nếu không tồn tại - trường hợp pin mới từ hãng chưa được tạo trong DB)
    let oldBattery = await prisma.batteries.findUnique({
      where: { battery_code: trimmedOldBatteryCode },
    });

    if (!oldBattery) {
      // Pin cũ không tồn tại → Có thể là pin mới từ hãng chưa được tạo trong DB
      // Kiểm tra xem pin này có phải là pin hiện tại của xe không
      const vehicleCurrentBattery = vehicle.batteries;
      if (vehicleCurrentBattery?.battery_code === trimmedOldBatteryCode) {
        // Pin này đã được link với xe nhưng không tìm thấy trong DB → Lỗi dữ liệu
        throw new CustomError(
          `Pin "${trimmedOldBatteryCode}" đã được link với xe nhưng không tìm thấy trong database. Vui lòng liên hệ quản trị viên.`,
          500
        );
      }

      // Pin không tồn tại và không match với vehicle.current_battery → Tạo pin mới
      // (Trường hợp hiếm: pin từ hãng chưa được tạo khi đăng ký xe)
      console.log(
        `[completeBooking] ⚠️ Old battery "${trimmedOldBatteryCode}" not found. Creating new battery...`
      );

      const defaultStation = await prisma.stations.findFirst({
        where: { status: "active" },
        select: { station_id: true },
      });

      if (!defaultStation) {
        throw new CustomError(
          "Không tìm thấy trạm nào để tạo pin. Vui lòng liên hệ quản trị viên.",
          500
        );
      }

      oldBattery = await prisma.batteries.create({
        data: {
          battery_code: trimmedOldBatteryCode,
          model: vehicle.battery_model,
          status: "in_use", // Pin đang gắn trên xe
          current_charge: oldBatteryChargeValue || 100,
          station_id: defaultStation.station_id, // Sẽ được update về trạm hiện tại sau khi swap
          updated_at: new Date(),
        } as Prisma.batteriesUncheckedCreateInput,
      });

      console.log(
        `[completeBooking] ✅ Created old battery: ${oldBattery.battery_code} (ID: ${oldBattery.battery_id})`
      );

      // Update vehicle với pin mới được tạo
      await prisma.vehicles.update({
        where: { vehicle_id: vehicle.vehicle_id },
        data: { current_battery_id: oldBattery.battery_id },
      });

      // Reload vehicle để có batteries mới
      const updatedVehicle = await prisma.vehicles.findUnique({
        where: { vehicle_id: vehicle.vehicle_id },
        include: {
          batteries: {
            select: {
              battery_id: true,
              battery_code: true,
              status: true,
            },
          },
        },
      });

      if (updatedVehicle) {
        Object.assign(vehicle, updatedVehicle);
      }
    }

    // ✅ Validate: Old battery code must match vehicle's current battery
    const vehicleCurrentBatteryId =
      vehicle.batteries?.battery_id ?? vehicle.current_battery_id;

    if (!vehicleCurrentBatteryId) {
      throw new CustomError(
        "Xe hiện không ghi nhận mã pin đang sử dụng. Vui lòng kiểm tra lại thông tin xe trước khi hoàn tất.",
        400
      );
    }

    if (vehicleCurrentBatteryId !== oldBattery.battery_id) {
      const vehicleCurrentBatteryCode =
        vehicle.batteries?.battery_code || "chưa có";
      throw new CustomError(
        `Mã pin cũ "${old_battery_code}" không khớp với pin hiện tại của xe. Pin hiện tại của xe là: ${vehicleCurrentBatteryCode}.`,
        400
      );
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

      subscriptionRecord = (await prisma.user_subscriptions.findUnique({
        where: { subscription_id: holdInfo.locked_subscription_id },
        include: { service_packages: true },
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
    const transactionCode = `TXN${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Import notificationService
    const { notificationService } = await import("../server");

    const subscriptionUnlimited = subscriptionRecord?.remaining_swaps === null;
    const subscriptionRemainingAfter =
      subscriptionRecord?.remaining_swaps ?? null;

    const transactionAmountDecimal = holdInfo.use_subscription
      ? new Prisma.Decimal(0)
      : (holdInfo.locked_wallet_amount ?? new Prisma.Decimal(0));

    const transactionAmountNum = decimalToNumber(transactionAmountDecimal);

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
      const transaction = await tx.transactions.create({
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
          notes: notes || null,
          created_at: new Date(),
        } as Prisma.transactionsUncheckedCreateInput,
      });

      const oldBatteryStatusUpdate =
        old_battery_status === "damaged"
          ? "damaged"
          : old_battery_status === "maintenance"
            ? "maintenance"
            : "charging";

      const nowTimestamp = new Date();

      await tx.batteries.update({
        where: { battery_id: oldBattery.battery_id },
        data: {
          status: oldBatteryStatusUpdate,
          station_id: booking.station_id,
          current_charge: oldBatteryChargeValue,
          last_charged_at:
            oldBatteryStatusUpdate === "charging"
              ? null
              : oldBattery.last_charged_at,
        },
      });

      if (old_battery_status === "maintenance") {
        await tx.battery_transfer_logs.create({
          data: {
            battery_id: oldBattery.battery_id,
            from_station_id: booking.station_id,
            to_station_id: booking.station_id,
            transfer_reason: "manufacturer_service",
            transferred_by: staffId,
            transfer_status: "in_transit",
            notes: `Pin ${oldBattery.battery_code} gửi về hãng bảo trì sau booking ${booking.booking_code}.`,
            transferred_at: new Date(),
          } as Prisma.battery_transfer_logsUncheckedCreateInput,
        });
      }

      await tx.batteries.update({
        where: { battery_id: reservedBattery.battery_id },
        data: {
          status: "in_use",
          current_charge: newBatteryChargeValue,
          last_charged_at:
            newBatteryChargeValue === 100
              ? nowTimestamp
              : reservedBattery.last_charged_at,
        },
      });

      await tx.vehicles.update({
        where: { vehicle_id: vehicle.vehicle_id },
        data: {
          current_battery_id: reservedBattery.battery_id,
          battery_model: finalBatteryModel,
        },
      });

      await tx.battery_history.create({
        data: {
          battery_id: oldBattery.battery_id,
          booking_id: booking.booking_id,
          station_id: booking.station_id,
          actor_user_id: staffId,
          action: oldBatteryHistoryAction,
          notes:
            old_battery_status === "good"
              ? `Staff xác nhận pin cũ trả về trạng thái tốt ở mức sạc ${oldBatteryChargeValue}%.`
              : `Staff đánh dấu pin cũ ở trạng thái ${old_battery_status} với mức sạc ${oldBatteryChargeValue}%.`,
        },
      });

      await tx.battery_history.create({
        data: {
          battery_id: reservedBattery.battery_id,
          booking_id: booking.booking_id,
          station_id: booking.station_id,
          actor_user_id: staffId,
          action: "issued",
          notes: `Giao pin model ${reservedBattery.model} (mã ${reservedBattery.battery_code}) cho xe ${
            vehicle.license_plate ?? ""
          } với mức sạc ${newBatteryChargeValue}%.`,
        },
      });

      const consume = await consumeBookingHold({
        tx,
        booking: holdInfo,
        transactionId: transaction.transaction_id,
        notes: "booking_completed",
      });

      const bookingUpdateData: Prisma.bookingsUncheckedUpdateInput = {
        ...buildBookingUncheckedUpdate(consume.bookingUpdate),
        status: "completed",
        battery_model: finalBatteryModel,
        // ✅ Set checked_in_at và checked_in_by_staff_id khi complete (driver đã đến)
        checked_in_at: new Date(),
        checked_in_by_staff_id: staffId,
      };

      const updatedBooking = await tx.bookings.update({
        where: { booking_id: id },
        data: bookingUpdateData,
      });

      const walletAfterRow = holdInfo.use_subscription
        ? null
        : await tx.wallets.findUnique({
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
        newBatteryCharge: newBatteryChargeValue,
        oldBatteryCharge: oldBatteryChargeValue,
        newBatteryCode: reservedBattery.battery_code,
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
            subscriptionRecord.service_packages?.name ?? "Subscription"
          }". ${remainingText}`,
          data: {
            subscription_id: subscriptionRecord.subscription_id,
            remaining_swaps: subscriptionRemainingAfter,
            booking_id: booking.booking_id,
            payment_method: "subscription",
            amount: 0,
            battery_code: result.newBatteryCode,
            battery_charge: result.newBatteryCharge,
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
            battery_code: result.newBatteryCode,
            battery_charge: result.newBatteryCharge,
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
              subscriptionRecord.service_packages?.name ?? "Subscription"
            }" (không giới hạn lượt).`
          : `Đổi pin hoàn tất bằng gói "${
              subscriptionRecord.service_packages?.name ?? "Subscription"
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
                subscription_name:
                  subscriptionRecord.service_packages?.name ?? null,
                remaining_swaps: subscriptionRemainingAfter,
                unlimited: subscriptionUnlimited,
              }
            : null,
        battery_handover: {
          new_battery_code: result.newBatteryCode,
          new_battery_charge: result.newBatteryCharge,
          old_battery_code: trimmedOldBatteryCode,
          old_battery_charge: result.oldBatteryCharge,
        },
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
    const staff = await prisma.users.findUnique({
      where: { user_id: staffId },
      select: { station_id: true },
    });

    if (!staff?.station_id) {
      throw new CustomError("Staff not assigned to any station", 400);
    }

    const booking = await prisma.bookings.findFirst({
      where: {
        booking_id: id,
        station_id: staff.station_id,
      },
      include: {
        users_bookings_user_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        vehicles: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            model: true,
          },
        },
        stations: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
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

    const holdInfo = booking as unknown as BookingHoldFields;
    const reasonNote =
      typeof reason === "string" && reason.trim().length > 0
        ? reason.trim()
        : undefined;
    const releaseNote = reasonNote
      ? `Staff cancelled booking: ${reasonNote}`
      : "Staff cancelled booking";

    const result = await prisma.$transaction(async (tx) => {
      const release = await releaseBookingHold({
        tx,
        booking: holdInfo,
        actorUserId: staffId,
        notes: releaseNote,
      });

      const bookingUpdateData: Prisma.bookingsUncheckedUpdateInput = {
        ...buildBookingUncheckedUpdate(release.bookingUpdate),
        status: "cancelled",
        notes: reasonNote
          ? `${booking.notes || ""}\nCancelled by staff: ${reasonNote}`.trim()
          : booking.notes,
      };

      const updatedBooking = await tx.bookings.update({
        where: { booking_id: id },
        data: bookingUpdateData,
        include: {
          users_bookings_user_idTousers: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
            },
          },
          vehicles: {
            select: {
              vehicle_id: true,
              license_plate: true,
              vehicle_type: true,
              model: true,
            },
          },
          stations: {
            select: {
              station_id: true,
              name: true,
              address: true,
            },
          },
        },
      });

      return { updatedBooking, release };
    });

    const responseMessage = reasonNote
      ? `Booking cancelled by staff. Reason: ${reasonNote}`
      : "Booking cancelled by staff.";

    const mappedBooking = {
      ...result.updatedBooking,
      user: result.updatedBooking.users_bookings_user_idTousers || null,
      vehicle: result.updatedBooking.vehicles
        ? {
            ...result.updatedBooking.vehicles,
            current_battery:
              (result.updatedBooking.vehicles as any).batteries || null,
          }
        : null,
    };

    res.status(200).json({
      success: true,
      message: responseMessage,
      data: {
        booking: mappedBooking,
        wallet_refund_amount: result.release.walletRefundAmount,
        battery_released_id: result.release.batteryReleasedId,
      },
    });
  }
);

/**
 * Get available batteries for a booking
 */
export const getAvailableBatteries = asyncHandler(
  async (req: Request, res: Response) => {
    const staffId = req.user?.userId;
    const { id } = req.params;

    if (!staffId) {
      throw new CustomError("Staff not authenticated", 401);
    }

    // Get staff's station
    const staff = await prisma.users.findUnique({
      where: { user_id: staffId },
      select: { station_id: true },
    });

    if (!staff?.station_id) {
      throw new CustomError("Staff not assigned to any station", 400);
    }

    // Get booking details
    const booking = await prisma.bookings.findUnique({
      where: { booking_id: id },
      select: {
        booking_id: true,
        station_id: true,
        battery_model: true,
        locked_battery_id: true,
      },
    });

    if (!booking) {
      throw new CustomError("Booking not found", 404);
    }

    // Check if booking belongs to staff's station
    if (booking.station_id !== staff.station_id) {
      throw new CustomError("Booking does not belong to your station", 403);
    }

    // Build where clause for available batteries
    // Lấy pin: đúng hãng (model), đúng trạm, status "full" hoặc "reserved" (nếu là locked_battery)
    // Cho phép charge >= 90% (không nhất thiết phải 100%)
    const whereClause: any = {
      station_id: booking.station_id,
      model: booking.battery_model,
      status: { in: ["full", "reserved"] }, // Lấy pin sẵn sàng hoặc đã giữ
      current_charge: { gte: 90 }, // Pin phải >= 90% mới đổi được (không nhất thiết 100%)
    };

    // Nếu có locked_battery, cũng include nó (kể cả nếu status khác hoặc charge < 90%)
    if (booking.locked_battery_id) {
      whereClause.OR = [
        {
          station_id: booking.station_id,
          model: booking.battery_model,
          status: { in: ["full", "reserved"] },
          current_charge: { gte: 90 },
        },
        {
          battery_id: booking.locked_battery_id,
        },
      ];
    }

    // Get available batteries
    const batteries = await prisma.batteries.findMany({
      where: whereClause,
      select: {
        battery_id: true,
        battery_code: true,
        model: true,
        status: true,
        current_charge: true,
        capacity_kwh: true,
        health_percentage: true,
      },
    });

    // Sort batteries manually to ensure locked_battery is first
    const sortedBatteries = batteries.sort((a, b) => {
      // Locked battery first
      if (a.battery_id === booking.locked_battery_id) return -1;
      if (b.battery_id === booking.locked_battery_id) return 1;
      // Then full status
      if (a.status === "full" && b.status !== "full") return -1;
      if (b.status === "full" && a.status !== "full") return 1;
      // Then by charge
      return b.current_charge - a.current_charge;
    });

    res.status(200).json({
      success: true,
      message: "Available batteries retrieved successfully",
      data: {
        batteries: sortedBatteries,
        booking: {
          booking_id: booking.booking_id,
          battery_model: booking.battery_model,
          locked_battery_id: booking.locked_battery_id,
        },
      },
    });
  }
);
