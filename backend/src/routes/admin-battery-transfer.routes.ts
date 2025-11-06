import { Router } from "express";
import {
  createBatteryTransfer,
  getBatteryTransferDetails,
  getBatteryTransfers,
} from "../controllers/battery-transfer.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole("ADMIN"));

router.post("/", createBatteryTransfer);
router.get("/", getBatteryTransfers);
router.get("/:id", getBatteryTransferDetails);

export default router;
