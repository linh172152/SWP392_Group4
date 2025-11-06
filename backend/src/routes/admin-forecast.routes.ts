import { Router } from "express";
import { getBookingForecast } from "../controllers/forecast.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole("ADMIN"));

router.get("/bookings", getBookingForecast);

export default router;


