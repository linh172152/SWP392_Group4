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

router.use(authenticateToken);
router.use(authorizeRole("ADMIN"));

router.get("/", getStationBatteries);
router.post("/", addBattery);
router.get("/:id", getBatteryDetails);
router.put("/:id", updateBatteryStatus);
router.get("/:id/history", getBatteryHistory);
router.delete("/:id", deleteBattery);

export default router;

