import { Prisma, PaymentType } from "@prisma/client";
import type { Payment } from "@prisma/client";
import {
  generateVNPayPaymentUrl,
  verifyVNPaySignature,
  isVNPaySuccess,
  getVNPayResponseMessage,
  parseVNPayAmount,
  mapResponseToRecord,
  VNPayRequestPayload,
} from "../utils/vnpay.util";
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
  clientIp?: string;
  topupPackageId?: string;
}

export interface PaymentResult {
  paymentUrl: string;
  orderId: string;
  amount: number;
  orderDescription: string;
}

const buildOrderId = () =>
  `EVBSS${Date.now()}${Math.random().toString(36).slice(2, 11)}`;

export const createVNPayPayment = async (
  data: CreatePaymentData
): Promise<PaymentResult> => {
  const {
    userId,
    amount,
    orderDescription,
    orderType,
    bankCode,
    language,
    paymentType,
    metadata,
    clientIp,
    topupPackageId,
  } = data;

  const user = await prisma.user.findUnique({
    where: { user_id: userId },
  });
  if (!user) {
    throw new CustomError("User not found", 404);
  }
  if (user.status !== "ACTIVE") {
    throw new CustomError("User account is inactive", 401);
  }

  const orderId = buildOrderId();

  const baseMetadata: Record<string, any> = {
    order_id: orderId,
    order_description: orderDescription,
    order_type: orderType || undefined,
    ...(metadata ?? {}),
  };
  if (
    baseMetadata.type === "wallet_topup" &&
    typeof baseMetadata.wallet_topup_processed === "undefined"
  ) {
    baseMetadata.wallet_topup_processed = false;
  }

  await prisma.payment.create({
    data: {
      user_id: userId,
      amount,
      payment_method: "vnpay",
      payment_status: "pending",
      payment_gateway_ref: orderId,
      created_at: new Date(),
      payment_type: paymentType ?? "OTHER",
      metadata: baseMetadata,
      topup_package_id: topupPackageId ?? null,
    },
  });

  const payload: VNPayRequestPayload = {
    amount,
    orderId,
    orderInfo: orderDescription,
    orderType,
    bankCode,
    locale: language,
    clientIp: clientIp || "127.0.0.1",
  };

  const { paymentUrl, params, signedData } = generateVNPayPaymentUrl(payload);
  console.log("[VNPay] TMN:", params.vnp_TmnCode, "SIGNED:", signedData);

  return {
    paymentUrl,
    orderId,
    amount,
    orderDescription,
  };
};

export const handleVNPayReturn = async (
  rawResponse: Record<string, unknown>
): Promise<{
  success: boolean;
  message: string;
  paymentId?: string;
  amount?: number;
}> => {
  const response = mapResponseToRecord(rawResponse);

  if (!verifyVNPaySignature(response)) {
    return {
      success: false,
      message: "Invalid VNPay response signature",
    };
  }

  const payment = await prisma.payment.findFirst({
    where: { payment_gateway_ref: response.vnp_TxnRef },
  });

  if (!payment) {
    return {
      success: false,
      message: "Payment not found",
    };
  }

  const metadata = (payment.metadata as Record<string, any> | null) ?? {};
  const receivedAmount = parseVNPayAmount(response.vnp_Amount || "0");
  const expectedAmount = Number(payment.amount);

  if (Number.isFinite(expectedAmount) && receivedAmount !== expectedAmount) {
    await prisma.payment.update({
      where: { payment_id: payment.payment_id },
      data: {
        payment_status: "failed",
        metadata: {
          ...metadata,
          vnp_transaction_no: response.vnp_TransactionNo,
          vnp_response_code: response.vnp_ResponseCode,
          payment_failure_reason: "amount_mismatch",
          expected_amount: expectedAmount,
          received_amount: receivedAmount,
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
    const message = getVNPayResponseMessage(response.vnp_ResponseCode || "");

    await prisma.payment.update({
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

  const updatedPayment = await prisma.payment.update({
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
    amount: receivedAmount,
  };
};

const applyWalletTopupIfNeeded = async (
  originalPayment: Payment,
  updatedPayment: Payment
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

    await tx.wallet.upsert({
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

    await tx.payment.update({
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

export const getUserPaymentHistory = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const skip = (page - 1) * limit;

    const payments = await prisma.payment.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.payment.count({
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

export const getPaymentById = async (paymentId: string) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { payment_id: paymentId },
      include: {
        user: {
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

