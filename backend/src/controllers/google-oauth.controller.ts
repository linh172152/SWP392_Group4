import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  getGoogleAuthUrl,
  exchangeCodeForToken,
  getGoogleProfile,
  findOrCreateGoogleUser,
} from "../services/google-oauth.service";
import { asyncHandler } from "../middlewares/error.middleware";

const prisma = new PrismaClient();

/**
 * Initiate Google OAuth flow
 */
export const googleAuth = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const authUrl = getGoogleAuthUrl();

    return res.status(200).json({
      success: true,
      message: "Google OAuth URL generated",
      data: {
        authUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate Google OAuth URL",
    });
  }
});

/**
 * Handle Google OAuth callback
 */
export const googleCallback = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { code } = req.query;

      if (!code || typeof code !== "string") {
        return res.status(400).json({
          success: false,
          message: "Authorization code is required",
        });
      }

      // Exchange code for access token
      const accessToken = await exchangeCodeForToken(code);

      // Get user profile from Google
      const googleProfile = await getGoogleProfile(accessToken);

      // Find or create user
      const result = await findOrCreateGoogleUser(googleProfile);

      // Set refresh token as httpOnly cookie
      res.cookie("refresh_token", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend with access token
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const redirectUrl = `${frontendUrl}/auth/callback?token=${result.accessToken}&isNewUser=${result.isNewUser}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const errorUrl = `${frontendUrl}/auth/error?message=${encodeURIComponent("Google authentication failed")}`;

      return res.redirect(errorUrl);
    }
  }
);

/**
 * Link Google account to existing user
 */
export const linkGoogleAccount = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { code } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      if (!code) {
        return res.status(400).json({
          success: false,
          message: "Authorization code is required",
        });
      }

      // Exchange code for access token
      const accessToken = await exchangeCodeForToken(code);

      // Get user profile from Google
      const googleProfile = await getGoogleProfile(accessToken);

      // Check if Google account is already linked to another user
      const existingGoogleUser = await prisma.user.findUnique({
        where: { google_id: googleProfile.id },
      });

      if (existingGoogleUser && existingGoogleUser.user_id !== userId) {
        return res.status(409).json({
          success: false,
          message: "Google account is already linked to another user",
        });
      }

      // Link Google account to current user
      const user = await prisma.user.update({
        where: { user_id: userId },
        data: {
          google_id: googleProfile.id,
          auth_provider: "GOOGLE",
          email_verified: googleProfile.verified_email,
          avatar: googleProfile.picture || undefined,
        },
      });

      const { password_hash, ...userWithoutPassword } = user;

      return res.status(200).json({
        success: true,
        message: "Google account linked successfully",
        data: { user: userWithoutPassword },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to link Google account",
      });
    }
  }
);

/**
 * Unlink Google account from user
 */
export const unlinkGoogleAccount = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Check if user has password (can't unlink if no other auth method)
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.password_hash) {
        return res.status(400).json({
          success: false,
          message: "Cannot unlink Google account. Please set a password first.",
        });
      }

      // Unlink Google account
      const updatedUser = await prisma.user.update({
        where: { user_id: userId },
        data: {
          google_id: null,
          auth_provider: "EMAIL",
        },
      });

      const { password_hash, ...userWithoutPassword } = updatedUser;

      return res.status(200).json({
        success: true,
        message: "Google account unlinked successfully",
        data: { user: userWithoutPassword },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to unlink Google account",
      });
    }
  }
);
