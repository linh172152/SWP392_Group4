import { Request, Response } from "express";
import { Prisma, BatteryStatus, PaymentStatus } from "@prisma/client";
import type { ServicePackage, UserSubscription } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";
import { prisma, notificationService } from "../server";
import {
  releaseBookingHold,
  type BookingHoldFields,
  buildBookingUncheckedUpdate,
} from "../services/booking-hold.service";

type PricingCacheMaps = {
  pricing?: Map<string, number | null>;
  capacity?: Map<string, number | null>;
};

type BookingPricingPreview = {
  currency: string;
  base_price: number | null;
  estimated_price: number | null;
  pricing_source: "subscription" | "wallet" | "unavailable";
  has_active_subscription: boolean;
  is_covered_by_subscription: boolean;
  subscription?:
    | {
        subscription_id: string;
        package_id: string;
        package_name: string;
        package_duration_days: number;
        package_battery_capacity_kwh: number;
        package_swap_limit: number | null;
        remaining_swaps: number | null;
        ends_at: Date;
        auto_renew: boolean;
      }
    | undefined;
  message: string;
};

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
  batteryModel: string,
  caches?: PricingCacheMaps
): Promise<number | null> => {
  const normalized = normalizeBatteryModel(batteryModel);
  if (caches?.capacity?.has(normalized)) {
    return caches.capacity.get(normalized) ?? null;
  }

  const battery = await prisma.battery.findFirst({
    where: {
      model: {
        equals: batteryModel,
        mode: "insensitive",
      },
    },
    select: {
      capacity_kwh: true,
    },
  });

  const capacity =
    battery?.capacity_kwh !== null && battery?.capacity_kwh !== undefined
      ? Number(battery.capacity_kwh)
      : null;

  if (caches?.capacity) {
    caches.capacity.set(normalized, capacity);
  }

  return capacity;
};

const getBasePriceByBatteryModel = async (
  batteryModel: string,
  caches?: PricingCacheMaps
): Promise<number | null> => {
  const normalized = normalizeBatteryModel(batteryModel);
  if (caches?.pricing?.has(normalized)) {
    return caches.pricing.get(normalized) ?? null;
  }

  const pricing = await prisma.batteryPricing.findFirst({
    where: {
      battery_model: {
        equals: batteryModel,
        mode: "insensitive",
      },
      is_active: true,
    },
    select: {
      price: true,
    },
  });

  const basePrice = pricing ? Number(pricing.price) : null;

  if (caches?.pricing) {
    caches.pricing.set(normalized, basePrice);
  }

  return basePrice;
};

const getActiveSubscription = async (
  userId: string
): Promise<(UserSubscription & { package: ServicePackage | null }) | null> => {
  const now = new Date();
  return prisma.userSubscription.findFirst({
    where: {
      user_id: userId,
      status: "active",
      start_date: { lte: now },
      end_date: { gte: now },
    },
    include: {
      package: true,
    },
    orderBy: { created_at: "desc" },
  });
};

const doesSubscriptionCoverModel = async (
  subscription: UserSubscription & { package: ServicePackage | null },
  batteryModel: string,
  caches?: PricingCacheMaps
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

  const batteryCapacity = await getBatteryCapacityByModel(batteryModel, caches);
  if (batteryCapacity !== null) {
    return batteryCapacity <= pkg.battery_capacity_kwh;
  }

  // Fallback: assume coverage when we cannot determine capacity but the package doesn't limit models explicitly
  return true;
};

const buildSubscriptionInfo = (
  subscription: (UserSubscription & { package: ServicePackage | null }) | null
) => {
  if (!subscription || !subscription.package) {
    return undefined;
  }

  return {
    subscription_id: subscription.subscription_id,
    package_id: subscription.package_id,
    package_name: subscription.package.name,
    package_duration_days: subscription.package.duration_days,
    package_battery_capacity_kwh: subscription.package.battery_capacity_kwh,
    package_swap_limit: subscription.package.swap_limit,
    remaining_swaps: subscription.remaining_swaps,
    ends_at: subscription.end_date,
    auto_renew: subscription.auto_renew,
  };
};

