import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";
import { notificationService } from "../server";

const prisma = new PrismaClient();

/**
 * Get user transactions
 */
export const getUserTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { status, page = 1, limit = 10 } = req.query;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const whereClause: any = { user_id: userId };
    if (status && status !== "all" && status !== "undefined") {
      whereClause.payment_status = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const transactions = await prisma.transactions.findMany({
      where: whereClause,
      include: {
        stations: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
        vehicles: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            model: true,
          },
        },
        batteries_transactions_new_battery_idTobatteries: {
          select: {
            battery_id: true,
            battery_code: true,
            model: true,
            capacity_kwh: true,
            current_charge: true,
          },
        },
        batteries_transactions_old_battery_idTobatteries: {
          select: {
            battery_id: true,
            battery_code: true,
            model: true,
            capacity_kwh: true,
            current_charge: true,
          },
        },
        users_transactions_staff_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
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
        },
        station_ratings: {
          select: {
            rating_id: true,
            rating: true,
            comment: true,
          },
        },
      },
      orderBy: { swap_at: "desc" },
      skip,
      take: parseInt(limit as string),
    });

    const total = await prisma.transactions.count({ where: whereClause });

    const mappedTransactions = transactions.map((transaction: any) => {
      const {
        batteries_transactions_old_battery_idTobatteries,
        batteries_transactions_new_battery_idTobatteries,
        amount,
        payments,
        stations,
        ...rest
      } = transaction;
      return {
        ...rest,
        amount: Number(amount),
        station: stations || null, // ✅ Map stations (số nhiều) thành station (số ít) để match với frontend
        old_battery: batteries_transactions_old_battery_idTobatteries || null,
        new_battery: batteries_transactions_new_battery_idTobatteries || null,
        payment: payments
          ? {
              ...payments,
              amount: Number(payments.amount),
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      message: "User transactions retrieved successfully",
      data: {
        transactions: mappedTransactions,
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
 * Get transaction details
 */
export const getTransactionDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const transaction = await prisma.transactions.findFirst({
      where: {
        transaction_id: id,
        user_id: userId,
      },
      include: {
        bookings: {
          select: {
            booking_id: true,
            booking_code: true,
            scheduled_at: true,
            status: true,
          },
        },
        stations: {
          select: {
            station_id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        vehicles: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            model: true,
            make: true,
            year: true,
          },
        },
        batteries_transactions_new_battery_idTobatteries: {
          select: {
            battery_id: true,
            battery_code: true,
            model: true,
            capacity_kwh: true,
            current_charge: true,
            status: true,
          },
        },
        batteries_transactions_old_battery_idTobatteries: {
          select: {
            battery_id: true,
            battery_code: true,
            model: true,
            capacity_kwh: true,
            current_charge: true,
            status: true,
          },
        },
        users_transactions_staff_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        payments: {
          select: {
            payment_id: true,
            amount: true,
            payment_method: true,
            payment_status: true,
            payment_gateway_ref: true,
            paid_at: true,
            created_at: true,
          },
        },
        station_ratings: {
          select: {
            rating_id: true,
            rating: true,
            comment: true,
            created_at: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new CustomError("Transaction not found", 404);
    }

    const {
      batteries_transactions_old_battery_idTobatteries,
      batteries_transactions_new_battery_idTobatteries,
      amount,
      payments,
      stations,
      ...rest
    } = transaction;
    const mappedTransaction = {
      ...rest,
      amount: Number(amount),
      station: stations || null, // ✅ Map stations (số nhiều) thành station (số ít) để match với frontend
      old_battery: batteries_transactions_old_battery_idTobatteries || null,
      new_battery: batteries_transactions_new_battery_idTobatteries || null,
      payment: payments
        ? {
            ...payments,
            amount: Number(payments.amount),
          }
        : null,
    };

    res.status(200).json({
      success: true,
      message: "Transaction details retrieved successfully",
      data: mappedTransaction,
    });
  }
);

/**
 * Get transaction statistics
 */
export const getTransactionStats = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { period = "30" } = req.query;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const days = parseInt(period as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await prisma.transactions.aggregate({
      where: {
        user_id: userId,
        created_at: {
          gte: startDate,
        },
      },
      _count: {
        transaction_id: true,
      },
      _sum: {
        amount: true,
      },
      _avg: {
        swap_duration_minutes: true,
      },
    });

    const statusCounts = await prisma.transactions.groupBy({
      by: ["payment_status"],
      where: {
        user_id: userId,
        created_at: {
          gte: startDate,
        },
      },
      _count: {
        transaction_id: true,
      },
    });

    const monthlyStats = await prisma.transactions.groupBy({
      by: ["created_at"],
      where: {
        user_id: userId,
        created_at: {
          gte: startDate,
        },
      },
      _count: {
        transaction_id: true,
      },
      _sum: {
        amount: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Transaction statistics retrieved successfully",
      data: {
        period: `${days} days`,
        total_transactions: stats._count.transaction_id,
        total_amount: stats._sum.amount || 0,
        average_duration: stats._avg.swap_duration_minutes || 0,
        status_breakdown: statusCounts,
        monthly_breakdown: monthlyStats,
      },
    });
  }
);

/**
 * Get pending transactions (need payment)
 */
export const getPendingTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const transactions = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        payment_status: "pending",
        amount: { gt: 0 }, // Only transactions that need payment
      },
      include: {
        stations: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
        bookings: {
          select: {
            booking_code: true,
            scheduled_at: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json({
      success: true,
      message: "Pending transactions retrieved successfully",
      data: transactions,
    });
  }
);

/**
 * Pay for transaction
 */
export const payTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { payment_method = "vnpay" } = req.body;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    // Get transaction
    const transaction = await prisma.transactions.findFirst({
      where: {
        transaction_id: id,
        user_id: userId,
        payment_status: "pending",
      },
      include: {
        users_transactions_user_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        stations: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new CustomError("Transaction not found or already paid", 404);
    }

    if (transaction.amount.toNumber() === 0) {
      throw new CustomError("Transaction is free, no payment required", 400);
    }

    // Create payment record
    const payment = await prisma.payments.create({
      data: {
        payment_id: randomUUID(), // ✅ Generate UUID for payment_id
        transaction_id: id,
        user_id: userId,
        amount: transaction.amount,
        payment_method: payment_method as string,
        payment_status: "pending",
        payment_type: "SWAP",
        metadata: {
          station_id: transaction.station_id,
          booking_id: transaction.booking_id,
        } as Prisma.InputJsonValue,
      } as Prisma.paymentsUncheckedCreateInput,
    });

    // If VNPay, redirect to payment gateway
    if (payment_method === "vnpay") {
      // TODO: Implement VNPay payment creation
      // For now, simulate payment success
      await prisma.payments.update({
        where: { payment_id: payment.payment_id },
        data: {
          payment_status: "completed",
          paid_at: new Date(),
          metadata: {
            ...((payment.metadata as Record<string, unknown> | null) ?? {}),
            gateway: "vnpay",
          },
        },
      });

      await prisma.transactions.update({
        where: { transaction_id: id },
        data: { payment_status: "completed" },
      });

      // Send payment success notification
      try {
        await notificationService.sendNotification({
          type: "payment_success",
          userId: userId,
          title: "Thanh toán thành công!",
          message: `Giao dịch ${transaction.transaction_code} đã được thanh toán thành công. Số tiền: ${transaction.amount} VND`,
          data: {
            email: transaction.users_transactions_user_idTousers.email,
            userName: transaction.users_transactions_user_idTousers.full_name,
            amount: transaction.amount,
            transactionId: transaction.transaction_code,
            paymentTime: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error("Failed to send payment success notification:", error);
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      data: {
        payment,
        transaction,
      },
    });
  }
);

/**
 * Create refund request
 */
export const createRefundRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { transaction_id, reason, amount } = req.body;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    if (!transaction_id || !reason) {
      throw new CustomError("Transaction ID and reason are required", 400);
    }

    // Check if transaction exists and belongs to user
    const transaction = await prisma.transactions.findFirst({
      where: {
        transaction_id,
        user_id: userId,
        payment_status: "completed",
      },
      include: {
        payments: true,
      },
    });

    if (!transaction) {
      throw new CustomError(
        "Transaction not found or not eligible for refund",
        404
      );
    }

    // Check if refund amount is valid
    const refundAmount = amount || transaction.amount;
    if (refundAmount > transaction.amount) {
      throw new CustomError(
        "Refund amount cannot exceed transaction amount",
        400
      );
    }

    // Create support ticket for refund request
    const ticketNumber = `REF${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const supportTicket = await prisma.support_tickets.create({
      data: {
        ticket_number: ticketNumber,
        user_id: userId,
        category: "payment_issue",
        subject: `Refund Request - Transaction ${transaction.transaction_code}`,
        description: `Refund request for transaction ${transaction.transaction_code}. Amount: ${refundAmount}. Reason: ${reason}`,
        priority: "high",
        status: "open",
        updated_at: new Date(),
      } as Prisma.support_ticketsUncheckedCreateInput,
    });

    res.status(201).json({
      success: true,
      message: "Refund request created successfully",
      data: {
        ticket_id: supportTicket.ticket_id,
        ticket_number: supportTicket.ticket_number,
        transaction_id: transaction.transaction_id,
        refund_amount: refundAmount,
        status: "pending_review",
      },
    });
  }
);
