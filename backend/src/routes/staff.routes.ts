import { Router } from "express";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";

const router = Router();

// All staff routes require authentication and staff role
router.use(authenticateToken);
router.use(authorizeRole("STAFF"));

/**
 * @swagger
 * /api/staff/batteries:
 *   get:
 *     summary: Get staff batteries management
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff batteries endpoint
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
 *         description: Forbidden - Staff role required
 */
router.get("/batteries", (_req, res) => {
  res.json({ message: "Staff batteries endpoint - coming soon" });
});

/**
 * @swagger
 * /api/staff/bookings:
 *   get:
 *     summary: Get staff bookings management
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff bookings endpoint
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
 *         description: Forbidden - Staff role required
 */
router.get("/bookings", (_req, res) => {
  res.json({ message: "Staff bookings endpoint - coming soon" });
});

/**
 * @swagger
 * /api/staff/transactions:
 *   get:
 *     summary: Get staff transactions management
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff transactions endpoint
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
 *         description: Forbidden - Staff role required
 */
router.get("/transactions", (_req, res) => {
  res.json({ message: "Staff transactions endpoint - coming soon" });
});

// Placeholder routes - will be implemented later

export default router;
