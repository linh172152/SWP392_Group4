import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// Staff and Admin only
router.get('/', authenticate, authorize(['STAFF', 'ADMIN']), (req, res) => {
  res.json({
    success: true,
    message: 'Get all batteries',
    data: [],
  });
});

router.get('/:id', authenticate, authorize(['STAFF', 'ADMIN']), (req, res) => {
  res.json({
    success: true,
    message: `Get battery ${req.params.id}`,
  });
});

router.post('/', authenticate, authorize(['ADMIN']), (req, res) => {
  res.json({
    success: true,
    message: 'Create battery (Admin only)',
  });
});

export default router;

