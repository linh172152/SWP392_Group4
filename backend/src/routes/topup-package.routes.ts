import { Router } from "express";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";
import {
  getTopUpPackages,
  getTopUpPackageById,
  createTopUpPackage,
  updateTopUpPackage,
  deleteTopUpPackage,
} from "../controllers/topup-package.controller";

const router = Router();

// All top-up package routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole("ADMIN"));

/**
 * @swagger
 * /api/admin/topup-packages:
 *   get:
 *     summary: Get all top-up packages
 *     tags: [Admin, TopUp Package]
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
 *         description: Top-up packages retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", getTopUpPackages);

/**
 * @swagger
 * /api/admin/topup-packages/:id:
 *   get:
 *     summary: Get top-up package by ID
 *     tags: [Admin, TopUp Package]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top-up package retrieved successfully
 *       404:
 *         description: Top-up package not found
 */
router.get("/:id", getTopUpPackageById);

/**
 * @swagger
 * /api/admin/topup-packages:
 *   post:
 *     summary: Create top-up package
 *     tags: [Admin, TopUp Package]
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
 *               - topup_amount
 *               - bonus_amount
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               topup_amount:
 *                 type: number
 *               bonus_amount:
 *                 type: number
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Top-up package created successfully
 *       400:
 *         description: Bad request
 */
router.post("/", createTopUpPackage);

/**
 * @swagger
 * /api/admin/topup-packages/:id:
 *   put:
 *     summary: Update top-up package
 *     tags: [Admin, TopUp Package]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               topup_amount:
 *                 type: number
 *               bonus_amount:
 *                 type: number
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Top-up package updated successfully
 *       404:
 *         description: Top-up package not found
 */
router.put("/:id", updateTopUpPackage);

/**
 * @swagger
 * /api/admin/topup-packages/:id:
 *   delete:
 *     summary: Delete top-up package
 *     tags: [Admin, TopUp Package]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top-up package deleted successfully
 *       404:
 *         description: Top-up package not found
 */
router.delete("/:id", deleteTopUpPackage);

export default router;
