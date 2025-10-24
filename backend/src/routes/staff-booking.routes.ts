import { Router } from "express";
import {
  getStationBookings,
  getBookingDetails,
  confirmBooking,
  verifyPinCode,
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

/**
 * @swagger
 * /api/staff/bookings:
 *   get:
 *     summary: Get station bookings
 *     tags: [Staff - Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: station_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED]
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Station bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 */
router.get("/", getStationBookings);

/**
 * @swagger
 * /api/staff/bookings/{id}:
 *   get:
 *     summary: Get booking details
 *     tags: [Staff - Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: Booking not found
 */
router.get("/:id", getBookingDetails);

/**
 * @swagger
 * /api/staff/bookings/{id}/confirm:
 *   put:
 *     summary: Confirm booking
 *     tags: [Staff - Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking confirmed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: Booking not found
 */
router.put("/:id/confirm", confirmBooking);

/**
 * @swagger
 * /api/staff/bookings/{id}/complete:
 *   put:
 *     summary: Complete booking
 *     tags: [Staff - Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking completed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: Booking not found
 */
router.put("/:id/complete", completeBooking);

/**
 * @swagger
 * /api/staff/bookings/{id}/verify-pin:
 *   post:
 *     summary: Verify PIN code for booking
 *     tags: [Staff - Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pin_code:
 *                 type: string
 *                 description: PIN code provided by user
 *             required:
 *               - pin_code
 *     responses:
 *       200:
 *         description: PIN code verified successfully
 *       400:
 *         description: Invalid PIN code
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: Booking not found
 */
router.post("/:id/verify-pin", verifyPinCode);

/**
 * @swagger
 * /api/staff/bookings/{id}/cancel:
 *   put:
 *     summary: Cancel booking
 *     tags: [Staff - Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: Booking not found
 */
router.put("/:id/cancel", cancelBooking);

export default router;
