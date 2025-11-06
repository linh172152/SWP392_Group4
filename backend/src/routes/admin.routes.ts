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

export default router;
