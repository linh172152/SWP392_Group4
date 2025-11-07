import { Router } from "express";
import {
  adminCreateStaffSchedule,
  adminDeleteStaffSchedule,
  adminListStaffSchedules,
  adminUpdateStaffSchedule,
} from "../controllers/staff-schedule.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole("ADMIN"));

router.get("/", adminListStaffSchedules);
router.post("/", adminCreateStaffSchedule);
router.put("/:id", adminUpdateStaffSchedule);
router.delete("/:id", adminDeleteStaffSchedule);

export default router;

