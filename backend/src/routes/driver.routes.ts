import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// All driver routes require authentication and driver role
router.use(authenticateToken);
router.use(authorizeRole('DRIVER'));

// Placeholder routes - will be implemented later
router.get('/vehicles', (_req, res) => {
  res.json({ message: 'Driver vehicles endpoint - coming soon' });
});

router.get('/stations', (_req, res) => {
  res.json({ message: 'Driver stations endpoint - coming soon' });
});

router.get('/bookings', (_req, res) => {
  res.json({ message: 'Driver bookings endpoint - coming soon' });
});

export default router;