const calculateBookingPricingPreview = async (
  params: {
    userId: string;
    batteryModel: string;
  },
  caches?: PricingCacheMaps
): Promise<BookingPricingPreview> => {
  const { userId, batteryModel } = params;
  const basePrice = await getBasePriceByBatteryModel(batteryModel, caches);

  const preview: BookingPricingPreview = {
    currency: "VND",
    base_price: basePrice,
    estimated_price: basePrice,
    pricing_source: basePrice !== null ? "wallet" : "unavailable",
    has_active_subscription: false,
    is_covered_by_subscription: false,
    message:
      basePrice !== null
        ? `Giá dự kiến dựa trên bảng giá cho ${batteryModel}.`
        : "Chưa có bảng giá cho loại pin này. Vui lòng kiểm tra với nhân viên.",
  };

  const subscription = await getActiveSubscription(userId);
  if (!subscription) {
    return preview;
  }

  preview.has_active_subscription = true;
  preview.subscription = buildSubscriptionInfo(subscription);

  const coversModel = await doesSubscriptionCoverModel(
    subscription,
    batteryModel,
    caches
  );

  if (!coversModel) {
    preview.message = subscription.package
      ? `Gói "${subscription.package.name}" không áp dụng cho loại pin "${batteryModel}". Áp dụng bảng giá tiêu chuẩn.`
      : "Gói hiện tại không áp dụng cho loại pin này.";
    return preview;
  }

  preview.is_covered_by_subscription = true;

  const hasUnlimitedSwaps = subscription.remaining_swaps === null;
  const hasRemainingSwaps =
    hasUnlimitedSwaps || (subscription.remaining_swaps ?? 0) > 0;

  if (hasRemainingSwaps) {
    preview.estimated_price = 0;
    preview.pricing_source = "subscription";
    preview.message = hasUnlimitedSwaps
      ? `Gói "${subscription.package?.name ?? ""}" bao trọn phí đổi pin cho loại "${batteryModel}".`
      : `Gói "${subscription.package?.name ?? ""}" sẽ trừ 1 lượt đổi. Bạn còn ${
          subscription.remaining_swaps
        } lượt sau giao dịch này.`;
    return preview;
  }

  preview.estimated_price = basePrice;
  preview.pricing_source = basePrice !== null ? "wallet" : "unavailable";
  preview.message =
    basePrice !== null
      ? `Gói "${subscription.package?.name ?? ""}" đã hết lượt đổi miễn phí. Áp dụng bảng giá tiêu chuẩn.`
      : `Gói "${subscription.package?.name ?? ""}" đã hết lượt đổi và hiện chưa có bảng giá. Vui lòng kiểm tra với nhân viên.`;

  return preview;
};

const HOLD_GRACE_MINUTES = 15;
const BOOKING_MIN_LEAD_MINUTES = 30;
const BOOKING_MAX_LEAD_HOURS = 12;
const BATTERY_STATUS_RESERVED = "reserved" as unknown as BatteryStatus;
const PAYMENT_STATUS_RESERVED = "reserved" as unknown as PaymentStatus;

type TxClient = Prisma.TransactionClient;

