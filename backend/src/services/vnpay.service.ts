import { Prisma, PaymentType } from "@prisma/client";
import type { payments } from "@prisma/client";
import {
  generateVNPayUrl,
  verifyVNPayResponse,
  isVNPaySuccess,
  getVNPayResponseMessage,
  parseVNPayAmount,
  VNPayPaymentData,
  VNPayResponse,
} from "../utils/vnpay.util";
import { vnpayConfig } from "../config/vnpay.config";
import crypto from "crypto-js";
import { CustomError } from "../middlewares/error.middleware";
import { prisma } from "../server";

export interface CreatePaymentData {
  userId: string;
  amount: number;
  orderDescription: string;
  orderType?: string;
  bankCode?: string;
  language?: string;
  paymentType?: PaymentType;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  topupPackageId?: string;
}

export interface PaymentResult {
  paymentUrl: string;
  orderId: string;
  amount: number;
  orderDescription: string;
}

/**
 * Create VNPay payment
 */
export const createVNPayPayment = async (
  data: CreatePaymentData & { topupPackageId?: string }
): Promise<PaymentResult> => {
  try {
    const {
      userId,
      amount,
      orderDescription,
      orderType,
      bankCode,
      language,
      paymentType,
      metadata,
      ipAddress,
      topupPackageId,
    } = data;

    // Validate user
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    if (user.status !== "ACTIVE") {
      throw new CustomError("User account is inactive", 401);
    }

    // Generate order ID
    const orderId = `EVBSS${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const baseMetadata: Record<string, any> = {
      order_id: orderId,
      order_description: orderDescription,
      order_type: orderType || "other",
      ...(metadata ?? {}),
    };

    if (
      baseMetadata.type === "wallet_topup" &&
      typeof baseMetadata.wallet_topup_processed === "undefined"
    ) {
      baseMetadata.wallet_topup_processed = false;
    }

    await prisma.payments.create({
      data: {
        user_id: userId,
        amount: new Prisma.Decimal(amount),
        payment_method: "vnpay",
        payment_status: "pending",
        payment_gateway_ref: orderId,
        created_at: new Date(),
        payment_type: paymentType ?? "OTHER",
        metadata: baseMetadata as Prisma.InputJsonValue,
        topup_package_id: topupPackageId ?? null,
      } as Prisma.paymentsUncheckedCreateInput,
    });

    // Create VNPay payment data
    const vnpayData: VNPayPaymentData = {
      amount: amount,
      orderId: orderId,
      orderDescription: orderDescription,
      orderType: orderType || "other",
      bankCode: bankCode || "",
      language: language || "vn",
      ipAddress: ipAddress,
    };

    // Generate VNPay URL
    const paymentUrl = generateVNPayUrl(vnpayData);

    try {
      const url = new URL(paymentUrl);
      const paramsForHash: Record<string, string> = {};
      url.searchParams.forEach((value, key) => {
        if (key !== "vnp_SecureHash" && key !== "vnp_SecureHashType") {
          paramsForHash[key] = value;
        }
      });
      const signFromUrl = Object.keys(paramsForHash)
        .sort((a, b) => a.localeCompare(b))
        .map((key) => `${key}=${paramsForHash[key]}`)
        .join("&");
      const hashFromUrl = crypto
        .HmacSHA512(signFromUrl, vnpayConfig.hashSecret)
        .toString(crypto.enc.Hex)
        .toLowerCase();
      const sentHash = url.searchParams.get("vnp_SecureHash");
      console.log("[VNPay] TMN:", paramsForHash["vnp_TmnCode"]);
      console.log("[VNPay] sentHash:", sentHash);
      console.log("[VNPay] hashFromUrl:", hashFromUrl);
    } catch (error) {
      console.warn("[VNPay] Failed to verify generated payment URL:", error);
    }

    console.log(
      "[VNPay] Generated payment URL",
      JSON.stringify({ orderId, userId, paymentUrl }, null, 2)
    );

    return {
      paymentUrl,
      orderId,
      amount,
      orderDescription,
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError("Failed to create VNPay payment", 500);
  }
};

/**
 * Handle VNPay return callback
 */
export const handleVNPayReturn = async (
  response: VNPayResponse
): Promise<{
  success: boolean;
  message: string;
  paymentId?: string;
  amount?: number;
}> => {
  try {
    // Verify response signature
    if (!verifyVNPayResponse(response)) {
      return {
        success: false,
        message: "Invalid VNPay response signature",
      };
    }

    // Find payment by order ID
    const payment = await prisma.payments.findFirst({
      where: { payment_gateway_ref: response.vnp_TxnRef },
    });

    if (!payment) {
      return {
        success: false,
        message: "Payment not found",
      };
    }

    const metadata = (payment.metadata as Record<string, any> | null) ?? {};
    const responseAmount = parseVNPayAmount(response.vnp_Amount);
    const expectedAmount = Number(payment.amount);

    if (Number.isFinite(expectedAmount) && responseAmount !== expectedAmount) {
      await prisma.payments.update({
        where: { payment_id: payment.payment_id },
        data: {
          payment_status: "failed",
          metadata: {
            ...metadata,
            vnp_transaction_no: response.vnp_TransactionNo,
            vnp_response_code: response.vnp_ResponseCode,
            payment_failure_reason: "amount_mismatch",
            expected_amount: expectedAmount,
            received_amount: responseAmount,
          },
        },
      });

      return {
        success: false,
        message: "Payment amount mismatch",
        paymentId: payment.payment_id,
      };
    }

    if (!isVNPaySuccess(response)) {
      const message = getVNPayResponseMessage(response.vnp_ResponseCode);

      await prisma.payments.update({
        where: { payment_id: payment.payment_id },
        data: {
          payment_status: "failed",
          metadata: {
            ...metadata,
            vnp_transaction_no: response.vnp_TransactionNo,
            vnp_response_code: response.vnp_ResponseCode,
            payment_failure_reason: message,
          },
        },
      });

      return {
        success: false,
        message: `Payment failed: ${message}`,
        paymentId: payment.payment_id,
      };
    }

    const updatedPayment = await prisma.payments.update({
      where: { payment_id: payment.payment_id },
      data: {
        payment_status: "completed",
        paid_at: new Date(),
        metadata: {
          ...metadata,
          bank_code: response.vnp_BankCode,
          card_type: response.vnp_CardType,
          vnp_transaction_no: response.vnp_TransactionNo,
          vnp_response_code: response.vnp_ResponseCode,
        },
      },
    });

    await applyWalletTopupIfNeeded(payment, updatedPayment);

    return {
      success: true,
      message: "Payment successful",
      paymentId: updatedPayment.payment_id,
      amount: responseAmount,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to process VNPay return",
    };
  }
};

/**
 * Handle VNPay IPN (Instant Payment Notification)
 */
const applyWalletTopupIfNeeded = async (
  originalPayment: payments,
  updatedPayment: payments
) => {
  const metadata =
    (updatedPayment.metadata as Record<string, any> | null) ?? {};

  if (metadata?.type !== "wallet_topup") {
    return;
  }

  if (metadata.wallet_topup_processed) {
    return;
  }

  const actualAmountNumber = Number(
    metadata.actual_amount ?? metadata.topup_amount ?? 0
  );

  if (!Number.isFinite(actualAmountNumber) || actualAmountNumber <= 0) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const actualAmountDecimal = new Prisma.Decimal(actualAmountNumber);

    await tx.wallets.upsert({
      where: { user_id: originalPayment.user_id },
      update: {
        balance: {
          increment: actualAmountDecimal,
        },
      },
      create: {
        user_id: originalPayment.user_id,
        balance: actualAmountDecimal,
      },
    });

    await tx.payments.update({
      where: { payment_id: originalPayment.payment_id },
      data: {
        payment_type: "TOPUP",
        metadata: {
          ...metadata,
          wallet_topup_processed: true,
          wallet_topup_processed_at: new Date().toISOString(),
        },
      },
    });
  });
};

/**
 * Get payment history for user
 */
export const getUserPaymentHistory = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const skip = (page - 1) * limit;

    const payments = await prisma.payments.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.payments.count({
      where: { user_id: userId },
    });

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new CustomError("Failed to get payment history", 500);
  }
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (paymentId: string) => {
  try {
    const payment = await prisma.payments.findUnique({
      where: { payment_id: paymentId },
      include: {
        users: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      throw new CustomError("Payment not found", 404);
    }

    return payment;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError("Failed to get payment", 500);
  }
};
