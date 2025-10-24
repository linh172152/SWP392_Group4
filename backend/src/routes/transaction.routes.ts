import { Router } from "express";
import {
  getUserTransactions,
  getTransactionDetails,
  getTransactionStats,
  getPendingTransactions,
  payTransaction,
  createRefundRequest,
} from "../controllers/transaction.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication and driver role
router.use(authenticateToken);
router.use(authorizeRole("DRIVER"));

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         user_id:
 *           type: string
 *         amount:
 *           type: number
 *         type:
 *           type: string
 *           enum: [PAYMENT, REFUND, REWARD]
 *         status:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, CANCELLED]
 *         description:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/driver/transactions:
 *   get:
 *     summary: Get user transactions
 *     tags: [Driver - Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PAYMENT, REFUND, REWARD]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, CANCELLED]
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
 *         description: Transactions retrieved successfully
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
 *                     $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized
 */
router.get("/", getUserTransactions);

/**
 * @swagger
 * /api/driver/transactions/pending:
 *   get:
 *     summary: Get pending transactions (need payment)
 *     tags: [Driver - Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/pending", getPendingTransactions);

/**
 * @swagger
 * /api/driver/transactions/stats:
 *   get:
 *     summary: Get transaction statistics
 *     tags: [Driver - Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transaction stats retrieved successfully
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
 *                     total_amount:
 *                       type: number
 *                     total_transactions:
 *                       type: integer
 *                     monthly_stats:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/stats", getTransactionStats);

/**
 * @swagger
 * /api/driver/transactions/{id}:
 *   get:
 *     summary: Get transaction details
 *     tags: [Driver - Transactions]
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
 *         description: Transaction details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Transaction not found
 */
router.get("/:id", getTransactionDetails);

/**
 * @swagger
 * /api/driver/transactions/refund:
 *   post:
 *     summary: Create refund request
 *     tags: [Driver - Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transaction_id
 *               - reason
 *             properties:
 *               transaction_id:
 *                 type: string
 *               reason:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Refund request created successfully
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
 *                     refund_id:
 *                       type: string
 *                     status:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
/**
 * @swagger
 * /api/driver/transactions/{id}/pay:
 *   post:
 *     summary: Pay for transaction
 *     tags: [Driver - Transactions]
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
 *               payment_method:
 *                 type: string
 *                 enum: [vnpay, cash, momo]
 *                 default: vnpay
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Transaction not found
 */
router.post("/:id/pay", payTransaction);

router.post("/refund", createRefundRequest);

export default router;
