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
 *   post:
 *     summary: Confirm booking (verify SĐT, không cần PIN)
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
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Phone number to verify user identity
 *     responses:
 *       200:
 *         description: Booking confirmed successfully
 *       400:
 *         description: Phone number does not match or invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: Booking not found
 */
router.post("/:id/confirm", confirmBooking);

/**
 * @swagger
 * /api/staff/bookings/{id}/complete:
 *   post:
 *     summary: Complete booking (dùng battery_code)
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
 *             required:
 *               - old_battery_code
 *               - battery_model
 *             properties:
 *               old_battery_code:
 *                 type: string
 *                 description: Code of the old battery being returned
 *               battery_model:
 *                 type: string
 *                 description: Model of the new battery to assign
 *               old_battery_status:
 *                 type: string
 *                 enum: [good, damaged, maintenance]
 *                 default: good
 *                 description: Status of the old battery
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       200:
 *         description: Booking completed successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: Booking not found
 */
router.post("/:id/complete", completeBooking);


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
