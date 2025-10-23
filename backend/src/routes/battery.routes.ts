import { Router } from "express";
import {
  getStationBatteries,
  addBattery,
  getBatteryDetails,
  updateBatteryStatus,
  getBatteryHistory,
  deleteBattery,
} from "../controllers/battery.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication and staff role
router.use(authenticateToken);
router.use(authorizeRole("STAFF"));

// Battery management routes
router.get("/", getStationBatteries);
router.post("/", addBattery);
router.get("/:id", getBatteryDetails);
router.put("/:id", updateBatteryStatus);
router.get("/:id/history", getBatteryHistory);
router.delete("/:id", deleteBattery);

export default router;
