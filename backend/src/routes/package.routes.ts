import { Router } from "express";
import { getPublicPackages } from "../controllers/package.controller";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ServicePackage:
 *       type: object
 *       properties:
 *         package_id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         battery_capacity_kwh:
 *           type: number
 *           format: float
 *         duration_days:
 *           type: integer
 *         price:
 *           type: number
 *           format: float
 *         billing_cycle:
 *           type: string
 *           enum: [monthly, yearly, custom]
 *         benefits:
 *           type: array
 *           items:
 *             type: string
 *           nullable: true
 *         swap_limit:
 *           type: integer
 *           nullable: true
 *         metadata:
 *           type: object
 *           additionalProperties: true
 *           nullable: true
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/packages:
 *   get:
 *     summary: Danh sách gói dịch vụ đang mở bán
 *     tags: [Public - Packages]
 *     parameters:
 *       - in: query
 *         name: capacity
 *         schema:
 *           type: number
 *         description: Lọc theo dung lượng pin (kWh)
 *     responses:
 *       200:
 *         description: Lấy danh sách gói thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ServicePackage'
 *       400:
 *         description: Tham số không hợp lệ
 */
router.get("/", getPublicPackages);

export default router;
