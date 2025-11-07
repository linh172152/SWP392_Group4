import { PrismaClient, Prisma, PaymentType } from '@prisma/client';
import type { Payment } from '@prisma/client';
import { 
  generateVNPayUrl, 
  verifyVNPayResponse, 
  isVNPaySuccess, 
  getVNPayResponseMessage,
  parseVNPayAmount,
  VNPayPaymentData,
  VNPayResponse
} from '../utils/vnpay.util';
import { CustomError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

export interface CreatePaymentData {
  userId: string;
  amount: number;
  orderDescription: string;
  orderType?: string;
  bankCode?: string;
  language?: string;
  paymentType?: PaymentType;
  metadata?: Record<string, unknown>;
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
export const createVNPayPayment = async (data: CreatePaymentData): Promise<PaymentResult> => {
  try {
    const { userId, amount, orderDescription, orderType, bankCode, language, paymentType, metadata } = data;

    // Validate user
    const user = await prisma.user.findUnique({
      where: { user_id: userId }
    });

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    if (user.status !== 'ACTIVE') {
      throw new CustomError('User account is inactive', 401);
    }

    // Generate order ID
    const orderId = `EVBSS${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const baseMetadata: Record<string, any> = {
      order_id: orderId,
      order_description: orderDescription,
      order_type: orderType || 'other',
      ...(metadata ?? {}),
    };

    if (baseMetadata.type === 'wallet_topup' && typeof baseMetadata.wallet_topup_processed === 'undefined') {
      baseMetadata.wallet_topup_processed = false;
    }

    await prisma.payment.create({
      data: {
        user_id: userId,
        amount: amount,
        payment_method: 'vnpay',
        payment_status: 'pending',
        payment_gateway_ref: orderId,
        created_at: new Date(),
        payment_type: paymentType ?? 'OTHER',
        metadata: baseMetadata,
      }
    });

    // Create VNPay payment data
    const vnpayData: VNPayPaymentData = {
      amount: amount,
      orderId: orderId,
      orderDescription: orderDescription,
      orderType: orderType || 'other',
      bankCode: bankCode || '',
      language: language || 'vn'
    };

    // Generate VNPay URL
    const paymentUrl = generateVNPayUrl(vnpayData);

    return {
      paymentUrl,
      orderId,
      amount,
      orderDescription
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Failed to create VNPay payment', 500);
  }
};

/**
 * Handle VNPay return callback
 */
export const handleVNPayReturn = async (response: VNPayResponse): Promise<{
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
        message: 'Invalid VNPay response signature'
      };
    }

    // Check if payment is successful
    if (!isVNPaySuccess(response)) {
      const message = getVNPayResponseMessage(response.vnp_ResponseCode);
      return {
        success: false,
        message: `Payment failed: ${message}`
      };
    }

    // Find payment by order ID
    const payment = await prisma.payment.findFirst({
      where: { payment_gateway_ref: response.vnp_TxnRef }
    });

    if (!payment) {
      return {
        success: false,
        message: 'Payment not found'
      };
    }

    // Update payment status
    const metadata = (payment.metadata as Record<string, any> | null) ?? {};

    const updatedPayment = await prisma.payment.update({
      where: { payment_id: payment.payment_id },
      data: {
        payment_status: 'completed',
        paid_at: new Date(),
        metadata: {
          ...metadata,
          bank_code: response.vnp_BankCode,
          card_type: response.vnp_CardType,
          vnp_transaction_no: response.vnp_TransactionNo,
          vnp_response_code: response.vnp_ResponseCode,
        }
      }
    });

    await applyWalletTopupIfNeeded(payment, updatedPayment);

    return {
      success: true,
      message: 'Payment successful',
      paymentId: updatedPayment.payment_id,
      amount: parseVNPayAmount(response.vnp_Amount)
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to process VNPay return'
    };
  }
};

/**
 * Handle VNPay IPN (Instant Payment Notification)
 */
export const handleVNPayIPN = async (response: VNPayResponse): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    // Verify response signature
    if (!verifyVNPayResponse(response)) {
      return {
        success: false,
        message: 'Invalid VNPay response signature'
      };
    }

    // Find payment by order ID
    const payment = await prisma.payment.findFirst({
      where: { payment_gateway_ref: response.vnp_TxnRef }
    });

    if (!payment) {
      return {
        success: false,
        message: 'Payment not found'
      };
    }

    // Update payment status based on response
    let paymentStatus: 'pending' | 'completed' | 'failed' = 'pending';
    
    if (isVNPaySuccess(response)) {
      paymentStatus = 'completed';
    } else {
      paymentStatus = 'failed';
    }

    // Update payment
    const metadata = (payment.metadata as Record<string, any> | null) ?? {};

    const updatedPayment = await prisma.payment.update({
      where: { payment_id: payment.payment_id },
      data: {
        payment_status: paymentStatus,
        paid_at: paymentStatus === 'completed' ? new Date() : payment.paid_at,
        metadata: {
          ...metadata,
          bank_code: response.vnp_BankCode ?? metadata.bank_code,
          card_type: response.vnp_CardType ?? metadata.card_type,
          vnp_transaction_no: response.vnp_TransactionNo,
          vnp_response_code: response.vnp_ResponseCode,
        },
      }
    });

    if (paymentStatus === 'completed') {
      await applyWalletTopupIfNeeded(payment, updatedPayment);
    }

    return {
      success: true,
      message: 'IPN processed successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to process VNPay IPN'
    };
  }
};

const applyWalletTopupIfNeeded = async (
  originalPayment: Payment,
  updatedPayment: Payment
) => {
  const metadata = (updatedPayment.metadata as Record<string, any> | null) ?? {};

  if (metadata?.type !== 'wallet_topup') {
    return;
  }

  if (metadata.wallet_topup_processed) {
    return;
  }

  const actualAmountNumber = Number(metadata.actual_amount ?? metadata.topup_amount ?? 0);

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
        payment_type: 'TOPUP',
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
export const getUserPaymentHistory = async (userId: string, page: number = 1, limit: number = 10) => {
  try {
    const skip = (page - 1) * limit;

    const payments = await prisma.payment.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.payment.count({
      where: { user_id: userId }
    });

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new CustomError('Failed to get payment history', 500);
  }
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (paymentId: string) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { payment_id: paymentId },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true
          }
        }
      }
    });

    if (!payment) {
      throw new CustomError('Payment not found', 404);
    }

    return payment;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Failed to get payment', 500);
  }
};
