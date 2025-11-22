import { Router } from "express";
import {
  getStationBookings,
  getBookingDetails,
  confirmBooking,
  completeBooking,
  cancelBooking,
  getAvailableBatteries,
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
 * /api/staff/bookings/{id}/available-batteries:
 *   get:
 *     summary: Get available batteries for a booking
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
 *         description: Available batteries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     batteries:
 *                       type: array
 *                       items:
 *                         type: object
 *                     booking:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: Booking not found
 */
router.get("/:id/available-batteries", getAvailableBatteries);

/**
 * @swagger
 * /api/staff/bookings/{id}/confirm:
 *   post:
 *     summary: Confirm booking (không cần verify phone, chỉ xác nhận booking)
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Booking confirmed successfully
 *       400:
 *         description: Invalid request
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
 *               - battery_model
 *             properties:
 *               old_battery_code:
 *                 type: string
 *                 description: "Mã pin cũ (tùy chọn). Nếu không nhập, hệ thống sẽ cố gắng tự phát hiện dựa trên lịch sử giao dịch."
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
