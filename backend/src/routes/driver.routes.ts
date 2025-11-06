import { Router } from "express";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";
import walletRoutes from "./wallet.routes";
import notificationRoutes from "./notification.routes";
import { getTopUpPackages } from "../controllers/topup-package.controller";

const router = Router();

// All driver routes require authentication and driver role
router.use(authenticateToken);
router.use(authorizeRole("DRIVER"));

// Wallet routes
router.use("/wallet", walletRoutes);

// Notification routes
router.use("/notifications", notificationRoutes);

/**
 * @swagger
 * /api/driver/topup-packages:
 *   get:
 *     summary: Get active top-up packages (for driver wallet topup)
 *     tags: [Driver, Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status (default: true)
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
 *         description: Top-up packages retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/topup-packages", getTopUpPackages);

/**
 * @swagger
 * /api/driver/vehicles:
 *   get:
 *     summary: Get driver vehicles management
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver vehicles endpoint
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Driver role required
 */
router.get("/vehicles", (_req, res) => {
  res.json({ message: "Driver vehicles endpoint - coming soon" });
});

/**
 * @swagger
 * /api/driver/stations:
 *   get:
 *     summary: Get driver stations management
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver stations endpoint
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Driver role required
 */
router.get("/stations", (_req, res) => {
  res.json({ message: "Driver stations endpoint - coming soon" });
});

/**
 * @swagger
 * /api/driver/bookings:
 *   get:
 *     summary: Get driver bookings management
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver bookings endpoint
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Driver role required
 */
router.get("/bookings", (_req, res) => {
  res.json({ message: "Driver bookings endpoint - coming soon" });
});

// Placeholder routes - will be implemented later

export default router;
