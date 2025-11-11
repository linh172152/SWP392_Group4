import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";
import { createVNPayPayment } from "../services/vnpay.service";

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
        subscription: {
          select: {
            subscription_id: true,
            status: true,
            start_date: true,
            end_date: true,
            package: {
              select: {
                package_id: true,
                name: true,
                battery_capacity_kwh: true,
                billing_cycle: true,
              },
            },
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
export const topUpWallet = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { package_id, payment_method = "vnpay" } = req.body;

  const forwardedFor = req.headers["x-forwarded-for"];
  let clientIp =
    (Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(",")[0]
    )?.trim() || "";

  if (!clientIp) {
    clientIp =
      req.socket.remoteAddress ||
      req.ip ||
      (req as any).connection?.remoteAddress ||
      "127.0.0.1";
  }

  if (clientIp.startsWith("::ffff:")) {
    clientIp = clientIp.substring(7);
  } else if (clientIp === "::1") {
    clientIp = "127.0.0.1";
  }

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

  if (payment_method === "cash") {
    throw new CustomError("Cash top-up is not supported", 400);
  }

  if (payment_method !== "vnpay") {
    throw new CustomError("Payment method not supported", 400);
  }

  const topupAmount = Number(topupPackage.topup_amount);
  const bonusAmount = Number(topupPackage.bonus_amount);
  const actualAmount = Number(topupPackage.actual_amount);

  if (Number.isNaN(topupAmount) || topupAmount <= 0) {
    throw new CustomError("Invalid top-up amount", 400);
  }

  const paymentResult = await createVNPayPayment({
    userId,
    amount: topupAmount,
    orderDescription: `Wallet top-up: ${topupPackage.name}`,
    orderType: "other",
    paymentType: "TOPUP",
    ipAddress: clientIp,
    topupPackageId: package_id,
    metadata: {
      type: "wallet_topup",
      topup_package_id: package_id,
      topup_amount: topupAmount,
      bonus_amount: bonusAmount,
      actual_amount: actualAmount,
    },
  });

  return res.status(200).json({
    success: true,
    message: "VNPay payment URL generated",
    data: {
      payment_url: paymentResult.paymentUrl,
      order_id: paymentResult.orderId,
      amount: paymentResult.amount,
      topup_package: {
        package_id,
        name: topupPackage.name,
        topup_amount: topupAmount,
        bonus_amount: bonusAmount,
        actual_amount: actualAmount,
      },
    },
  });
});
