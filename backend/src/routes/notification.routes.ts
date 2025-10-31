import { Router } from "express";
import {
  authenticateToken,
} from "../middlewares/auth.middleware";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notification.controller";

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/driver/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Driver, Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", getNotifications);

/**
 * @swagger
 * /api/driver/notifications/:id/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Driver, Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
router.put("/:id/read", markNotificationAsRead);

/**
 * @swagger
 * /api/driver/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Driver, Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put("/read-all", markAllNotificationsAsRead);

export default router;

