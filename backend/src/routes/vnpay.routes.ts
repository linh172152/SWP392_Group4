import { Router } from 'express';
import {
  createPayment,
  handleReturn,
  handleIPN,
  getPaymentHistory,
  getPayment,
  testVNPay
} from '../controllers/vnpay.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/payments/vnpay/return:
 *   get:
 *     summary: VNPay payment return callback
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_TransactionStatus
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment return processed
 *       400:
 *         description: Invalid payment data
 */
router.get('/return', handleReturn);

/**
 * @swagger
 * /api/payments/vnpay/ipn:
 *   post:
 *     summary: VNPay IPN (Instant Payment Notification)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: IPN processed successfully
 */
router.post('/ipn', handleIPN);

/**
 * @swagger
 * /api/payments/vnpay/test:
 *   get:
 *     summary: Test VNPay integration
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: VNPay test successful
 */
router.get('/test', testVNPay);

/**
 * @swagger
 * /api/payments/vnpay/create:
 *   post:
 *     summary: Create VNPay payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - orderInfo
 *             properties:
 *               amount:
 *                 type: number
 *               orderInfo:
 *                 type: string
 *               returnUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment URL created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/create', authenticateToken, createPayment);

/**
 * @swagger
 * /api/payments/vnpay/history:
 *   get:
 *     summary: Get payment history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment history retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/history', authenticateToken, getPaymentHistory);

/**
 * @swagger
 * /api/payments/vnpay/{paymentId}:
 *   get:
 *     summary: Get payment details
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 */
router.get('/:paymentId', authenticateToken, getPayment);

export default router;








