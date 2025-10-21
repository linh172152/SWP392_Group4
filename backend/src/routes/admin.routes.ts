import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

// Placeholder routes - will be implemented later
router.get('/users', (_req, res) => {
  res.json({ message: 'Admin users endpoint - coming soon' });
});

router.get('/stations', (_req, res) => {
  res.json({ message: 'Admin stations endpoint - coming soon' });
});

router.get('/reports', (_req, res) => {
  res.json({ message: 'Admin reports endpoint - coming soon' });
});

export default router;
