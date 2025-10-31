import { Router } from "express";
import {
  getAllStations,
  getStationDetails,
  createStation,
  updateStation,
  deleteStation,
} from "../controllers/admin-station.controller";
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
 * /api/admin/stations:
 *   get:
 *     summary: Get all stations
 *     tags: [Admin - Stations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, maintenance]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or address
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
 *         description: Stations retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get("/", getAllStations);

/**
 * @swagger
 * /api/admin/stations:
 *   post:
 *     summary: Create new station
 *     tags: [Admin - Stations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - capacity
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               capacity:
 *                 type: integer
 *               supported_models:
 *                 type: array
 *                 items:
 *                   type: string
 *               operating_hours:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *                 default: active
 *     responses:
 *       201:
 *         description: Station created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.post("/", createStation);

/**
 * @swagger
 * /api/admin/stations/{id}:
 *   get:
 *     summary: Get station details
 *     tags: [Admin - Stations]
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
 *         description: Station details retrieved successfully
 *       404:
 *         description: Station not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get("/:id", getStationDetails);

/**
 * @swagger
 * /api/admin/stations/{id}:
 *   put:
 *     summary: Update station
 *     tags: [Admin - Stations]
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
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               capacity:
 *                 type: integer
 *               supported_models:
 *                 type: array
 *                 items:
 *                   type: string
 *               operating_hours:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *     responses:
 *       200:
 *         description: Station updated successfully
 *       404:
 *         description: Station not found
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.put("/:id", updateStation);

/**
 * @swagger
 * /api/admin/stations/{id}:
 *   delete:
 *     summary: Delete station
 *     tags: [Admin - Stations]
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
 *         description: Station deleted successfully
 *       404:
 *         description: Station not found
 *       400:
 *         description: Cannot delete station with active bookings or staff
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.delete("/:id", deleteStation);

export default router;

