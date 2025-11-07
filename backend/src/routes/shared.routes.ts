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
 * /api/shared:
 *   get:
 *     summary: Shared API root summary
 *     description: Lists shared utilities available under the /api namespace (health, support, ratings, maps). Public station data is exposed via `/api/stations/public`.
 *     tags: [Shared]
 *     responses:
 *       200:
 *         description: Shared API overview returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 endpoints:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Shared API modules',
    endpoints: [
      '/api/shared/health',
      '/api/support',
      '/api/ratings',
      '/api/maps',
      '/api/stations/public'
    ]
  });
});

// Public shared routes summary endpoint

export default router;
