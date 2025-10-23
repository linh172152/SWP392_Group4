import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";

const prisma = new PrismaClient();

/**
 * Get user subscriptions
 */
export const getUserSubscriptions = asyncHandler(
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

    const subscriptions = await prisma.userSubscription.findMany({
      where: whereClause,
      include: {
        package: {
          select: {
            package_id: true,
            name: true,
            description: true,
            price: true,
            swap_limit: true,
            duration_days: true,
            battery_models: true,
          },
        },
        payments: {
          select: {
            payment_id: true,
            amount: true,
            payment_method: true,
            payment_status: true,
            paid_at: true,
          },
          orderBy: { created_at: "desc" },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit as string),
    });

    const total = await prisma.userSubscription.count({ where: whereClause });

    res.status(200).json({
      success: true,
      message: "User subscriptions retrieved successfully",
      data: {
        subscriptions,
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
 * Create subscription
 */
export const createSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { package_id, payment_method = "cash" } = req.body;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    if (!package_id) {
      throw new CustomError("Package ID is required", 400);
    }

    // Check if package exists
    const packageData = await prisma.servicePackage.findUnique({
      where: { package_id },
    });

    if (!packageData) {
      throw new CustomError("Service package not found", 404);
    }

    if (!packageData.is_active) {
      throw new CustomError("Service package is not active", 400);
    }

    // Check if user already has active subscription
    const activeSubscription = await prisma.userSubscription.findFirst({
      where: {
        user_id: userId,
        status: "active",
      },
    });

    if (activeSubscription) {
      throw new CustomError("User already has an active subscription", 400);
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + packageData.duration_days);

    // Create subscription
    const subscription = await prisma.userSubscription.create({
      data: {
        user_id: userId,
        package_id,
        start_date: startDate,
        end_date: endDate,
        remaining_swaps: packageData.swap_limit,
        status: "active",
        auto_renew: false,
      },
      include: {
        package: {
          select: {
            package_id: true,
            name: true,
            description: true,
            price: true,
            swap_limit: true,
            duration_days: true,
            battery_models: true,
          },
        },
      },
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        user_id: userId,
        subscription_id: subscription.subscription_id,
        amount: packageData.price,
        payment_method,
        payment_status: payment_method === "cash" ? "completed" : "pending",
        paid_at: payment_method === "cash" ? new Date() : null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: {
        subscription,
        payment,
      },
    });
  }
);

/**
 * Get subscription details
 */
export const getSubscriptionDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const subscription = await prisma.userSubscription.findFirst({
      where: {
        subscription_id: id,
        user_id: userId,
      },
      include: {
        package: {
          select: {
            package_id: true,
            name: true,
            description: true,
            price: true,
            swap_limit: true,
            duration_days: true,
            battery_models: true,
          },
        },
        payments: {
          select: {
            payment_id: true,
            amount: true,
            payment_method: true,
            payment_status: true,
            paid_at: true,
            created_at: true,
          },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!subscription) {
      throw new CustomError("Subscription not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Subscription details retrieved successfully",
      data: subscription,
    });
  }
);

/**
 * Cancel subscription
 */
export const cancelSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const subscription = await prisma.userSubscription.findFirst({
      where: {
        subscription_id: id,
        user_id: userId,
        status: "active",
      },
    });

    if (!subscription) {
      throw new CustomError("Active subscription not found", 404);
    }

    const updatedSubscription = await prisma.userSubscription.update({
      where: { subscription_id: id },
      data: {
        status: "cancelled",
        auto_renew: false,
      },
      include: {
        package: {
          select: {
            package_id: true,
            name: true,
            description: true,
            price: true,
            swap_limit: true,
            duration_days: true,
            battery_models: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: updatedSubscription,
    });
  }
);
