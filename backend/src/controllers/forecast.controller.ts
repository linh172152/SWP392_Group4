import { Request, Response } from "express";
import { asyncHandler, CustomError } from "../middlewares/error.middleware";
import { prisma } from "../server";

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

export const getBookingForecast = asyncHandler(
  async (req: Request, res: Response) => {
    const { days = 14, window = 3 } = req.query;

    const historyDays = Number(days);
    const windowSize = Number(window);

    if (!Number.isFinite(historyDays) || historyDays <= 0) {
      throw new CustomError("days must be a positive number", 400);
    }

    if (!Number.isFinite(windowSize) || windowSize <= 0) {
      throw new CustomError("window must be a positive number", 400);
    }

    const today = new Date();
    const startDate = new Date(
      today.getTime() - historyDays * 24 * 60 * 60 * 1000
    );

    const bookings = await prisma.bookings.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: today,
        },
      },
      select: {
        created_at: true,
      },
    });

    const dailyCounts = new Map<string, number>();

    bookings.forEach((booking: { created_at: Date }) => {
      const key = toDateKey(booking.created_at);
      dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
    });

    const history: Array<{ date: string; count: number }> = [];
    for (let i = historyDays - 1; i >= 0; i -= 1) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const key = toDateKey(date);
      history.push({ date: key, count: dailyCounts.get(key) ?? 0 });
    }

    const lastValues = history.map((d) => d.count);
    const lookback = Math.min(windowSize, lastValues.length);
    const average = (values: number[]): number =>
      values.length === 0
        ? 0
        : values.reduce((sum, value) => sum + value, 0) / values.length;

    const baseAverage = average(lastValues.slice(-lookback));

    const forecast: Array<{ date: string; expected_count: number }> = [];
    for (let i = 1; i <= 7; i += 1) {
      const futureDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      forecast.push({
        date: futureDate.toLocaleDateString(undefined, DATE_FORMAT_OPTIONS),
        expected_count: Number(baseAverage.toFixed(2)),
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking forecast generated successfully",
      data: {
        history,
        forecast,
        metadata: {
          window_size: lookback,
          historical_days: historyDays,
        },
      },
    });
  }
);

