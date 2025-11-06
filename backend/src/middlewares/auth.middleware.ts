import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JWTPayload } from "../utils/jwt.util";
import { prisma } from "../server";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: string;
      email: string;
      role: string;
      user?: Record<string, unknown>;
    };
  }
}

/**
 * Authentication middleware - verify JWT token
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header or cookies
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // Check cookies if no header token
    if (!token && req.cookies) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    // Verify token
    const payload: JWTPayload = verifyAccessToken(token);

    // Use cached user info from JWT token instead of database query
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      user: {
        user_id: payload.userId,
        email: payload.email,
        role: payload.role,
      },
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * Authorization middleware - check user role
 */
export const authorizeRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    return next();
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token && req.cookies) {
      token = req.cookies.access_token;
    }

    if (token) {
      const payload: JWTPayload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { user_id: payload.userId },
        select: {
          user_id: true,
          email: true,
          full_name: true,
          role: true,
          status: true,
          phone: true,
          avatar: true,
          station_id: true,
        },
      });

      if (user && user.status === "ACTIVE") {
        req.user = {
          userId: user.user_id,
          email: user.email,
          role: user.role,
          user: user,
        };
      }
    }

    return next();
  } catch (error) {
    // Continue without authentication
    return next();
  }
};

/**
 * Check if user owns resource
 */
export const checkResourceOwnership = (
  resourceUserIdField: string = "user_id"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // For admin, allow access to all resources
    if (req.user.role === "ADMIN") {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId =
      req.params[resourceUserIdField] || req.body[resourceUserIdField];

    if (resourceUserId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this resource",
      });
    }

    next();
  };
};
