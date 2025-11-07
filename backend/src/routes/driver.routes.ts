import { Router } from "express";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";
import walletRoutes from "./wallet.routes";
import notificationRoutes from "./notification.routes";

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
 * /api/driver:
 *   get:
 *     summary: Driver API root summary
 *     description: Returns a quick overview of available driver-facing modules. Detailed documentation for each module is defined on their respective routes (wallet, vehicles, stations, bookings, transactions, subscriptions, notifications).
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver API overview returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 modules:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Driver API modules",
    modules: [
      "wallet",
      "vehicles",
      "stations",
      "bookings",
      "transactions",
      "subscriptions",
      "notifications",
    ],
  });
});

export default router;
