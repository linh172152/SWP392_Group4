import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";

const prisma = new PrismaClient();

/**
 * Get system overview
 */
export const getSystemOverview = asyncHandler(
  async (req: Request, res: Response) => {
    const { from, to } = req.query;

    const dateFilter: any = {};
    if (from && to) {
      dateFilter.gte = new Date(from as string);
      dateFilter.lte = new Date(to as string);
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.gte = thirtyDaysAgo;
    }

    // Get basic counts
    const [
      totalUsers,
      totalStations,
      totalBatteries,
      totalBookings,
      totalTransactions,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.station.count(),
      prisma.battery.count(),
      prisma.booking.count({
        where: { created_at: dateFilter },
      }),
      prisma.transaction.count({
        where: { created_at: dateFilter },
      }),
      prisma.payment.aggregate({
        where: {
          payment_status: "completed",
          created_at: dateFilter,
        },
        _sum: { amount: true },
      }),
    ]);

    // Get user breakdown by role
    const userBreakdown = await prisma.user.groupBy({
      by: ["role"],
      _count: { user_id: true },
    });

    // Get station breakdown by status
    const stationBreakdown = await prisma.station.groupBy({
      by: ["status"],
      _count: { station_id: true },
    });

    // Get battery breakdown by status
    const batteryBreakdown = await prisma.battery.groupBy({
      by: ["status"],
      _count: { battery_id: true },
    });

    // Get booking breakdown by status
    const bookingBreakdown = await prisma.booking.groupBy({
      by: ["status"],
      where: { created_at: dateFilter },
      _count: { booking_id: true },
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await prisma.transaction.findMany({
      where: {
        created_at: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    res.status(200).json({
      success: true,
      message: "System overview retrieved successfully",
      data: {
        overview: {
          total_users: totalUsers,
          total_stations: totalStations,
          total_batteries: totalBatteries,
          total_bookings: totalBookings,
          total_transactions: totalTransactions,
          total_revenue: totalRevenue._sum.amount || 0,
        },
        breakdowns: {
          users_by_role: userBreakdown,
          stations_by_status: stationBreakdown,
          batteries_by_status: batteryBreakdown,
          bookings_by_status: bookingBreakdown,
        },
        recent_activity: recentActivity,
        period: {
          from: dateFilter.gte,
          to: dateFilter.lte || new Date(),
        },
      },
    });
  }
);

/**
 * Get revenue reports
 */
export const getRevenueReports = asyncHandler(
  async (req: Request, res: Response) => {
    const { from, to, station_id } = req.query;

    const dateFilter: any = {};
    if (from && to) {
      dateFilter.gte = new Date(from as string);
      dateFilter.lte = new Date(to as string);
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.gte = thirtyDaysAgo;
    }

    const whereClause: any = {
      payment_status: "completed",
      created_at: dateFilter,
    };

    if (station_id) {
      whereClause.transaction = {
        station_id: station_id,
      };
    }

    const revenueData = await prisma.payment.findMany({
      where: whereClause,
      include: {
        transaction: {
          include: {
            station: {
              select: {
                station_id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        subscription: {
          include: {
            package: {
              select: {
                package_id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Group by date
    const groupedRevenue = revenueData.reduce(
      (acc, payment) => {
        const date = payment.created_at.toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = {
            date,
            total_amount: 0,
            transaction_count: 0,
            payments: [],
          };
        }
        acc[date].total_amount += Number(payment.amount);
        acc[date].transaction_count += 1;
        acc[date].payments.push(payment);
        return acc;
      },
      {} as Record<string, any>
    );

    const totalRevenue = revenueData.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    res.status(200).json({
      success: true,
      message: "Revenue reports retrieved successfully",
      data: {
        total_revenue: totalRevenue,
        total_transactions: revenueData.length,
        daily_breakdown: Object.values(groupedRevenue),
        period: {
          from: dateFilter.gte,
          to: dateFilter.lte || new Date(),
        },
      },
    });
  }
);

/**
 * Get usage statistics
 */
export const getUsageStatistics = asyncHandler(
  async (req: Request, res: Response) => {
    const { from, to, station_id } = req.query;

    const dateFilter: any = {};
    if (from && to) {
      dateFilter.gte = new Date(from as string);
      dateFilter.lte = new Date(to as string);
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.gte = thirtyDaysAgo;
    }

    const whereClause: any = { created_at: dateFilter };
    if (station_id) {
      whereClause.station_id = station_id;
    }

    // Get transaction statistics
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
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    // Group by hour to find peak hours
    const hourlyUsage = transactions.reduce(
      (acc, transaction) => {
        const hour = transaction.swap_at.getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );

    // Group by station
    const stationUsage = transactions.reduce(
      (acc, transaction) => {
        const stationId = transaction.station_id;
        if (!acc[stationId]) {
          acc[stationId] = {
            station_id: stationId,
            station_name: transaction.station.name,
            station_address: transaction.station.address,
            transaction_count: 0,
            total_duration: 0,
          };
        }
        acc[stationId].transaction_count += 1;
        if (transaction.swap_duration_minutes) {
          acc[stationId].total_duration += transaction.swap_duration_minutes;
        }
        return acc;
      },
      {} as Record<string, any>
    );

    // Calculate average swap duration
    const totalDuration = transactions.reduce(
      (sum, t) => sum + (t.swap_duration_minutes || 0),
      0
    );
    const averageDuration =
      transactions.length > 0 ? totalDuration / transactions.length : 0;

    res.status(200).json({
      success: true,
      message: "Usage statistics retrieved successfully",
      data: {
        total_swaps: transactions.length,
        average_duration_minutes: Math.round(averageDuration * 10) / 10,
        peak_hours: hourlyUsage,
        station_usage: Object.values(stationUsage),
        period: {
          from: dateFilter.gte,
          to: dateFilter.lte || new Date(),
        },
      },
    });
  }
);

/**
 * Get battery reports
 */
export const getBatteryReports = asyncHandler(
  async (req: Request, res: Response) => {
    const { station_id } = req.query;

    const whereClause: any = {};
    if (station_id) {
      whereClause.station_id = station_id;
    }

    const batteries = await prisma.battery.findMany({
      where: whereClause,
      include: {
        station: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    // Group by status
    const statusBreakdown = batteries.reduce(
      (acc, battery) => {
        acc[battery.status] = (acc[battery.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Group by model
    const modelBreakdown = batteries.reduce(
      (acc, battery) => {
        acc[battery.model] = (acc[battery.model] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Group by station
    const stationBreakdown = batteries.reduce(
      (acc, battery) => {
        const stationId = battery.station_id;
        if (!acc[stationId]) {
          acc[stationId] = {
            station_id: stationId,
            station_name: battery.station.name,
            station_address: battery.station.address,
            total_batteries: 0,
            full_batteries: 0,
            charging_batteries: 0,
            in_use_batteries: 0,
            maintenance_batteries: 0,
            damaged_batteries: 0,
          };
        }
        acc[stationId].total_batteries += 1;
        acc[stationId][`${battery.status}_batteries`] += 1;
        return acc;
      },
      {} as Record<string, any>
    );

    res.status(200).json({
      success: true,
      message: "Battery reports retrieved successfully",
      data: {
        total_batteries: batteries.length,
        status_breakdown: statusBreakdown,
        model_breakdown: modelBreakdown,
        station_breakdown: Object.values(stationBreakdown),
      },
    });
  }
);