const reserveBatteryForBooking = async (
  tx: TxClient,
  params: {
    stationId: string;
    batteryModel: string;
    allowChargingFallback: boolean;
  }
) => {
  const { stationId, batteryModel, allowChargingFallback } = params;

  const normalizedModel = batteryModel.trim();

  const pickBattery = async (status: BatteryStatus) =>
    tx.battery.findFirst({
      where: {
        station_id: stationId,
        status: {
          equals: status,
        },
        model: {
          equals: normalizedModel,
          mode: "insensitive",
        },
      },
      orderBy: {
        updated_at: "asc",
      },
    });

  let candidate = await pickBattery(BatteryStatus.full);
  let candidateStatus: BatteryStatus | null = candidate
    ? BatteryStatus.full
    : null;

  if (!candidate && allowChargingFallback) {
    candidate = await pickBattery(BatteryStatus.charging);
    candidateStatus = candidate ? BatteryStatus.charging : null;
  }

  if (!candidate || !candidateStatus) {
    throw new CustomError(
      `Không còn pin phù hợp để giữ chỗ cho model "${batteryModel}" tại trạm này. Vui lòng chọn thời gian khác hoặc trạm khác.`,
      409
    );
  }

  const updateResult = await tx.battery.updateMany({
    where: {
      battery_id: candidate.battery_id,
      status: {
        equals: candidateStatus,
      },
    },
    data: {
      status: BATTERY_STATUS_RESERVED,
      updated_at: new Date(),
    },
  });

  if (updateResult.count === 0) {
    throw new CustomError(
      "Pin vừa được giữ bởi booking khác. Vui lòng thử lại sau vài giây.",
      409
    );
  }

  return {
    battery: candidate,
    previousStatus: candidateStatus,
  };
};

const ensureWalletRecord = async (tx: TxClient, userId: string) => {
  let wallet = await tx.wallet.findUnique({ where: { user_id: userId } });

  if (!wallet) {
    wallet = await tx.wallet.create({
      data: {
        user_id: userId,
        balance: new Prisma.Decimal(0),
      },
    });
  }

  return wallet;
};

