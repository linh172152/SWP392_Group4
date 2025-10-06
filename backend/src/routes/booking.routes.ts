import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// Driver routes
router.get('/my-bookings', authenticate, authorize(['DRIVER']), (req, res) => {
  res.json({
    success: true,
    message: 'Get my bookings',
    data: [],
  });
});

router.post('/', authenticate, authorize(['DRIVER']), (req, res) => {
  res.json({
    success: true,
    message: 'Create booking',
  });
});

router.put('/:id/cancel', authenticate, authorize(['DRIVER']), (req, res) => {
  res.json({
    success: true,
    message: `Cancel booking ${req.params.id}`,
  });
});

// Staff routes
router.post('/:id/checkin', authenticate, authorize(['STAFF']), (req, res) => {
  res.json({
    success: true,
    message: `Check-in booking ${req.params.id}`,
  });
});

// Admin/Staff routes
router.get('/', authenticate, authorize(['STAFF', 'ADMIN']), (req, res) => {
  res.json({
    success: true,
    message: 'Get all bookings',
    data: [],
  });
});

export default router;

