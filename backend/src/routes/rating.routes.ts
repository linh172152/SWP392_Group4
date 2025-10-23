import { Router } from "express";
import {
  createRating,
  getRatings,
  getRatingDetails,
  updateRating,
  deleteRating,
  getStationRatings,
  getStationRatingSummary,
} from "../controllers/rating.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Rating:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         user_id:
 *           type: string
 *         station_id:
 *           type: string
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     RatingSummary:
 *       type: object
 *       properties:
 *         average_rating:
 *           type: number
 *         total_ratings:
 *           type: integer
 *         rating_distribution:
 *           type: object
 *           properties:
 *             "1":
 *               type: integer
 *             "2":
 *               type: integer
 *             "3":
 *               type: integer
 *             "4":
 *               type: integer
 *             "5":
 *               type: integer
 */

/**
 * @swagger
 * /api/ratings:
 *   get:
 *     summary: Get all ratings
 *     tags: [Ratings]
 *     parameters:
 *       - in: query
 *         name: station_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
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
 *         description: Ratings retrieved successfully
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
 *                     $ref: '#/components/schemas/Rating'
 */
router.get("/", getRatings);

/**
 * @swagger
 * /api/ratings:
 *   post:
 *     summary: Create rating
 *     tags: [Ratings]
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
 *               - rating
 *             properties:
 *               station_id:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rating created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Rating'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post("/", authenticateToken, createRating);

/**
 * @swagger
 * /api/ratings/{id}:
 *   get:
 *     summary: Get rating details
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rating details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Rating'
 *       404:
 *         description: Rating not found
 */
router.get("/:id", getRatingDetails);

/**
 * @swagger
 * /api/ratings/{id}:
 *   put:
 *     summary: Update rating
 *     tags: [Ratings]
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
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rating updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Rating not found
 */
router.put("/:id", authenticateToken, updateRating);

/**
 * @swagger
 * /api/ratings/{id}:
 *   delete:
 *     summary: Delete rating
 *     tags: [Ratings]
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
 *         description: Rating deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Rating not found
 */
router.delete("/:id", authenticateToken, deleteRating);

/**
 * @swagger
 * /api/ratings/stations/{id}:
 *   get:
 *     summary: Get station ratings
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Station ratings retrieved successfully
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
 *                     $ref: '#/components/schemas/Rating'
 *       404:
 *         description: Station not found
 */
router.get("/stations/:id", getStationRatings);

/**
 * @swagger
 * /api/ratings/stations/{id}/summary:
 *   get:
 *     summary: Get station rating summary
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Station rating summary retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RatingSummary'
 *       404:
 *         description: Station not found
 */
router.get("/stations/:id/summary", getStationRatingSummary);

// Public routes (no auth required)
// Authenticated routes

export default router;
