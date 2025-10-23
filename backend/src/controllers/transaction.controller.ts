import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";

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
    if (status) {
      whereClause.payment_status = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
        vehicle: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            model: true,
          },
        },
        new_battery: {
          select: {
            battery_id: true,
            battery_code: true,
            model: true,
            capacity_kwh: true,
            current_charge: true,
          },
        },
        old_battery: {
          select: {
            battery_id: true,
            battery_code: true,
            model: true,
            capacity_kwh: true,
            current_charge: true,
          },
        },
        staff: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        payment: {
          select: {
            payment_id: true,
            amount: true,
            payment_method: true,
            payment_status: true,
            paid_at: true,
          },
        },
        station_rating: {
          select: {
            rating_id: true,
            rating: true,
            comment: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit as string),
    });

    const total = await prisma.transaction.count({ where: whereClause });

    res.status(200).json({
      success: true,
      message: "User transactions retrieved successfully",
      data: {
        transactions,
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

    const transaction = await prisma.transaction.findFirst({
      where: {
        transaction_id: id,
        user_id: userId,
      },
      include: {
        booking: {
          select: {
            booking_id: true,
            booking_code: true,
            scheduled_at: true,
            status: true,
          },
        },
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        vehicle: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            model: true,
            make: true,
            year: true,
          },
        },
        new_battery: {
          select: {
            battery_id: true,
            battery_code: true,
            model: true,
            capacity_kwh: true,
            current_charge: true,
            status: true,
          },
        },
        old_battery: {
          select: {
            battery_id: true,
            battery_code: true,
            model: true,
            capacity_kwh: true,
            current_charge: true,
            status: true,
          },
        },
        staff: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        payment: {
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
        station_rating: {
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

    res.status(200).json({
      success: true,
      message: "Transaction details retrieved successfully",
      data: transaction,
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

    const stats = await prisma.transaction.aggregate({
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

    const statusCounts = await prisma.transaction.groupBy({
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

    const monthlyStats = await prisma.transaction.groupBy({
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
    const transaction = await prisma.transaction.findFirst({
      where: {
        transaction_id,
        user_id: userId,
        payment_status: "completed",
      },
      include: {
        payment: true,
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

    const supportTicket = await prisma.supportTicket.create({
      data: {
        ticket_number: ticketNumber,
        user_id: userId,
        category: "payment_issue",
        subject: `Refund Request - Transaction ${transaction.transaction_code}`,
        description: `Refund request for transaction ${transaction.transaction_code}. Amount: ${refundAmount}. Reason: ${reason}`,
        priority: "high",
        status: "open",
      },
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
