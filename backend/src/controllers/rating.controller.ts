import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";
import { prisma } from "../server";
import { randomUUID } from "crypto";

/**
 * Create station rating
 */
export const createRating = asyncHandler(
  async (req: Request, res: Response) => {
    // Middleware already ensures req.user exists (authenticateToken)
    const userId = req.user!.userId;
    const { station_id, transaction_id, rating, comment } = req.body;

    if (!station_id || !transaction_id || !rating) {
      throw new CustomError(
        "Station ID, transaction ID and rating are required",
        400
      );
    }

    if (rating < 1 || rating > 5) {
      throw new CustomError("Rating must be between 1 and 5", 400);
    }

    // Check if transaction exists and belongs to user
    const transaction = await prisma.transactions.findFirst({
      where: {
        transaction_id,
        user_id: userId,
        payment_status: "completed",
      },
    });

    if (!transaction) {
      throw new CustomError("Transaction not found or not completed", 404);
    }

    // Check if already rated
    const existingRating = await prisma.station_ratings.findFirst({
      where: { transaction_id },
    });

    if (existingRating) {
      throw new CustomError("Transaction already rated", 400);
    }

    const ratingData = await prisma.station_ratings.create({
      data: {
        rating_id: randomUUID(),
        user_id: userId,
        station_id: station_id as string,
        transaction_id: transaction_id as string | null,
        rating: rating as number,
        comment: comment as string | null,
        updated_at: new Date(),
      } as Prisma.station_ratingsUncheckedCreateInput,
      include: {
        users: {
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
        transactions: {
          select: {
            transaction_id: true,
            transaction_code: true,
            swap_at: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Rating created successfully",
      data: ratingData,
    });
  }
);

/**
 * Get ratings
 */
export const getRatings = asyncHandler(async (req: Request, res: Response) => {
  const { station_id, user_id, page = 1, limit = 10 } = req.query;

  const whereClause: any = {};
  if (station_id) {
    whereClause.station_id = station_id;
  }
  if (user_id) {
    whereClause.user_id = user_id;
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const ratings = await prisma.station_ratings.findMany({
    where: whereClause,
    include: {
      users: {
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
      transactions: {
        select: {
          transaction_id: true,
          transaction_code: true,
          swap_at: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
    skip,
    take: parseInt(limit as string),
  });

  const total = await prisma.station_ratings.count({ where: whereClause });

  res.status(200).json({
    success: true,
    message: "Ratings retrieved successfully",
    data: {
      ratings,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

/**
 * Get rating details
 */
export const getRatingDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const rating = await prisma.station_ratings.findUnique({
      where: { rating_id: id },
      include: {
        users: {
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
        transactions: {
          select: {
            transaction_id: true,
            transaction_code: true,
            swap_at: true,
          },
        },
      },
    });

    if (!rating) {
      throw new CustomError("Rating not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Rating details retrieved successfully",
      data: rating,
    });
  }
);

/**
 * Update rating
 */
export const updateRating = asyncHandler(
  async (req: Request, res: Response) => {
    // Middleware already ensures req.user exists (authenticateToken)
    const userId = req.user!.userId;
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
      throw new CustomError("Rating must be between 1 and 5", 400);
    }

    const existingRating = await prisma.station_ratings.findFirst({
      where: {
        rating_id: id,
        user_id: userId,
      },
    });

    if (!existingRating) {
      throw new CustomError("Rating not found or not owned by user", 404);
    }

    const updatedRating = await prisma.station_ratings.update({
      where: { rating_id: id },
      data: {
        rating,
        comment,
      },
      include: {
        users: {
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
        transactions: {
          select: {
            transaction_id: true,
            transaction_code: true,
            swap_at: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Rating updated successfully",
      data: updatedRating,
    });
  }
);

/**
 * Delete rating
 */
export const deleteRating = asyncHandler(
  async (req: Request, res: Response) => {
    // Middleware already ensures req.user exists (authenticateToken)
    const userId = req.user!.userId;
    const { id } = req.params;

    const existingRating = await prisma.station_ratings.findFirst({
      where: {
        rating_id: id,
        user_id: userId,
      },
    });

    if (!existingRating) {
      throw new CustomError("Rating not found or not owned by user", 404);
    }

    await prisma.station_ratings.delete({
      where: { rating_id: id },
    });

    res.status(200).json({
      success: true,
      message: "Rating deleted successfully",
    });
  }
);

/**
 * Get station ratings
 */
export const getStationRatings = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const ratings = await prisma.station_ratings.findMany({
      where: { station_id: id },
      include: {
        users: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        transactions: {
          select: {
            transaction_id: true,
            transaction_code: true,
            swap_at: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit as string),
    });

    const total = await prisma.station_ratings.count({
      where: { station_id: id },
    });

    res.status(200).json({
      success: true,
      message: "Station ratings retrieved successfully",
      data: {
        ratings,
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
 * Get station rating summary
 */
export const getStationRatingSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const ratings = await prisma.station_ratings.findMany({
      where: { station_id: id },
      select: {
        rating: true,
        created_at: true,
      },
    });

    const totalRatings = ratings.length;
    const averageRating =
      totalRatings > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;

    const ratingDistribution = ratings.reduce(
      (acc, r) => {
        acc[r.rating] = (acc[r.rating] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );

    res.status(200).json({
      success: true,
      message: "Station rating summary retrieved successfully",
      data: {
        station_id: id,
        total_ratings: totalRatings,
        average_rating: Math.round(averageRating * 10) / 10,
        rating_distribution: ratingDistribution,
      },
    });
  }
);

