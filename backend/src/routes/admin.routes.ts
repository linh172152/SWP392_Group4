import { Router } from "express";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";
import batteryPricingRoutes from "./battery-pricing.routes";
import topupPackageRoutes from "./topup-package.routes";
import reportRoutes from "./report.routes";

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole("ADMIN"));

// Battery Pricing routes
router.use("/pricing", batteryPricingRoutes);

// Top-up Package routes
router.use("/topup-packages", topupPackageRoutes);

// Dashboard/Reports routes
router.use("/dashboard", reportRoutes);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get admin users management
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin users endpoint
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
 *         description: Forbidden - Admin role required
 */
router.get("/users", (_req, res) => {
  res.json({ message: "Admin users endpoint - coming soon" });
});

// ✅ Stations routes đã mount ở /api/admin/stations (use adminStationRoutes)

// ✅ Reports/Dashboard routes đã mount ở /dashboard (use reportRoutes)

// Placeholder routes - will be implemented later

export default router;
