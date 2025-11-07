import { Router } from "express";
import {
  getAllBatteries,
  getBatteryById,
  createBattery,
  updateBattery,
  deleteBattery,
  getBatteryStats,
  getLowHealthBatteries,
} from "../controllers/admin-battery.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole("ADMIN"));

/**
 * @swagger
 * /api/admin/batteries:
 *   get:
 *     summary: Get all batteries (admin view - all stations)
 *     tags: [Admin - Batteries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: station_id
 *         schema:
 *           type: string
 *         description: Filter by station
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, charging, in_use, maintenance, damaged]
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Filter by battery model
 *       - in: query
 *         name: min_health
 *         schema:
 *           type: number
 *         description: Minimum health percentage
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Batteries retrieved successfully
 */
router.get("/", getAllBatteries);

/**
 * @swagger
 * /api/admin/batteries/stats:
 *   get:
 *     summary: Get battery statistics
 *     tags: [Admin - Batteries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Battery statistics retrieved
 */
router.get("/stats", getBatteryStats);

/**
 * @swagger
 * /api/admin/batteries/low-health:
 *   get:
 *     summary: Get batteries with low health
 *     tags: [Admin - Batteries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: number
 *           default: 70
 *         description: Health percentage threshold
 *     responses:
 *       200:
 *         description: Low health batteries retrieved
 */
router.get("/low-health", getLowHealthBatteries);

/**
 * @swagger
 * /api/admin/batteries/{id}:
 *   get:
 *     summary: Get battery details by ID
 *     tags: [Admin - Batteries]
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
 *       404:
 *         description: Battery not found
 */
router.get("/:id", getBatteryById);

/**
 * @swagger
 * /api/admin/batteries:
 *   post:
 *     summary: Create new battery
 *     tags: [Admin - Batteries]
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
 *               - model
 *               - battery_code
 *             properties:
 *               station_id:
 *                 type: string
 *               model:
 *                 type: string
 *               battery_code:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [available, charging, in_use, maintenance, damaged]
 *                 default: available
 *               health_percentage:
 *                 type: number
 *                 default: 100
 *               cycle_count:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       201:
 *         description: Battery created successfully
 */
router.post("/", createBattery);

/**
 * @swagger
 * /api/admin/batteries/{id}:
 *   put:
 *     summary: Update battery
 *     tags: [Admin - Batteries]
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
 *               station_id:
 *                 type: string
 *               model:
 *                 type: string
 *               battery_code:
 *                 type: string
 *               status:
 *                 type: string
 *               health_percentage:
 *                 type: number
 *               cycle_count:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Battery updated successfully
 */
router.put("/:id", updateBattery);

/**
 * @swagger
 * /api/admin/batteries/{id}:
 *   delete:
 *     summary: Delete battery
 *     tags: [Admin - Batteries]
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
 */
router.delete("/:id", deleteBattery);

export default router;
