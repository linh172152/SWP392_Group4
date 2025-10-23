import { Router } from "express";
import {
  getSystemOverview,
  getRevenueReports,
  getUsageStatistics,
  getBatteryReports,
} from "../controllers/report.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { authorizeRole } from "../middlewares/auth.middleware";

const router = Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(authorizeRole("ADMIN"));

/**
 * @swagger
 * /api/reports/overview:
 *   get:
 *     summary: Get system overview
 *     tags: [Admin - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: monthly
 *     responses:
 *       200:
 *         description: System overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_users:
 *                       type: integer
 *                     total_stations:
 *                       type: integer
 *                     total_bookings:
 *                       type: integer
 *                     total_revenue:
 *                       type: number
 *                     active_batteries:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get("/overview", getSystemOverview);

/**
 * @swagger
 * /api/reports/revenue:
 *   get:
 *     summary: Get revenue reports
 *     tags: [Admin - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: group_by
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: month
 *     responses:
 *       200:
 *         description: Revenue reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_revenue:
 *                       type: number
 *                     revenue_by_period:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                           revenue:
 *                             type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get("/revenue", getRevenueReports);

/**
 * @swagger
 * /api/reports/usage:
 *   get:
 *     summary: Get usage statistics
 *     tags: [Admin - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_bookings:
 *                       type: integer
 *                     completed_bookings:
 *                       type: integer
 *                     cancelled_bookings:
 *                       type: integer
 *                     average_session_duration:
 *                       type: number
 *                     peak_usage_hours:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get("/usage", getUsageStatistics);

/**
 * @swagger
 * /api/reports/batteries:
 *   get:
 *     summary: Get battery reports
 *     tags: [Admin - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: station_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, IN_USE, CHARGING, MAINTENANCE, RETIRED]
 *     responses:
 *       200:
 *         description: Battery reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_batteries:
 *                       type: integer
 *                     batteries_by_status:
 *                       type: object
 *                       properties:
 *                         AVAILABLE:
 *                           type: integer
 *                         IN_USE:
 *                           type: integer
 *                         CHARGING:
 *                           type: integer
 *                         MAINTENANCE:
 *                           type: integer
 *                         RETIRED:
 *                           type: integer
 *                     average_health:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get("/batteries", getBatteryReports);

export default router;
