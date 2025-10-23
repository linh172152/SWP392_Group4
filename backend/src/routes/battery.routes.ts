import { Router } from "express";
import {
  getStationBatteries,
  addBattery,
  getBatteryDetails,
  updateBatteryStatus,
  getBatteryHistory,
  deleteBattery,
} from "../controllers/battery.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Battery:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         station_id:
 *           type: string
 *         battery_type:
 *           type: string
 *         capacity:
 *           type: number
 *         current_charge:
 *           type: number
 *         status:
 *           type: string
 *           enum: [AVAILABLE, IN_USE, CHARGING, MAINTENANCE, RETIRED]
 *         health_percentage:
 *           type: number
 *         last_charged:
 *           type: string
 *           format: date-time
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/staff/batteries:
 *   get:
 *     summary: Get station batteries
 *     tags: [Staff - Batteries]
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
 *           enum: [AVAILABLE, IN_USE, CHARGING, MAINTENANCE, RETIRED]
 *     responses:
 *       200:
 *         description: Batteries retrieved successfully
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
 *                     $ref: '#/components/schemas/Battery'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 */
router.get("/", getStationBatteries);

/**
 * @swagger
 * /api/staff/batteries:
 *   post:
 *     summary: Add new battery
 *     tags: [Staff - Batteries]
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
 *               - battery_type
 *               - capacity
 *             properties:
 *               station_id:
 *                 type: string
 *               battery_type:
 *                 type: string
 *               capacity:
 *                 type: number
 *               current_charge:
 *                 type: number
 *               health_percentage:
 *                 type: number
 *     responses:
 *       201:
 *         description: Battery added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Battery'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 */
router.post("/", addBattery);

/**
 * @swagger
 * /api/staff/batteries/{id}:
 *   get:
 *     summary: Get battery details
 *     tags: [Staff - Batteries]
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
 *         description: Battery details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Battery'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: Battery not found
 */
router.get("/:id", getBatteryDetails);

/**
 * @swagger
 * /api/staff/batteries/{id}:
 *   put:
 *     summary: Update battery status
 *     tags: [Staff - Batteries]
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
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, IN_USE, CHARGING, MAINTENANCE, RETIRED]
 *               current_charge:
 *                 type: number
 *               health_percentage:
 *                 type: number
 *     responses:
 *       200:
 *         description: Battery status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: Battery not found
 */
router.put("/:id", updateBatteryStatus);

/**
 * @swagger
 * /api/staff/batteries/{id}/history:
 *   get:
 *     summary: Get battery history
 *     tags: [Staff - Batteries]
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
 *         description: Battery history retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: Battery not found
 */
router.get("/:id/history", getBatteryHistory);

/**
 * @swagger
 * /api/staff/batteries/{id}:
 *   delete:
 *     summary: Delete battery
 *     tags: [Staff - Batteries]
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
 *         description: Battery deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Staff role required
 *       404:
 *         description: Battery not found
 */
router.delete("/:id", deleteBattery);

export default router;
