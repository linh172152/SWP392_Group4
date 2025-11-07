import { Router } from "express";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";
import {
  getBatteryPricing,
  getBatteryPricingById,
  createBatteryPricing,
  updateBatteryPricing,
  deleteBatteryPricing,
} from "../controllers/battery-pricing.controller";

const router = Router();

// All pricing routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole("ADMIN"));

/**
 * @swagger
 * /api/admin/pricing:
 *   get:
 *     summary: Get all battery pricing
 *     tags: [Admin, Battery Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Battery pricing retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", getBatteryPricing);

/**
 * @swagger
 * /api/admin/pricing/:id:
 *   get:
 *     summary: Get battery pricing by ID
 *     tags: [Admin, Battery Pricing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Battery pricing retrieved successfully
 *       404:
 *         description: Battery pricing not found
 */
router.get("/:id", getBatteryPricingById);

/**
 * @swagger
 * /api/admin/pricing:
 *   post:
 *     summary: Create battery pricing
 *     tags: [Admin, Battery Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - battery_model
 *               - price
 *             properties:
 *               battery_model:
 *                 type: string
 *               price:
 *                 type: number
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Battery pricing created successfully
 *       400:
 *         description: Bad request
 */
router.post("/", createBatteryPricing);

/**
 * @swagger
 * /api/admin/pricing/:id:
 *   put:
 *     summary: Update battery pricing
 *     tags: [Admin, Battery Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               battery_model:
 *                 type: string
 *               price:
 *                 type: number
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Battery pricing updated successfully
 *       404:
 *         description: Battery pricing not found
 */
router.put("/:id", updateBatteryPricing);

/**
 * @swagger
 * /api/admin/pricing/:id:
 *   delete:
 *     summary: Delete battery pricing
 *     tags: [Admin, Battery Pricing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Battery pricing deleted successfully
 *       404:
 *         description: Battery pricing not found
 */
router.delete("/:id", deleteBatteryPricing);

export default router;
