import { Router } from "express";
import {
  getUserBookings,
  createBooking,
  getBookingDetails,
  updateBooking,
  cancelBooking,
} from "../controllers/booking.controller";
import { authenticateToken, authorizeRole } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication and driver role
router.use(authenticateToken);
router.use(authorizeRole("DRIVER"));

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         user_id:
 *           type: string
 *         station_id:
 *           type: string
 *         vehicle_id:
 *           type: string
 *         scheduled_at:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED]
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/driver/bookings:
 *   get:
 *     summary: Get user bookings
 *     tags: [Driver - Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
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
 */
router.get("/", getUserBookings);

/**
 * @swagger
 * /api/driver/bookings:
 *   post:
 *     summary: Create new booking
 *     tags: [Driver - Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - station_id
 *               - vehicle_id
 *               - scheduled_at
 *             properties:
 *               station_id:
 *                 type: string
 *               vehicle_id:
 *                 type: string
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
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
 *       400:
 *         description: Bad request
 */
router.post("/", createBooking);

/**
 * @swagger
 * /api/driver/bookings/{id}:
 *   get:
 *     summary: Get booking details
 *     tags: [Driver - Bookings]
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
 *       404:
 *         description: Booking not found
 */
router.get("/:id", getBookingDetails);

/**
 * @swagger
 * /api/driver/bookings/{id}:
 *   put:
 *     summary: Update booking
 *     tags: [Driver - Bookings]
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
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.put("/:id", updateBooking);

/**
 * @swagger
 * /api/driver/bookings/{id}/cancel:
 *   put:
 *     summary: Cancel booking
 *     tags: [Driver - Bookings]
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
 *       404:
 *         description: Booking not found
 */
router.put("/:id/cancel", cancelBooking);

export default router;