const createBatteryHistoryEntry = async (
  tx: TxClient,
  params: {
    batteryId: string;
    bookingId: string;
    stationId: string;
    actorUserId: string;
    action?: string;
    notes?: string;
  }
) => {
  const {
    batteryId,
    bookingId,
    stationId,
    actorUserId,
    action = "reserved",
    notes,
  } = params;

  await (tx as any).batteryHistory.create({
    data: {
      battery_id: batteryId,
      booking_id: bookingId,
      station_id: stationId,
      actor_user_id: actorUserId,
      action,
      notes,
    },
  });
};

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
            current_battery: {
              select: {
                battery_id: true,
                battery_code: true,
                status: true,
                current_charge: true,
              },
            },
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

    const caches: PricingCacheMaps = {
      pricing: new Map(),
      capacity: new Map(),
    };

    const bookingsWithPricing = await Promise.all(
      bookings.map(async (booking) => {
        const pricing_preview = await calculateBookingPricingPreview(
          {
            userId,
            batteryModel: booking.battery_model,
          },
          caches
        );

        return {
          ...booking,
          pricing_preview,
        };
      })
    );

    const total = await prisma.booking.count({ where: whereClause });

    res.status(200).json({
      success: true,
      message: "User bookings retrieved successfully",
      data: {
        bookings: bookingsWithPricing,
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
    const {
      vehicle_id,
      station_id,
      battery_model,
      scheduled_at,
      notes,
      use_subscription: useSubscriptionInput,
    } = req.body;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    if (!vehicle_id || !station_id || !battery_model || !scheduled_at) {
      throw new CustomError(
        "Vehicle ID, station ID, battery model and scheduled time are required",
        400
      );
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(vehicle_id)) {
      throw new CustomError("Invalid vehicle ID format", 400);
    }
    if (!uuidRegex.test(station_id)) {
      throw new CustomError("Invalid station ID format", 400);
    }

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

    const station = await prisma.station.findUnique({
      where: { station_id },
    });

    if (!station || station.status !== "active") {
      throw new CustomError("Station not found or not active", 404);
    }

    if (
      vehicle.battery_model.toLowerCase().trim() !==
      battery_model.toLowerCase().trim()
    ) {
      throw new CustomError(
        `Battery model "${battery_model}" is not compatible with your vehicle (requires "${vehicle.battery_model}")`,
        400
      );
    }

    let scheduledTime: Date;
    try {
      scheduledTime = new Date(scheduled_at);
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

    const minTime = new Date(
      now.getTime() + BOOKING_MIN_LEAD_MINUTES * 60 * 1000
    );
    if (scheduledTime < minTime) {
      throw new CustomError(
        `Scheduled time must be at least ${BOOKING_MIN_LEAD_MINUTES} minutes from now`,
        400
      );
    }

    const maxTime = new Date(
      now.getTime() + BOOKING_MAX_LEAD_HOURS * 60 * 60 * 1000
    );
    if (scheduledTime > maxTime) {
      throw new CustomError(
        `Scheduled time cannot be more than ${BOOKING_MAX_LEAD_HOURS} hours from now`,
        400
      );
    }

    const normalizedBatteryModel = battery_model.trim();
    const useSubscription = useSubscriptionInput !== false;
    const allowChargingFallback =
      (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60) >= 1;

    const timestamp = Date.now().toString().slice(-10);
    const random = Math.random().toString(36).substr(2, 2).toUpperCase();
    const bookingCode = `BK${timestamp}${random}`;
    const holdExpiresAt = new Date(
      scheduledTime.getTime() + HOLD_GRACE_MINUTES * 60 * 1000
    );

    const txResult = await prisma.$transaction(async (tx) => {
      const reserveResult = await reserveBatteryForBooking(tx, {
        stationId: station_id,
        batteryModel: normalizedBatteryModel,
        allowChargingFallback,
      });

      let lockedSubscriptionId: string | null = null;
      let lockedSwapCount = 0;
      let lockedWalletAmount = new Prisma.Decimal(0);
      let lockedWalletPaymentId: string | null = null;
      let walletBalanceAfter: number | null = null;
      let subscriptionRemainingAfter: number | null = null;
      let subscriptionUnlimited = false;
      let subscriptionName: string | null = null;

      const activeSubscription = useSubscription
        ? await tx.userSubscription.findFirst({
            where: {
              user_id: userId,
              status: "active",
              start_date: { lte: now },
              end_date: { gte: now },
            },
            include: { package: true },
            orderBy: { created_at: "desc" },
          })
        : null;

      const pricingRow = await tx.batteryPricing.findFirst({
        where: {
          battery_model: {
            equals: normalizedBatteryModel,
            mode: "insensitive",
          },
          is_active: true,
        },
      });

      const basePriceDecimal = pricingRow?.price ?? null;
      if (!basePriceDecimal && !activeSubscription) {
        throw new CustomError(
          `Hiện chưa có bảng giá cho loại pin "${battery_model}" và bạn không có gói phù hợp. Vui lòng liên hệ nhân viên.`,
          400
        );
      }

      let useSubscriptionFinal = false;

      if (activeSubscription) {
        const coversModel = await doesSubscriptionCoverModel(
          activeSubscription,
          normalizedBatteryModel
        );

        if (coversModel) {
          subscriptionName = activeSubscription.package?.name ?? null;

          if (activeSubscription.remaining_swaps === null) {
            subscriptionUnlimited = true;
            useSubscriptionFinal = true;
            lockedSubscriptionId = activeSubscription.subscription_id;
          } else if ((activeSubscription.remaining_swaps ?? 0) > 0) {
            useSubscriptionFinal = true;
            lockedSubscriptionId = activeSubscription.subscription_id;
            lockedSwapCount = 1;
            subscriptionRemainingAfter =
              (activeSubscription.remaining_swaps ?? 0) - 1;

            await tx.userSubscription.update({
              where: { subscription_id: activeSubscription.subscription_id },
              data: { remaining_swaps: subscriptionRemainingAfter },
            });
          }
        }
      }

      if (!useSubscriptionFinal) {
        if (!basePriceDecimal) {
          throw new CustomError(
            `Không thể xác định giá đổi pin cho model "${battery_model}".`,
            400
          );
        }

        const wallet = await ensureWalletRecord(tx, userId);
        if (wallet.balance.lessThan(basePriceDecimal)) {
          const needed = Number(basePriceDecimal);
          const current = Number(wallet.balance);
          throw new CustomError(
            `Số dư ví không đủ. Cần ${needed.toLocaleString("vi-VN")}đ, hiện có ${current.toLocaleString("vi-VN")}đ. Vui lòng nạp thêm ${(needed - current).toLocaleString("vi-VN")}đ trước khi đặt lịch.`,
            400
          );
        }

        const updatedWallet = await tx.wallet.update({
          where: { user_id: userId },
          data: {
            balance: wallet.balance.minus(basePriceDecimal),
          },
        });

        walletBalanceAfter = Number(updatedWallet.balance);
        lockedWalletAmount = basePriceDecimal;

        const holdPayment = await tx.payment.create({
          data: {
            user_id: userId,
            amount: basePriceDecimal,
            payment_method: "wallet",
            payment_status: PAYMENT_STATUS_RESERVED,
            payment_type: "SWAP",
            metadata: {
              type: "booking_hold",
              booking_code: bookingCode,
              station_id,
            },
          },
        });

        lockedWalletPaymentId = holdPayment.payment_id;
      }

      const bookingData = {
        booking_code: bookingCode,
        user_id: userId,
        vehicle_id,
        station_id,
        battery_model: normalizedBatteryModel,
        scheduled_at: scheduledTime,
        notes: notes ?? null,
        status: "pending",
        locked_battery_id: reserveResult.battery.battery_id,
        locked_battery_previous_status: reserveResult.previousStatus ?? null,
        locked_subscription_id: lockedSubscriptionId ?? null,
        locked_swap_count: lockedSwapCount,
        locked_wallet_amount: lockedWalletAmount,
        locked_wallet_payment_id: lockedWalletPaymentId ?? null,
        use_subscription: useSubscriptionFinal,
        hold_expires_at: holdExpiresAt,
      } as Prisma.BookingUncheckedCreateInput;

      const booking = await tx.booking.create({
        data: bookingData,
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

      await createBatteryHistoryEntry(tx, {
        batteryId: reserveResult.battery.battery_id,
        bookingId: booking.booking_id,
        stationId: station_id,
        actorUserId: userId,
        action: "reserved",
        notes: reserveResult.previousStatus
          ? `Giữ từ trạng thái ${reserveResult.previousStatus}`
          : undefined,
      });

      return {
        booking,
        reserveBattery: reserveResult.battery,
        useSubscriptionFinal,
        subscriptionUnlimited,
        subscriptionRemainingAfter,
        subscriptionName,
        walletBalanceAfter,
        lockedWalletAmount: Number(lockedWalletAmount),
      };
    });

    const pricing_preview = await calculateBookingPricingPreview({
      userId,
      batteryModel: battery_model,
    });

    const holdExpiresAtValue =
      (txResult.booking as any).hold_expires_at ?? null;

    try {
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
        select: { email: true, full_name: true },
      });

      await notificationService.sendNotification({
        type: "booking_confirmed",
        userId: userId,
        title: "Đặt chỗ thành công!",
        message: `Đặt chỗ của bạn đã được giữ pin. Mã đặt chỗ: ${txResult.booking.booking_code}`,
        data: {
          email: user?.email || "",
          userName: user?.full_name || "User",
          bookingId: txResult.booking.booking_code,
          stationName: station.name,
          stationAddress: station.address,
          bookingTime: scheduled_at,
          batteryType: battery_model,
          hold_expires_at: holdExpiresAtValue,
        },
      });
    } catch (error) {
      console.error("Failed to send booking notification:", error);
    }

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: {
        booking: txResult.booking,
        pricing_preview,
        hold_summary: {
          battery_code: txResult.reserveBattery.battery_code,
          use_subscription: txResult.useSubscriptionFinal,
          subscription_unlimited: txResult.subscriptionUnlimited,
          subscription_remaining_after: txResult.subscriptionRemainingAfter,
          subscription_name: txResult.subscriptionName ?? null,
          wallet_amount_locked: txResult.lockedWalletAmount,
          wallet_balance_after: txResult.walletBalanceAfter,
          hold_expires_at: holdExpiresAtValue,
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
            current_battery: {
              select: {
                battery_id: true,
                battery_code: true,
                status: true,
                current_charge: true,
              },
            },
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

    const pricing_preview = await calculateBookingPricingPreview({
      userId,
      batteryModel: booking.battery_model,
    });

    res.status(200).json({
      success: true,
      message: "Booking details retrieved successfully",
      data: {
        ...booking,
        pricing_preview,
      },
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

    const pricing_preview = await calculateBookingPricingPreview({
      userId,
      batteryModel: battery_model,
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
        pricing_preview,
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
    const baseCancelMessage = "Booking cancelled successfully";

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

    const releaseNote = "User cancelled booking before swap";

    const result = await prisma.$transaction(async (tx) => {
      const release = await releaseBookingHold({
        tx,
        booking: booking as unknown as BookingHoldFields,
        actorUserId: userId,
        notes: releaseNote,
      });

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
          throw new CustomError(
            `Insufficient wallet balance. Cancellation fee: ${cancellationFee.toLocaleString("vi-VN")}đ, Balance: ${Number(wallet.balance).toLocaleString("vi-VN")}đ`,
            400
          );
        }
      }

      const bookingUpdateData: Prisma.BookingUncheckedUpdateInput = {
        ...buildBookingUncheckedUpdate(release.bookingUpdate),
        status: "cancelled",
        notes: booking.notes ? `${booking.notes}\n${releaseNote}` : releaseNote,
      };

      const updatedBooking = await tx.booking.update({
        where: { booking_id: id },
        data: bookingUpdateData,
      });

      return {
        updatedBooking,
        cancellationFee,
        walletRefundAmount: release.walletRefundAmount,
        batteryReleasedId: release.batteryReleasedId,
      };
    });

    // ✅ Send notification
    try {
      const { notificationService } = await import("../server");
      const notificationMessage =
        cancellationFee > 0
          ? `Đã hủy đặt chỗ. Phí hủy muộn: ${cancellationFee.toLocaleString("vi-VN")}đ`
          : result.walletRefundAmount > 0
            ? `Đã hủy đặt chỗ. Đã hoàn ${result.walletRefundAmount.toLocaleString("vi-VN")}đ về ví.`
            : "Đã hủy đặt chỗ thành công";
      await notificationService.sendNotification({
        type: "booking_cancelled",
        userId: userId,
        title: "Đã hủy đặt chỗ",
        message: notificationMessage,
        data: {
          booking_id: booking.booking_id,
          booking_code: booking.booking_code,
          cancellation_fee: cancellationFee,
          wallet_refund_amount: result.walletRefundAmount,
        },
      });
    } catch (error) {
      console.error("Failed to send cancellation notification:", error);
    }

    const responseMessage =
      cancellationFee > 0
        ? `Đã hủy đặt chỗ. Phí hủy muộn: ${cancellationFee.toLocaleString("vi-VN")}đ`
        : result.walletRefundAmount > 0
          ? `Đã hủy đặt chỗ. Đã hoàn ${result.walletRefundAmount.toLocaleString("vi-VN")}đ về ví.`
          : baseCancelMessage;

    res.status(200).json({
      success: true,
      message: responseMessage,
      data: {
        booking: result.updatedBooking,
        cancellation_fee: result.cancellationFee,
        wallet_refund_amount: result.walletRefundAmount,
        wallet_balance:
          cancellationFee > 0 || result.walletRefundAmount > 0
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
