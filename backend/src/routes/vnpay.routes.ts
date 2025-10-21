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

// Public routes (VNPay callbacks)
router.get('/return', handleReturn);
router.post('/ipn', handleIPN);

// Test route (public for testing)
router.get('/test', testVNPay);

// Protected routes
router.post('/create', authenticateToken, createPayment);
router.get('/history', authenticateToken, getPaymentHistory);
router.get('/:paymentId', authenticateToken, getPayment);

export default router;



