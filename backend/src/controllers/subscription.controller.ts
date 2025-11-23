import { Request, Response } from "express";
import { prisma } from "../server";
import { PaymentStatus, PaymentType, Prisma } from "@prisma/client";
import { asyncHandler, CustomError } from "../middlewares/error.middleware";

const PAYMENT_STATUS_REFUNDED = "refunded" as unknown as PaymentStatus;
const PAYMENT_STATUS_COMPLETED = "completed" as unknown as PaymentStatus;

export const getMySubscriptions = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new CustomError("Driver not authenticated", 401);
    }

    const subscriptions = await prisma.user_subscriptions.findMany({
      where: { user_id: userId },
      include: {
        service_packages: {
          select: {
            package_id: true,
            name: true,
            description: true,
            price: true,
            swap_limit: true,
            duration_days: true,
            battery_capacity_kwh: true,
            is_active: true,
          },
        },
        payments: {
          where: {
            payment_type: PaymentType.SUBSCRIPTION,
          },
          orderBy: { created_at: "desc" },
          take: 1,
          select: {
            amount: true,
            payment_status: true,
            payment_type: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const mappedSubscriptions = subscriptions.map((sub: any) => {
      const { service_packages, ...rest } = sub;
      return {
        ...rest,
        package: service_packages || null,
      };
    });

    res.status(200).json({
      success: true,
      message: "Driver subscriptions retrieved successfully",
      data: mappedSubscriptions,
    });
  }
);

export const subscribeToPackage = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { packageId } = req.params;
    const { autoRenew = false } = req.body;

    if (!userId) {
      throw new CustomError("Driver not authenticated", 401);
    }

    if (!packageId) {
      throw new CustomError("packageId is required", 400);
    }

    const servicePackage = await prisma.service_packages.findUnique({
      where: { package_id: packageId },
    });

    if (!servicePackage || !servicePackage.is_active) {
      throw new CustomError("Package not found or inactive", 404);
    }

    const now = new Date();

    const existingActive = await prisma.user_subscriptions.findFirst({
      where: {
        user_id: userId,
        package_id: packageId,
        status: "active",
        end_date: { gte: now },
      },
    });

    if (existingActive) {
      throw new CustomError(
        "You already have an active subscription for this package",
        400
      );
    }

    const wallet = await prisma.wallets.findUnique({
      where: { user_id: userId },
    });

    if (!wallet || wallet.balance.lessThan(servicePackage.price)) {
      throw new CustomError(
        "Insufficient wallet balance. Please top-up before subscribing",
        400
      );
    }

    const durationDays = servicePackage.duration_days;
    const endDate = new Date(now.getTime());
    endDate.setDate(endDate.getDate() + durationDays);

    const subscription = await prisma.$transaction(async (tx) => {
      const createdSubscription = await tx.user_subscriptions.create({
        data: {
          user_id: userId,
          package_id: packageId,
          start_date: now,
          end_date: endDate,
          remaining_swaps: servicePackage.swap_limit ?? null,
          auto_renew: Boolean(autoRenew),
          updated_at: new Date(),
        } as Prisma.user_subscriptionsUncheckedCreateInput,
        include: { service_packages: true },
      });

      await tx.wallets.update({
        where: { user_id: userId },
        data: {
          balance: wallet.balance.minus(servicePackage.price),
          updated_at: new Date(),
        },
      });

      await tx.payments.create({
        data: {
          subscription_id: createdSubscription.subscription_id,
          user_id: userId,
          amount: servicePackage.price,
          payment_method: "wallet",
          payment_status: "completed",
          paid_at: now,
          payment_type: PaymentType.SUBSCRIPTION,
          metadata: {
            package_name: servicePackage.name,
            duration_days: servicePackage.duration_days,
          } as Prisma.InputJsonValue,
        } as Prisma.paymentsUncheckedCreateInput,
      });

      return createdSubscription;
    });

    const { service_packages, ...rest } = subscription;
    const mappedSubscription = {
      ...rest,
      package: service_packages || null,
    };

    res.status(201).json({
      success: true,
      message: "Subscription purchased successfully",
      data: mappedSubscription,
    });
  }
);

export const cancelSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { subscriptionId } = req.params;
    const { reason } = req.body ?? {};

    if (!userId) {
      throw new CustomError("Driver not authenticated", 401);
    }

    if (!subscriptionId) {
      throw new CustomError("subscriptionId is required", 400);
    }

    const subscription = await prisma.user_subscriptions.findUnique({
      where: { subscription_id: subscriptionId },
      include: {
        service_packages: true,
      },
    });

    if (!subscription || subscription.user_id !== userId) {
      throw new CustomError("Subscription not found", 404);
    }

    if (subscription.status !== "active") {
      throw new CustomError("Only active subscriptions can be cancelled", 400);
    }

    if (!subscription.service_packages) {
      throw new CustomError("Subscription package information not found", 500);
    }

    // ✅ Check: Không cho hủy nếu gói đã hết hạn
    const now = new Date();
    if (subscription.end_date < now) {
      throw new CustomError(
        "Subscription has already expired and cannot be cancelled",
        400
      );
    }

    const packageSwapLimit = subscription.service_packages.swap_limit;

    // ✅ Lấy original amount từ payment (không phải package price)
    const originalPayment = await prisma.payments.findFirst({
      where: {
        subscription_id: subscriptionId,
        payment_type: PaymentType.SUBSCRIPTION,
        payment_status: PAYMENT_STATUS_COMPLETED,
      },
      orderBy: { created_at: "desc" },
    });

    if (!originalPayment) {
      throw new CustomError(
        "Original subscription payment not found. Contact support for assistance",
        400
      );
    }

    const originalAmount = Number(originalPayment.amount);

    // ✅ Tính refund theo tỷ lệ (bỏ check hasUsage)
    let refundRatio = 0;

    if (packageSwapLimit === null) {
      // Gói không giới hạn: tính theo số ngày còn lại
      const startDate = new Date(subscription.start_date);
      const endDate = new Date(subscription.end_date);
      const totalDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysRemaining = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      refundRatio =
        daysRemaining > 0 && totalDays > 0 ? daysRemaining / totalDays : 0;
    } else {
      // Gói có giới hạn: tính theo số lượt còn lại
      const remainingSwaps = subscription.remaining_swaps ?? 0;
      refundRatio =
        packageSwapLimit > 0
          ? Math.min(remainingSwaps / packageSwapLimit, 1.0)
          : 0;
    }

    // ✅ Áp dụng phí hủy 3%
    let refundAmount = originalAmount * refundRatio * 0.97;

    // ✅ Làm tròn xuống
    refundAmount = Math.floor(refundAmount);

    // ✅ Minimum refund: 10,000 VND
    refundAmount = Math.max(refundAmount, 10000);

    // ✅ Kiểm tra refund amount hợp lệ
    if (refundAmount <= 0 || refundAmount > originalAmount) {
      throw new CustomError(
        `Invalid refund amount calculated: ${refundAmount} (original: ${originalAmount}, ratio: ${refundRatio}). Please contact support.`,
        500
      );
    }

    const lockedStatusEnumList = ["pending", "confirmed"].map(
      (status) => Prisma.sql`${status}::"BookingStatus"`
    );

    const lockedBookingRows = await prisma.$queryRaw<
      { booking_id: string; booking_code: string }[]
    >(
      Prisma.sql`
        SELECT booking_id, booking_code
        FROM bookings
        WHERE user_id = CAST(${userId} AS uuid)
          AND status IN (${Prisma.join(lockedStatusEnumList)} )
          AND locked_subscription_id = CAST(${subscriptionId} AS uuid)
        LIMIT 1
      `
    );

    const lockedBooking = lockedBookingRows[0];

    if (lockedBooking) {
      throw new CustomError(
        `Subscription is currently reserved for booking ${lockedBooking.booking_code}. Please cancel that booking first.`,
        400
      );
    }

    // originalPayment đã được lấy ở trên
    if (originalPayment.payment_status === PAYMENT_STATUS_REFUNDED) {
      throw new CustomError("Subscription has already been refunded", 400);
    }

    // refundAmount đã được tính ở trên (theo tỷ lệ, phí hủy 3%, minimum 10k)
    const refundAmountDecimal = new Prisma.Decimal(refundAmount);

    if (refundAmountDecimal.lte(0)) {
      throw new CustomError("Invalid refund amount", 500);
    }

    const result = await prisma.$transaction(async (tx) => {
      let wallet = await tx.wallets.findUnique({ where: { user_id: userId } });

      if (!wallet) {
        wallet = await tx.wallets.create({
          data: {
            user_id: userId,
            balance: new Prisma.Decimal(0),
          },
        });
      }

      const updatedWallet = await tx.wallets.update({
        where: { user_id: userId },
        data: {
          balance: wallet.balance.plus(refundAmountDecimal),
          updated_at: now,
        },
      });

      await tx.payments.update({
        where: { payment_id: originalPayment.payment_id },
        data: {
          payment_status: PAYMENT_STATUS_REFUNDED,
          metadata: {
            ...(originalPayment.metadata as Record<string, unknown> | null),
            refunded_at: now.toISOString(),
          },
        },
      });

      const refundPayment = await tx.payments.create({
        data: {
          subscription_id: subscription.subscription_id,
          user_id: userId,
          amount: refundAmountDecimal,
          payment_method: "wallet",
          payment_status: PAYMENT_STATUS_COMPLETED,
          payment_type: PaymentType.PACKAGE_REFUND,
          paid_at: now,
          metadata: {
            refund_reason: reason ?? "user_requested_cancellation",
            refunded_payment_id: originalPayment.payment_id,
            original_amount: originalAmount,
            refund_ratio: refundRatio,
            cancellation_fee_percent: 3,
            cancellation_fee_amount: originalAmount * refundRatio * 0.03,
            minimum_refund_applied:
              refundAmount === 10000 &&
              refundAmount < originalAmount * refundRatio * 0.97,
          } as Prisma.InputJsonValue,
        } as Prisma.paymentsUncheckedCreateInput,
      });

      const updatedSubscription = await tx.user_subscriptions.update({
        where: { subscription_id: subscriptionId },
        data: {
          status: "cancelled",
          cancelled_at: now,
          cancellation_reason: reason ?? "user_requested_cancellation",
          updated_at: now,
        },
        include: { service_packages: true },
      });

      return {
        updatedSubscription,
        walletBalanceAfter: updatedWallet.balance,
        refundPayment,
      };
    });

    const { service_packages, ...rest } = result.updatedSubscription;
    const mappedSubscription = {
      ...rest,
      package: service_packages || null,
    };

    res.status(200).json({
      success: true,
      message: "Subscription cancelled and refunded",
      data: {
        subscription: mappedSubscription,
        refund: {
          payment_id: result.refundPayment.payment_id,
          amount: Number(result.refundPayment.amount),
          original_amount: originalAmount,
          refund_ratio: refundRatio,
          cancellation_fee_percent: 3,
          cancellation_fee_amount: Math.floor(
            originalAmount * refundRatio * 0.03
          ),
          minimum_refund_applied:
            refundAmount === 10000 &&
            refundAmount < originalAmount * refundRatio * 0.97,
          payment_type: result.refundPayment.payment_type,
        },
        wallet_balance: Number(result.walletBalanceAfter),
      },
    });
  }
);
