import { Request, Response } from "express";
import { prisma } from "../server";
import { PaymentType } from "@prisma/client";
import { asyncHandler, CustomError } from "../middlewares/error.middleware";

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

    if (!userId) {
      throw new CustomError("Driver not authenticated", 401);
    }

    if (!subscriptionId) {
      throw new CustomError("subscriptionId is required", 400);
    }

    const subscription = await prisma.userSubscription.findUnique({
      where: { subscription_id: subscriptionId },
      include: { package: true },
    });

    if (!subscription || subscription.user_id !== userId) {
      throw new CustomError("Subscription not found", 404);
    }

    if (subscription.status !== "active") {
      throw new CustomError("Only active subscriptions can be cancelled", 400);
    }

    const now = new Date();
    const isExpired = subscription.end_date <= now;

    const updatedSubscription = await prisma.userSubscription.update({
      where: { subscription_id: subscriptionId },
      data: {
        status: isExpired ? "expired" : "cancelled",
        updated_at: now,
      },
      include: { package: true },
    });

    res.status(200).json({
      success: true,
      message: "Subscription status updated",
      data: updatedSubscription,
    });
  }
);
