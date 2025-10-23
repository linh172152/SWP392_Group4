import { Router } from "express";
import {
  findNearbyStations,
  getStationDetails,
  getStationBatteries,
  searchStations,
} from "../controllers/station.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/driver/stations/nearby:
 *   get:
 *     summary: Find nearby stations
 *     tags: [Driver - Stations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 5
 *     responses:
 *       200:
 *         description: Nearby stations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/nearby", findNearbyStations);

/**
 * @swagger
 * /api/driver/stations/search:
 *   get:
 *     summary: Search stations
 *     tags: [Driver - Stations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stations found successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/search", searchStations);

/**
 * @swagger
 * /api/driver/stations/{id}:
 *   get:
 *     summary: Get station details
 *     tags: [Driver - Stations]
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
 *         description: Station details retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Station not found
 */
router.get("/:id", getStationDetails);

/**
 * @swagger
 * /api/driver/stations/{id}/batteries:
 *   get:
 *     summary: Get station batteries
 *     tags: [Driver - Stations]
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
 *         description: Station batteries retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Station not found
 */
router.get("/:id/batteries", getStationBatteries);

// All routes require authentication
router.use(authenticateToken);

export default router;
