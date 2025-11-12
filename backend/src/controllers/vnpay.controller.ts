import { Request, Response } from "express";
import {
  createVNPayPayment,
  handleVNPayReturn,
  getUserPaymentHistory,
  getPaymentById,
  CreatePaymentData,
} from "../services/vnpay.service";
import { asyncHandler, CustomError } from "../middlewares/error.middleware";
import { notificationService, prisma } from "../server";
// import { authenticateToken } from '../middlewares/auth.middleware';

/**
 * Create VNPay payment
 */
export const createPayment = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const {
        amount,
        orderDescription,
        orderInfo,
        orderType,
        bankCode,
        language,
      } = req.body;

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

      const normalizedDescription = orderDescription ?? orderInfo;

      if (!normalizedDescription) {
        return res.status(400).json({
          success: false,
          message: "Order description is required",
        });
      }

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

      const paymentData: CreatePaymentData = {
        userId,
        amount,
        orderDescription: normalizedDescription,
        orderType,
        bankCode,
        language,
        ipAddress: clientIp,
      };

      const result = await createVNPayPayment(paymentData);

      return res.status(200).json({
        success: true,
        message: "VNPay payment URL generated",
        data: result,
      });
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      console.error("Failed to create VNPay payment:", error);
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

      console.log("--- VNPAY RETURN RECEIVED ---");
      console.log("Raw Query Response:", response);
      console.log("-----------------------------");

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
        const frontendUrl =
          process.env.FRONTEND_URL || "https://swp392-ev.vercel.app";
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
        const frontendUrl =
          process.env.FRONTEND_URL || "https://swp392-ev.vercel.app";
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

    const user = await prisma.user.findFirst({
      where: { role: "DRIVER", status: "ACTIVE" },
      orderBy: { created_at: "asc" },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "No active driver user found. Please create a driver account before testing VNPay.",
      });
    }

    const result = await createVNPayPayment({
      userId: user.user_id,
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
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Failed to test VNPay:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to test VNPay",
    });
  }
});
