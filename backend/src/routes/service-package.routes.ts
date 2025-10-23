import { Router } from "express";
import {
  getServicePackages,
  getServicePackageDetails,
  createServicePackage,
  updateServicePackage,
  deleteServicePackage,
} from "../controllers/service-package.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { authorizeRole } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ServicePackage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         duration_months:
 *           type: integer
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/packages:
 *   get:
 *     summary: Get all service packages
 *     tags: [Service Packages]
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Service packages retrieved successfully
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
 *                     $ref: '#/components/schemas/ServicePackage'
 */
router.get("/", getServicePackages);

/**
 * @swagger
 * /api/packages:
 *   post:
 *     summary: Create service package
 *     tags: [Service Packages]
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
 *               - description
 *               - price
 *               - duration_months
 *               - features
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               duration_months:
 *                 type: integer
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Service package created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ServicePackage'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       400:
 *         description: Bad request
 */
router.post(
  "/",
  authenticateToken,
  authorizeRole("ADMIN"),
  createServicePackage
);

/**
 * @swagger
 * /api/packages/{id}:
 *   get:
 *     summary: Get service package details
 *     tags: [Service Packages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service package details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ServicePackage'
 *       404:
 *         description: Service package not found
 */
router.get("/:id", getServicePackageDetails);

/**
 * @swagger
 * /api/packages/{id}:
 *   put:
 *     summary: Update service package
 *     tags: [Service Packages]
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
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               duration_months:
 *                 type: integer
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Service package updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Service package not found
 */
router.put(
  "/:id",
  authenticateToken,
  authorizeRole("ADMIN"),
  updateServicePackage
);

/**
 * @swagger
 * /api/packages/{id}:
 *   delete:
 *     summary: Delete service package
 *     tags: [Service Packages]
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
 *         description: Service package deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Service package not found
 */
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole("ADMIN"),
  deleteServicePackage
);

// Public routes (no auth required)
// Admin only routes

export default router;
