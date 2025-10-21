import { Request, Response } from 'express';
import { 
  registerUser, 
  loginUser, 
  refreshAccessToken, 
  getUserProfile, 
  updateUserProfile,
  changePassword,
  RegisterData,
  LoginData
} from '../services/auth.service';
import { asyncHandler } from '../middlewares/error.middleware';

/**
 * Register a new user
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, full_name, phone, role }: RegisterData = req.body;

  // Validate required fields
  if (!email || !password || !full_name) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, and full name are required'
    });
  }

  const result = await registerUser({
    email,
    password,
    full_name,
    phone,
    role
  });

  // Set refresh token as httpOnly cookie
  res.cookie('refresh_token', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: result.user,
      accessToken: result.accessToken
    }
  });
});

/**
 * Login user
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password }: LoginData = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  const result = await loginUser({ email, password });

  // Set refresh token as httpOnly cookie
  res.cookie('refresh_token', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user,
      accessToken: result.accessToken
    }
  });
});

/**
 * Refresh access token
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token not found'
    });
  }

  const result = await refreshAccessToken({ refreshToken });

  return res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: result.accessToken
    }
  });
});

/**
 * Logout user
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // Clear refresh token cookie
  res.clearCookie('refresh_token');

  return res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const user = await getUserProfile(userId);

  return res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: { user }
  });
});

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { full_name, phone, avatar } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const user = await updateUserProfile(userId, {
    full_name,
    phone,
    avatar
  });

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

/**
 * Change password
 */
export const changeUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { currentPassword, newPassword } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }

  await changePassword(userId, currentPassword, newPassword);

  return res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * Verify token endpoint
 */
export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
  // If we reach here, the token is valid (middleware already verified)
  return res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user?.user
    }
  });
});
