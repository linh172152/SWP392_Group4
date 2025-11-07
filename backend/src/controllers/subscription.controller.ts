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

    const subscriptions = await prisma.userSubscription.findMany({
      where: { user_id: userId },
      include: {
        package: true,
        payments: {
          orderBy: { created_at: "desc" },
          take: 5,
        },
      },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json({
      success: true,
      message: "Driver subscriptions retrieved successfully",
      data: subscriptions,
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

    const servicePackage = await prisma.servicePackage.findUnique({
      where: { package_id: packageId },
    });

    if (!servicePackage || !servicePackage.is_active) {
      throw new CustomError("Package not found or inactive", 404);
    }

    const now = new Date();

    const existingActive = await prisma.userSubscription.findFirst({
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

    const wallet = await prisma.wallet.findUnique({
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
      const createdSubscription = await tx.userSubscription.create({
        data: {
          user_id: userId,
          package_id: packageId,
          start_date: now,
          end_date: endDate,
          remaining_swaps: servicePackage.swap_limit ?? null,
          auto_renew: Boolean(autoRenew),
        },
        include: { package: true },
      });

      await tx.wallet.update({
        where: { user_id: userId },
        data: {
          balance: wallet.balance.minus(servicePackage.price),
          updated_at: new Date(),
        },
      });

      await tx.payment.create({
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
          },
        },
      });

      return createdSubscription;
    });

    res.status(201).json({
      success: true,
      message: "Subscription purchased successfully",
      data: subscription,
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

    const subscription = await prisma.userSubscription.findUnique({
      where: { subscription_id: subscriptionId },
      include: {
        package: true,
      },
    });

    if (!subscription || subscription.user_id !== userId) {
      throw new CustomError("Subscription not found", 404);
    }

    if (subscription.status !== "active") {
      throw new CustomError("Only active subscriptions can be cancelled", 400);
    }

    if (!subscription.package) {
      throw new CustomError("Subscription package information not found", 500);
    }

    const packageSwapLimit = subscription.package.swap_limit;

    let hasUsage = false;

    if (packageSwapLimit === null) {
      const statusEnumList = ["pending", "confirmed", "completed"].map(
        (status) => Prisma.sql`${status}::"BookingStatus"`
      );

      const usageRows = await prisma.$queryRaw<{ usage: bigint }[]>(
        Prisma.sql`
          SELECT COUNT(*)::bigint AS usage
          FROM bookings
          WHERE user_id = CAST(${userId} AS uuid)
            AND use_subscription = true
            AND created_at >= ${subscription.start_date}
            AND status IN (${Prisma.join(statusEnumList)})
        `
      );

      const usageCount = usageRows.length ? Number(usageRows[0].usage) : 0;
      hasUsage = usageCount > 0;
    } else {
      const remainingSwaps = subscription.remaining_swaps ?? 0;
      hasUsage = remainingSwaps !== packageSwapLimit;
    }

    if (hasUsage) {
      throw new CustomError(
        "Subscription has already been used and cannot be refunded",
        400
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

    const originalPayment = await prisma.payment.findFirst({
      where: {
        subscription_id: subscriptionId,
        payment_type: PaymentType.SUBSCRIPTION,
      },
      orderBy: { created_at: "desc" },
    });

    if (!originalPayment) {
      throw new CustomError(
        "Original subscription payment not found. Contact support for assistance",
        400
      );
    }

    if (originalPayment.payment_status === PAYMENT_STATUS_REFUNDED) {
      throw new CustomError("Subscription has already been refunded", 400);
    }

    const refundAmount = originalPayment.amount;

    if (refundAmount.lte(0)) {
      throw new CustomError("Invalid refund amount", 500);
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { user_id: userId } });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            user_id: userId,
            balance: new Prisma.Decimal(0),
          },
        });
      }

      const updatedWallet = await tx.wallet.update({
        where: { user_id: userId },
        data: {
          balance: wallet.balance.plus(refundAmount),
          updated_at: now,
        },
      });

      await tx.payment.update({
        where: { payment_id: originalPayment.payment_id },
        data: {
          payment_status: PAYMENT_STATUS_REFUNDED,
          metadata: {
            ...(originalPayment.metadata as Record<string, unknown> | null),
            refunded_at: now.toISOString(),
          },
        },
      });

      const refundPayment = await tx.payment.create({
        data: {
          subscription_id: subscription.subscription_id,
          user_id: userId,
          amount: refundAmount,
          payment_method: "wallet",
          payment_status: PAYMENT_STATUS_COMPLETED,
          payment_type: PaymentType.PACKAGE_REFUND,
          paid_at: now,
          metadata: {
            refund_reason: reason ?? "user_requested_cancellation",
            refunded_payment_id: originalPayment.payment_id,
          },
        },
      });

      const updatedSubscription = await tx.userSubscription.update({
        where: { subscription_id: subscriptionId },
        data: {
          status: "cancelled",
          cancelled_at: now,
          cancellation_reason: reason ?? "user_requested_cancellation",
          updated_at: now,
        },
        include: { package: true },
      });

      return {
        updatedSubscription,
        walletBalanceAfter: updatedWallet.balance,
        refundPayment,
      };
    });

    res.status(200).json({
      success: true,
      message: "Subscription cancelled and refunded",
      data: {
        subscription: result.updatedSubscription,
        refund: {
          payment_id: result.refundPayment.payment_id,
          amount: Number(result.refundPayment.amount),
          payment_type: result.refundPayment.payment_type,
        },
        wallet_balance: Number(result.walletBalanceAfter),
      },
    });
  }
);
