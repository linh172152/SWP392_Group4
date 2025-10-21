import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// All staff routes require authentication and staff role
router.use(authenticateToken);
router.use(authorizeRole('STAFF'));

// Placeholder routes - will be implemented later
router.get('/batteries', (_req, res) => {
  res.json({ message: 'Staff batteries endpoint - coming soon' });
});

router.get('/bookings', (_req, res) => {
  res.json({ message: 'Staff bookings endpoint - coming soon' });
});

router.get('/transactions', (_req, res) => {
  res.json({ message: 'Staff transactions endpoint - coming soon' });
});

export default router;
