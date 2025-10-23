import { Router } from "express";
import {
  getStationBookings,
  getBookingDetails,
  confirmBooking,
  completeBooking,
  cancelBooking,
} from "../controllers/staff-booking.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication and staff role
router.use(authenticateToken);
router.use(authorizeRole("STAFF"));

// Staff booking management routes
router.get("/", getStationBookings);
router.get("/:id", getBookingDetails);
router.put("/:id/confirm", confirmBooking);
router.put("/:id/complete", completeBooking);
router.put("/:id/cancel", cancelBooking);

export default router;
