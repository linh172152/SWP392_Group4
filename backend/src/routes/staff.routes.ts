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
 * /api/staff:
 *   get:
 *     summary: Staff API root summary
 *     description: Provides an overview of staff modules available in the system. Detailed Swagger docs are defined on specific routes such as bookings, batteries, schedules, and support operations.
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff API overview returned
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
    message: "Staff API modules",
    modules: [
      "bookings",
      "batteries",
      "schedules",
      "support",
      "notifications",
    ],
  });
});

export default router;
