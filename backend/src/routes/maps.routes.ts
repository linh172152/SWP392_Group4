import { Router } from "express";
import {
  getDirections,
  getDistanceAndDuration,
  calculateDistance,
  testMaps,
} from "../controllers/maps.controller";

const router = Router();

/**
 * @swagger
 * /api/maps/directions:
 *   get:
 *     summary: Get directions from user location to station
 *     description: Returns route geometry, distance, and duration using Track-Asia Maps API
 *     tags: [Maps]
 *     parameters:
 *       - in: query
 *         name: from_lat
 *         required: true
 *         schema:
 *           type: number
 *         description: User's latitude
 *       - in: query
 *         name: from_lng
 *         required: true
 *         schema:
 *           type: number
 *         description: User's longitude
 *       - in: query
 *         name: to_lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Station's latitude
 *       - in: query
 *         name: to_lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Station's longitude
 *     responses:
 *       200:
 *         description: Directions retrieved successfully
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
 *                     from:
 *                       type: object
 *                     to:
 *                       type: object
 *                     distance:
 *                       type: number
 *                       description: Distance in kilometers
 *                     duration:
 *                       type: number
 *                       description: Duration in minutes
 *                     geometry:
 *                       type: object
 *                       description: GeoJSON geometry for map display
 *       400:
 *         description: Missing coordinates
 *       500:
 *         description: Track-Asia API error
 */
router.get("/directions", getDirections);

/**
 * @swagger
 * /api/maps/distance:
 *   get:
 *     summary: Calculate distance and duration from user to station
 *     description: Returns distance (km) and duration (minutes) using Track-Asia Directions API
 *     tags: [Maps]
 *     parameters:
 *       - in: query
 *         name: from_lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: from_lng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: to_lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: to_lng
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Distance and duration calculated successfully
 *       400:
 *         description: Missing coordinates
 */
router.get("/distance", getDistanceAndDuration);

/**
 * @swagger
 * /api/maps/calculate-distance:
 *   post:
 *     summary: Calculate straight-line distance (Haversine formula)
 *     description: Calculates straight-line distance between two points. For road distance, use /distance endpoint.
 *     tags: [Maps]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat1
 *               - lng1
 *               - lat2
 *               - lng2
 *             properties:
 *               lat1:
 *                 type: number
 *               lng1:
 *                 type: number
 *               lat2:
 *                 type: number
 *               lng2:
 *                 type: number
 *     responses:
 *       200:
 *         description: Distance calculated successfully
 */
router.post("/calculate-distance", calculateDistance);

/**
 * @swagger
 * /api/maps/test:
 *   get:
 *     summary: Test Track-Asia Maps API connection
 *     tags: [Maps]
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
 *     responses:
 *       200:
 *         description: API connection test successful
 */
router.get("/test", testMaps);

export default router;


