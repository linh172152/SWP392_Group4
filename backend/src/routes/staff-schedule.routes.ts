import { Router } from "express";
import {
  getMyStaffSchedules,
  updateMyScheduleStatus,
} from "../controllers/staff-schedule.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole("STAFF"));

router.get("/", getMyStaffSchedules);
router.patch("/:id/status", updateMyScheduleStatus);

export default router;

