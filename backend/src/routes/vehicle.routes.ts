import { Router } from "express";
import {
  getUserVehicles,
  addVehicle,
  getVehicleDetails,
  updateVehicle,
  deleteVehicle,
} from "../controllers/vehicle.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     Vehicle:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         user_id:
 *           type: string
 *         license_plate:
 *           type: string
 *         vehicle_type:
 *           type: string
 *           enum: [MOTORBIKE, CAR, TRUCK]
 *         brand:
 *           type: string
 *         model:
 *           type: string
 *         year:
 *           type: number
 *         battery_capacity:
 *           type: number
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/driver/vehicles:
 *   get:
 *     summary: Get user vehicles
 *     tags: [Driver - Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicles retrieved successfully
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
 *                     $ref: '#/components/schemas/Vehicle'
 *       401:
 *         description: Unauthorized
 */
router.get("/", getUserVehicles);

/**
 * @swagger
 * /api/driver/vehicles:
 *   post:
 *     summary: Add new vehicle
 *     tags: [Driver - Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - license_plate
 *               - vehicle_type
 *               - brand
 *               - model
 *             properties:
 *               license_plate:
 *                 type: string
 *               vehicle_type:
 *                 type: string
 *                 enum: [MOTORBIKE, CAR, TRUCK]
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: number
 *               battery_capacity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Vehicle added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vehicle'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post("/", addVehicle);

/**
 * @swagger
 * /api/driver/vehicles/{id}:
 *   get:
 *     summary: Get vehicle details
 *     tags: [Driver - Vehicles]
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
 *         description: Vehicle details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vehicle'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 */
router.get("/:id", getVehicleDetails);

/**
 * @swagger
 * /api/driver/vehicles/{id}:
 *   put:
 *     summary: Update vehicle
 *     tags: [Driver - Vehicles]
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
 *               license_plate:
 *                 type: string
 *               vehicle_type:
 *                 type: string
 *                 enum: [MOTORBIKE, CAR, TRUCK]
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: number
 *               battery_capacity:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 */
router.put("/:id", updateVehicle);

/**
 * @swagger
 * /api/driver/vehicles/{id}:
 *   delete:
 *     summary: Delete vehicle
 *     tags: [Driver - Vehicles]
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
 *         description: Vehicle deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 */
router.delete("/:id", deleteVehicle);

export default router;
