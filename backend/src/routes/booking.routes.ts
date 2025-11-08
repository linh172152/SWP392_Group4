import { Router } from "express";
import {
  getUserBookings,
  createBooking,
  createInstantBooking,
  getBookingDetails,
  updateBooking,
  cancelBooking,
} from "../controllers/booking.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";

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
 *               use_subscription:
 *                 type: boolean
 *                 default: true
 *                 description: "Ưu tiên sử dụng gói đăng ký nếu driver đang có (default true). Khi false, hệ thống giữ tiền ví ngay khi đặt."
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
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       $ref: '#/components/schemas/Booking'
 *                     pricing_preview:
 *                       type: object
 *                       description: "Thông tin báo giá cho lần đổi pin này"
 *                     hold_summary:
 *                       type: object
 *                       description: "Tóm tắt tài nguyên đã giữ cho booking"
 *                       properties:
 *                         battery_code:
 *                           type: string
 *                           nullable: true
 *                           description: "Mã pin đang được giữ"
 *                         use_subscription:
 *                           type: boolean
 *                           description: "Có sử dụng gói đăng ký hay không"
 *                         subscription_unlimited:
 *                           type: boolean
 *                         subscription_remaining_after:
 *                           type: integer
 *                           nullable: true
 *                         subscription_name:
 *                           type: string
 *                           nullable: true
 *                         wallet_amount_locked:
 *                           type: number
 *                           format: float
 *                           description: "Số tiền đã trừ khỏi ví (nếu không dùng gói)"
 *                         wallet_balance_after:
 *                           type: number
 *                           nullable: true
 *                         hold_expires_at:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post("/", createBooking);

/**
 * @swagger
 * /api/driver/bookings/instant:
 *   post:
 *     summary: Create instant booking (Đổi pin ngay)
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
 *               - battery_model
 *             properties:
 *               station_id:
 *                 type: string
 *               vehicle_id:
 *                 type: string
 *               battery_model:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Instant booking created successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post("/instant", createInstantBooking);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       $ref: '#/components/schemas/Booking'
 *                     cancellation_fee:
 *                       type: number
 *                       description: "Phí hủy muộn (nếu áp dụng)"
 *                     wallet_forfeited_amount:
 *                       type: number
 *                       description: "Số tiền/gói đã bị giữ lại do driver không tới"
 *                     wallet_balance:
 *                       type: number
 *                       nullable: true
 *                       description: "Số dư ví sau khi trừ phí/forfeit"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.put("/:id/cancel", cancelBooking);

export default router;
