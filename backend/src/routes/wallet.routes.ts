import { Router } from "express";
import {
  getWalletBalance,
  getWalletTransactions,
  topUpWallet,
} from "../controllers/wallet.controller";

const router = Router();

/**
 * @swagger
 * /api/driver/wallet/balance:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Driver, Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/balance", getWalletBalance);

/**
 * @swagger
 * /api/driver/wallet/transactions:
 *   get:
 *     summary: Get wallet transactions history
 *     tags: [Driver, Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Wallet transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/transactions", getWalletTransactions);

/**
 * @swagger
 * /api/driver/wallet/topup:
 *   post:
 *     summary: Top up wallet
 *     tags: [Driver, Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - package_id
 *             properties:
 *               package_id:
 *                 type: string
 *               payment_method:
 *                 type: string
 *                 enum: [vnpay, momo, cash]
 *     responses:
 *       200:
 *         description: Top up initiated successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/topup", topUpWallet);

export default router;

