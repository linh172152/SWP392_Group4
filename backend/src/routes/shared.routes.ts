import { Router } from 'express';

const router = Router();

// Public shared routes
router.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'EV Battery Swap API is running'
  });
});

// Placeholder for other shared endpoints
router.get('/stations/public', (_req, res) => {
  res.json({ message: 'Public stations endpoint - coming soon' });
});

export default router;
