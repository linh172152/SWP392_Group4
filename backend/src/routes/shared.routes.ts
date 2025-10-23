import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/shared/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Shared]
 *     responses:
 *       200:
 *         description: API health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 message:
 *                   type: string
 */
router.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'EV Battery Swap API is running'
  });
});

/**
 * @swagger
 * /api/shared/stations/public:
 *   get:
 *     summary: Get public stations information
 *     tags: [Shared]
 *     responses:
 *       200:
 *         description: Public stations endpoint
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/stations/public', (_req, res) => {
  res.json({ message: 'Public stations endpoint - coming soon' });
});

// Public shared routes
// Placeholder for other shared endpoints

export default router;
