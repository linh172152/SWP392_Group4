import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// Public routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Get all stations',
    data: [],
  });
});

router.get('/:id', (req, res) => {
  res.json({
    success: true,
    message: `Get station ${req.params.id}`,
  });
});

// Admin/Staff only
router.post('/', authenticate, authorize(['ADMIN']), (req, res) => {
  res.json({
    success: true,
    message: 'Create station (Admin only)',
  });
});

router.put('/:id', authenticate, authorize(['ADMIN', 'STAFF']), (req, res) => {
  res.json({
    success: true,
    message: `Update station ${req.params.id}`,
  });
});

export default router;

