import { Request, Response } from "express";
import {
  createVNPayPayment,
  handleVNPayReturn,
  handleVNPayIPN,
  getUserPaymentHistory,
  getPaymentById,
  CreatePaymentData,
} from "../services/vnpay.service";
import { asyncHandler } from "../middlewares/error.middleware";
import { notificationService } from "../server";
// import { authenticateToken } from '../middlewares/auth.middleware';

/**
 * Create VNPay payment
 */
export const createPayment = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { amount, orderDescription, orderType, bankCode, language } =
        req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be greater than 0",
        });
      }

      if (!orderDescription) {
        return res.status(400).json({
          success: false,
          message: "Order description is required",
        });
      }

      const paymentData: CreatePaymentData = {
        userId,
        amount,
        orderDescription,
        orderType,
        bankCode,
        language,
      };

      const result = await createVNPayPayment(paymentData);

      return res.status(200).json({
        success: true,
        message: "VNPay payment URL generated",
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to create VNPay payment",
      });
    }
  }
);

/**
 * Handle VNPay return callback
 */
export const handleReturn = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const response = req.query as any;

      const result = await handleVNPayReturn(response);

      if (result.success) {
        // Send payment success notification
        try {
          const payment = result.paymentId
            ? await getPaymentById(result.paymentId)
            : null;
          if (payment && payment.user_id) {
            await notificationService.sendNotification({
              type: "payment_success",
              userId: payment.user_id,
              title: "Thanh toán thành công!",
              message: `Thanh toán của bạn đã được xử lý thành công. Số tiền: ${result.amount || "N/A"} VND`,
              data: {
                email: payment.user?.email,
                userName: payment.user?.full_name,
                amount: result.amount,
                transactionId: result.paymentId,
                paymentTime: new Date().toISOString(),
              },
            });
          }
        } catch (error) {
          console.error("Failed to send payment success notification:", error);
        }

        // Redirect to success page
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const successUrl = `${frontendUrl}/payment/success?paymentId=${result.paymentId}&amount=${result.amount}`;
        return res.redirect(successUrl);
      } else {
        // Send payment failed notification
        try {
          const payment = result.paymentId
            ? await getPaymentById(result.paymentId)
            : null;
          if (payment && payment.user_id) {
            await notificationService.sendNotification({
              type: "payment_failed",
              userId: payment.user_id,
              title: "Thanh toán thất bại",
              message: `Thanh toán của bạn không thành công. Lý do: ${result.message}`,
              data: {
                email: payment.user?.email,
                userName: payment.user?.full_name,
                reason: result.message,
                transactionId: result.paymentId,
              },
            });
          }
        } catch (error) {
          console.error("Failed to send payment failed notification:", error);
        }

        // Redirect to error page
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const errorUrl = `${frontendUrl}/payment/error?message=${encodeURIComponent(result.message)}`;
        return res.redirect(errorUrl);
      }
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const errorUrl = `${frontendUrl}/payment/error?message=${encodeURIComponent("Payment processing failed")}`;
      return res.redirect(errorUrl);
    }
  }
);

/**
 * Handle VNPay IPN (Instant Payment Notification)
 */
export const handleIPN = asyncHandler(async (req: Request, res: Response) => {
  try {
    const response = req.body;

    const result = await handleVNPayIPN(response);

    // VNPay expects specific response format
    return res.status(200).json({
      RspCode: result.success ? "00" : "99",
      Message: result.message,
    });
  } catch (error) {
    return res.status(200).json({
      RspCode: "99",
      Message: "Failed to process IPN",
    });
  }
});

/**
 * Get payment history for user
 */
export const getPaymentHistory = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const result = await getUserPaymentHistory(userId, page, limit);

      return res.status(200).json({
        success: true,
        message: "Payment history retrieved",
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to get payment history",
      });
    }
  }
);

/**
 * Get payment by ID
 */
export const getPayment = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    const payment = await getPaymentById(paymentId);

    return res.status(200).json({
      success: true,
      message: "Payment retrieved",
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get payment",
    });
  }
});

/**
 * Test VNPay sandbox
 */
export const testVNPay = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const testData = {
      amount: 100000, // 100,000 VND
      orderDescription: "Test payment for EV Battery Swap",
      orderType: "other",
      bankCode: "",
      language: "vn",
    };

    // Create test payment
    const result = await createVNPayPayment({
      userId: "test-user-id",
      ...testData,
    });

    return res.status(200).json({
      success: true,
      message: "VNPay sandbox test",
      data: {
        ...result,
        testMode: true,
        note: "This is a test payment. Use VNPay sandbox credentials.",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to test VNPay",
    });
  }
});
