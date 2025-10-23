import { Router } from "express";
import {
  googleAuth,
  googleCallback,
  linkGoogleAccount,
  unlinkGoogleAccount,
} from "../controllers/google-oauth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/google/auth:
 *   get:
 *     summary: Initiate Google OAuth authentication
 *     tags: [Google OAuth]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth consent screen
 */
router.get("/auth", googleAuth);

/**
 * @swagger
 * /api/google/callback:
 *   get:
 *     summary: Handle Google OAuth callback
 *     tags: [Google OAuth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OAuth callback processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                     refresh_token:
 *                       type: string
 *       400:
 *         description: OAuth callback failed
 */
router.get("/callback", googleCallback);

/**
 * @swagger
 * /api/google/link:
 *   post:
 *     summary: Link Google account to existing user
 *     tags: [Google OAuth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - google_token
 *             properties:
 *               google_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google account linked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post("/link", authenticateToken, linkGoogleAccount);

/**
 * @swagger
 * /api/google/unlink:
 *   delete:
 *     summary: Unlink Google account from user
 *     tags: [Google OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Google account unlinked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Google account not linked
 */
router.delete("/unlink", authenticateToken, unlinkGoogleAccount);

// Public routes
// Protected routes

export default router;




