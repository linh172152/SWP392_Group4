import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";

const prisma = new PrismaClient();

/**
 * Get wallet balance
 */
export const getWalletBalance = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { user_id: userId },
    });

    // If wallet doesn't exist, create it
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          user_id: userId,
          balance: 0,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Wallet balance retrieved successfully",
      data: {
        balance: wallet.balance,
        currency: "VND",
      },
    });
  }
);

/**
 * Get wallet transactions history
 */
export const getWalletTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Get payment transactions related to wallet
    const payments = await prisma.payment.findMany({
      where: {
        user_id: userId,
        // Include all payment methods (wallet, vnpay, cash, etc.)
      },
      include: {
        transaction: {
          select: {
            transaction_code: true,
            booking: {
              select: {
                booking_code: true,
                station: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        topup_package: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit as string),
    });

    const total = await prisma.payment.count({
      where: {
        user_id: userId,
        // Include all payment methods
      },
    });

    res.status(200).json({
      success: true,
      message: "Wallet transactions retrieved successfully",
      data: {
        transactions: payments,
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
 * Top up wallet
 */
export const topUpWallet = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { package_id, payment_method = "vnpay" } = req.body;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    if (!package_id) {
      throw new CustomError("Package ID is required", 400);
    }

    // Get topup package
    const topupPackage = await prisma.topUpPackage.findUnique({
      where: { package_id },
    });

    if (!topupPackage) {
      throw new CustomError("Top-up package not found", 404);
    }

    if (!topupPackage.is_active) {
      throw new CustomError("Top-up package is not active", 400);
    }

    // If payment method is cash, update wallet immediately
    if (payment_method === "cash") {
      const wallet = await prisma.wallet.upsert({
        where: { user_id: userId },
        update: {
          balance: {
            increment: topupPackage.actual_amount,
          },
        },
        create: {
          user_id: userId,
          balance: topupPackage.actual_amount,
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          user_id: userId,
          topup_package_id: package_id,
          amount: topupPackage.topup_amount,
          payment_method: "cash",
          payment_status: "completed",
          paid_at: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        message: "Wallet topped up successfully",
        data: {
          balance: wallet.balance,
          topup_amount: topupPackage.topup_amount,
          bonus_amount: topupPackage.bonus_amount,
          actual_amount: topupPackage.actual_amount,
        },
      });
    }

    // For online payments (VNPay, MoMo), redirect to payment gateway
    // This will be handled by VNPay controller
    // For now, return payment URL structure
    return res.status(200).json({
      success: true,
      message: "Redirect to payment gateway",
      data: {
        package_id,
        topup_amount: topupPackage.topup_amount,
        actual_amount: topupPackage.actual_amount,
        bonus_amount: topupPackage.bonus_amount,
        payment_method,
        // Payment URL will be generated by VNPay service
      },
    });
  }
);

