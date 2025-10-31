import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";

const prisma = new PrismaClient();

/**
 * Get user notifications
 */
export const getNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { is_read, page = 1, limit = 20 } = req.query;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const whereClause: any = { user_id: userId };
    if (is_read !== undefined) {
      whereClause.is_read = is_read === "true";
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit as string),
    });

    const total = await prisma.notification.count({
      where: whereClause,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });

    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: {
        notifications,
        unread_count: unreadCount,
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
 * Mark notification as read
 */
export const markNotificationAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const notification = await prisma.notification.findFirst({
      where: {
        notification_id: id,
        user_id: userId,
      },
    });

    if (!notification) {
      throw new CustomError("Notification not found", 404);
    }

    const updatedNotification = await prisma.notification.update({
      where: { notification_id: id },
      data: { is_read: true },
    });

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: updatedNotification,
    });
  }
);

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const result = await prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: {
        updated_count: result.count,
      },
    });
  }
);

