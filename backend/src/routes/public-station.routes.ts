import { Router } from "express";
import {
  getPublicStations,
  getPublicStationDetails,
  findNearbyPublicStations,
} from "../controllers/public-station.controller";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PublicStation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *         available_batteries:
 *           type: integer
 *         total_batteries:
 *           type: integer
 */

/**
 * @swagger
 * /api/stations/public:
 *   get:
 *     summary: Get all public stations
 *     tags: [Public - Stations]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE]
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
 *         description: Public stations retrieved successfully
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
 *                     $ref: '#/components/schemas/PublicStation'
 */
router.get("/", getPublicStations);

/**
 * @swagger
 * /api/stations/public/nearby:
 *   get:
 *     summary: Find nearby public stations
 *     tags: [Public - Stations]
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
 *                     $ref: '#/components/schemas/PublicStation'
 *       400:
 *         description: Bad request - Missing coordinates
 */
router.get("/nearby", findNearbyPublicStations);

/**
 * @swagger
 * /api/stations/public/{id}:
 *   get:
 *     summary: Get public station details
 *     tags: [Public - Stations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Station details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PublicStation'
 *       404:
 *         description: Station not found
 */
router.get("/:id", getPublicStationDetails);

// Public station routes (no authentication required)

export default router;
