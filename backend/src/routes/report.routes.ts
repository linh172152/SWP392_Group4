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

router.get("/overview", getSystemOverview);
router.get("/revenue", getRevenueReports);
router.get("/usage", getUsageStatistics);
router.get("/batteries", getBatteryReports);

export default router;
