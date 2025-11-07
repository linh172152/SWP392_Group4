import { Router } from "express";
import {
  adminCreatePackage,
  adminListPackages,
  adminUpdatePackage,
} from "../controllers/package.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole("ADMIN"));

/**
 * @swagger
 * /api/admin/packages:
 *   get:
 *     summary: Danh sách toàn bộ gói dịch vụ (bao gồm ngừng bán)
 *     tags: [Admin - Packages]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền ADMIN
 *   post:
 *     summary: Tạo gói dịch vụ mới
 *     tags: [Admin - Packages]
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
 *               - battery_capacity_kwh
 *               - duration_days
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               battery_capacity_kwh:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *               duration_days:
 *                 type: integer
 *                 minimum: 1
 *               price:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *               billing_cycle:
 *                 type: string
 *                 enum: [monthly, yearly, custom]
 *                 default: monthly
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_active:
 *                 type: boolean
 *                 default: true
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       201:
 *         description: Tạo gói thành công
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
 *                   $ref: '#/components/schemas/ServicePackage'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền ADMIN
 */
router.get("/", adminListPackages);
router.post("/", adminCreatePackage);

/**
 * @swagger
 * /api/admin/packages/{packageId}:
 *   put:
 *     summary: Cập nhật gói dịch vụ
 *     tags: [Admin - Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packageId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của gói cần cập nhật
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
 *               battery_capacity_kwh:
 *                 type: number
 *                 format: float
 *               duration_days:
 *                 type: integer
 *               price:
 *                 type: number
 *                 format: float
 *               billing_cycle:
 *                 type: string
 *                 enum: [monthly, yearly, custom]
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_active:
 *                 type: boolean
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
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
 *                   $ref: '#/components/schemas/ServicePackage'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc packageId thiếu
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền ADMIN
 *       404:
 *         description: Không tìm thấy gói
 *   patch:
 *     summary: Cập nhật một phần thông tin gói dịch vụ
 *     tags: [Admin - Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packageId
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Chỉ gửi các trường cần cập nhật
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               battery_capacity_kwh:
 *                 type: number
 *                 format: float
 *               duration_days:
 *                 type: integer
 *               price:
 *                 type: number
 *                 format: float
 *               billing_cycle:
 *                 type: string
 *                 enum: [monthly, yearly, custom]
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_active:
 *                 type: boolean
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền ADMIN
 *       404:
 *         description: Không tìm thấy gói
 */
router.put("/:packageId", adminUpdatePackage);
router.patch("/:packageId", adminUpdatePackage);

export default router;







