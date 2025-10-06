import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// Protected routes - require authentication
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

// Admin only routes
router.get('/', authenticate, authorize(['ADMIN']), (req, res) => {
  res.json({
    success: true,
    message: 'Get all users (Admin only)',
  });
});

export default router;

