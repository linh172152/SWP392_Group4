import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";

const prisma = new PrismaClient();

/**
 * Get Admin Dashboard Stats
 * GET /api/admin/dashboard/stats
 */
export const getDashboardStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { period = "month" } = req.query; // month, week, day

    const now = new Date();
    let periodStart: Date;
    let previousPeriodStart: Date;

    // Calculate period based on query
    switch (period) {
      case "day": {
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousPeriodStart = new Date(
          periodStart.getTime() - 24 * 60 * 60 * 1000
        );
        break;
      }
      case "week": {
        const dayOfWeek = now.getDay();
        periodStart = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        periodStart.setHours(0, 0, 0, 0);
        previousPeriodStart = new Date(
          periodStart.getTime() - 7 * 24 * 60 * 60 * 1000
        );
        break;
      }
      case "month":
      default: {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      }
    }

    // ============================================
    // REVENUE STATS
    // ============================================
    const [currentRevenue, previousRevenue, revenueByMethod] = await Promise.all([
      // Current period revenue
      prisma.payments.aggregate({
        where: {
          payment_status: "completed",
          created_at: { gte: periodStart },
        },
        _sum: { amount: true },
        _count: { payment_id: true },
      }),
      // Previous period revenue
      prisma.payments.aggregate({
        where: {
          payment_status: "completed",
          created_at: {
            gte: previousPeriodStart,
            lt: periodStart,
          },
        },
        _sum: { amount: true },
      }),
      // Revenue by payment method
      prisma.payments.groupBy({
        by: ["payment_method"],
        where: {
          payment_status: "completed",
          created_at: { gte: periodStart },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = Number(currentRevenue._sum.amount || 0);
    const previousTotalRevenue = Number(previousRevenue._sum.amount || 0);
    const revenueTrend =
      previousTotalRevenue > 0
        ? `${((totalRevenue - previousTotalRevenue) / previousTotalRevenue * 100).toFixed(1)}%`
        : "N/A";

    const daysInPeriod = period === "day" ? 1 : period === "week" ? 7 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyAverage = totalRevenue / daysInPeriod;

    const revenueByMethodObj = revenueByMethod.reduce(
      (acc: Record<string, number>, item: { payment_method: string; _sum: { amount: any } }) => {
        acc[item.payment_method] = Number(item._sum.amount || 0);
        return acc;
      },
      {} as Record<string, number>
    );

    // ============================================
    // BOOKINGS STATS
    // ============================================
    const [bookingsStats, previousBookingsStats] = await Promise.all([
      prisma.bookings.groupBy({
        by: ["status"],
        where: { created_at: { gte: periodStart } },
        _count: { booking_id: true },
      }),
      prisma.bookings.groupBy({
        by: ["status"],
        where: {
          created_at: {
            gte: previousPeriodStart,
            lt: periodStart,
          },
        },
        _count: { booking_id: true },
      }),
    ]);

    const bookingsObj = bookingsStats.reduce(
      (acc, item) => {
        acc[item.status] = item._count.booking_id;
        return acc;
      },
      {} as Record<string, number>
    );

    const previousBookingsObj = previousBookingsStats.reduce(
      (acc, item) => {
        acc[item.status] = item._count.booking_id;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalBookings = Object.values(bookingsObj).reduce((sum, count) => sum + count, 0);
    const previousTotalBookings = Object.values(previousBookingsObj).reduce((sum, count) => sum + count, 0);
    const bookingsTrend =
      previousTotalBookings > 0
        ? `${((totalBookings - previousTotalBookings) / previousTotalBookings * 100).toFixed(1)}%`
        : "N/A";

    const cancellationRate =
      totalBookings > 0
        ? ((bookingsObj.cancelled || 0) / totalBookings * 100).toFixed(1)
        : "0";

    // ============================================
    // TRANSACTIONS STATS
    // ============================================
    const transactionsStats = await prisma.transactions.aggregate({
      where: { created_at: { gte: periodStart } },
      _count: { transaction_id: true },
      _avg: { amount: true },
      _sum: { amount: true },
    });

    // Get battery models for transactions
    const transactionsWithBatteries = await prisma.transactions.findMany({
      where: { created_at: { gte: periodStart } },
      include: {
        bookings: {
          select: { battery_model: true },
        },
      },
    });

    const transactionsByModelObj = transactionsWithBatteries.reduce(
      (acc, txn) => {
        const model = txn.bookings.battery_model;
        if (!acc[model]) {
          acc[model] = { count: 0, total: 0 };
        }
        acc[model].count += 1;
        acc[model].total += Number(txn.amount || 0);
        return acc;
      },
      {} as Record<string, { count: number; total: number }>
    );

    // ============================================
    // STATIONS STATS
    // ============================================
    const [stationsStats, mostPopularStation] = await Promise.all([
      prisma.stations.groupBy({
        by: ["status"],
        _count: { station_id: true },
      }),
      prisma.bookings.groupBy({
        by: ["station_id"],
        where: { created_at: { gte: periodStart } },
        _count: { booking_id: true },
        orderBy: { _count: { booking_id: "desc" } },
        take: 1,
      }),
    ]);

    const activeStations = stationsStats.find((s: { status: string; _count: { station_id: number } }) => s.status === "active")?._count.station_id || 0;
    
    let mostPopularStationData = null;
    if (mostPopularStation.length > 0) {
      const station = await prisma.stations.findUnique({
        where: { station_id: mostPopularStation[0].station_id },
        select: {
          station_id: true,
          name: true,
          address: true,
        },
      });
      if (station) {
        mostPopularStationData = {
          station_id: station.station_id,
          name: station.name,
          bookings_count: mostPopularStation[0]._count.booking_id,
        };
      }
    }

    // ============================================
    // USERS STATS
    // ============================================
    const [totalUsers, newUsersThisPeriod] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({
        where: {
          created_at: { gte: periodStart },
        },
      }),
    ]);

    // Active users (users who made at least 1 booking this period)
    const activeUsersThisPeriod = await prisma.users.count({
      where: {
        bookings_bookings_user_idTousers: {
          some: {
            created_at: { gte: periodStart },
          },
        },
      },
    });

    // ============================================
    // PERIOD FORMAT
    // ============================================
    const periodFormat =
      period === "day"
        ? now.toISOString().split("T")[0]
        : period === "week"
        ? `${periodStart.toISOString().split("T")[0]} - ${now.toISOString().split("T")[0]}`
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    res.status(200).json({
      success: true,
      message: "Dashboard stats retrieved successfully",
      data: {
        period: periodFormat,
        revenue: {
          total: totalRevenue,
          by_payment_method: {
            wallet: revenueByMethodObj.wallet || 0,
            cash: revenueByMethodObj.cash || 0,
            vnpay: revenueByMethodObj.vnpay || 0,
            momo: revenueByMethodObj.momo || 0,
          },
          trend: revenueTrend,
          daily_average: Math.round(dailyAverage),
        },
        bookings: {
          total: totalBookings,
          completed: bookingsObj.completed || 0,
          cancelled: bookingsObj.cancelled || 0,
          pending: bookingsObj.pending || 0,
          confirmed: bookingsObj.confirmed || 0,
          cancellation_rate: `${cancellationRate}%`,
          trend: bookingsTrend,
        },
        transactions: {
          total: transactionsStats._count.transaction_id,
          average_amount: Math.round(Number(transactionsStats._avg.amount || 0)),
          by_battery_model: Object.entries(transactionsByModelObj).reduce(
            (acc, [model, data]) => {
              acc[model] = data.count;
              return acc;
            },
            {} as Record<string, number>
          ),
        },
        stations: {
          active: activeStations,
          total_bookings: totalBookings,
          most_popular: mostPopularStationData,
        },
        users: {
          total: totalUsers,
          active_this_month: activeUsersThisPeriod,
          new_this_month: newUsersThisPeriod,
        },
      },
    });
  }
);

