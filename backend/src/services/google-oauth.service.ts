import { PrismaClient, User } from "@prisma/client";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util";
import { CustomError } from "../middlewares/error.middleware";

const prisma = new PrismaClient();

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export interface GoogleAuthResponse {
  user: Omit<User, "password_hash">;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

/**
 * Find or create user from Google OAuth profile
 */
export const findOrCreateGoogleUser = async (
  profile: GoogleProfile
): Promise<GoogleAuthResponse> => {
  try {
    // Check if user exists by Google ID
    let user = await prisma.user.findUnique({
      where: { google_id: profile.id },
    });

    let isNewUser = false;

    if (!user) {
      // Check if user exists by email
      const existingUser = await prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingUser) {
        // Link Google account to existing user
        user = await prisma.user.update({
          where: { user_id: existingUser.user_id },
          data: {
            google_id: profile.id,
            auth_provider: "GOOGLE",
            email_verified: profile.verified_email,
            avatar: profile.picture || existingUser.avatar,
            last_login_at: new Date(),
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            google_id: profile.id,
            email: profile.email,
            full_name: profile.name,
            avatar: profile.picture,
            auth_provider: "GOOGLE",
            email_verified: profile.verified_email,
            role: "DRIVER", // Default role for new users
            status: "ACTIVE",
            last_login_at: new Date(),
          },
        });
        isNewUser = true;
      }
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { user_id: user.user_id },
        data: {
          full_name: profile.name,
          avatar: profile.picture || user.avatar,
          email_verified: profile.verified_email,
          last_login_at: new Date(),
        },
      });
    }

    // Check if account is active
    if (user.status !== "ACTIVE") {
      throw new CustomError("Account is inactive or banned", 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.user_id);

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      isNewUser,
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError("Google authentication failed", 500);
  }
};

/**
 * Get Google OAuth URL
 */
export const getGoogleAuthUrl = (): string => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new CustomError("Google OAuth configuration missing", 500);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "profile email",
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Exchange authorization code for access token
 */
export const exchangeCodeForToken = async (code: string): Promise<string> => {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      }),
    });

    if (!response.ok) {
      throw new CustomError("Failed to exchange code for token", 400);
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError("Google token exchange failed", 500);
  }
};

/**
 * Get user profile from Google
 */
export const getGoogleProfile = async (
  accessToken: string
): Promise<GoogleProfile> => {
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new CustomError("Failed to get Google profile", 400);
    }

    const profile = (await response.json()) as {
      id: string;
      email: string;
      name: string;
      picture?: string;
      verified_email: boolean;
    };

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      verified_email: profile.verified_email,
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError("Failed to get Google profile", 500);
  }
};
