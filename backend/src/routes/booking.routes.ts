import { Router } from "express";
import {
  getUserBookings,
  createBooking,
  getBookingDetails,
  updateBooking,
  cancelBooking,
} from "../controllers/booking.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Booking management routes
router.get("/", getUserBookings);
router.post("/", createBooking);
router.get("/:id", getBookingDetails);
router.put("/:id", updateBooking);
router.put("/:id/cancel", cancelBooking);

export default router;
