import { Router } from "express";
import {
  googleAuth,
  googleCallback,
  linkGoogleAccount,
  unlinkGoogleAccount,
} from "../controllers/google-oauth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// Public routes
router.get("/auth", googleAuth);
router.get("/callback", googleCallback);

// Protected routes
router.post("/link", authenticateToken, linkGoogleAccount);
router.delete("/unlink", authenticateToken, unlinkGoogleAccount);

export default router;

