import { PrismaClient, User } from "@prisma/client";
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} from "../utils/bcrypt.util";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.util";
import { CustomError } from "../middlewares/error.middleware";

const prisma = new PrismaClient();

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: "DRIVER" | "STAFF" | "ADMIN";
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, "password_hash">;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenData {
  refreshToken: string;
}

/**
 * Register a new user
 */
export const registerUser = async (
  data: RegisterData
): Promise<AuthResponse> => {
  try {
    // Simple password validation (6+ characters)
    if (data.password.length < 6) {
      throw new CustomError("Password must be at least 6 characters long", 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new CustomError("User with this email already exists", 409);
    }

    // Hash password for security
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password_hash: hashedPassword,
        full_name: data.full_name,
        phone: data.phone || null,
        role: (data.role as "DRIVER" | "STAFF" | "ADMIN") || "DRIVER",
        status: "ACTIVE",
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.user_id);

    // Welcome email removed for simplicity

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;
    void password_hash;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof CustomError) {
      throw error;
    }
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new CustomError(`Registration failed: ${errorMessage}`, 500);
  }
};

/**
 * Login user
 */
export const loginUser = async (data: LoginData): Promise<AuthResponse> => {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new CustomError("Invalid email or password", 401);
    }

    // Check if account is active
    if (user.status !== "ACTIVE") {
      throw new CustomError("Account is inactive or banned", 401);
    }

    // Verify password (hash comparison)
    if (!user.password_hash) {
      throw new CustomError("Invalid email or password", 401);
    }
    const isPasswordValid = await comparePassword(
      data.password,
      user.password_hash
    );
    if (!isPasswordValid) {
      throw new CustomError("Invalid email or password", 401);
    }

    // Update last login
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { updated_at: new Date() },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.user_id);

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;
    void password_hash;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError("Login failed", 500);
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (
  data: RefreshTokenData
): Promise<{ accessToken: string }> => {
  try {
    // Verify refresh token
    const payload = verifyRefreshToken(data.refreshToken);

    // Find user
    const user = await prisma.user.findUnique({
      where: { user_id: payload.userId },
    });

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    if (user.status !== "ACTIVE") {
      throw new CustomError("Account is inactive or banned", 401);
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    return { accessToken };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError("Token refresh failed", 401);
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (
  userId: string
): Promise<Omit<User, "password_hash">> => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        station: true,
        vehicles: true,
      },
    });

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    const { password_hash, ...userWithoutPassword } = user;
    void password_hash;
    return userWithoutPassword;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError("Failed to get user profile", 500);
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updateData: Partial<Pick<User, "full_name" | "phone" | "avatar">>
): Promise<Omit<User, "password_hash">> => {
  try {
    const user = await prisma.user.update({
      where: { user_id: userId },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
    });

    const { password_hash, ...userWithoutPassword } = user;
    void password_hash;
    return userWithoutPassword;
  } catch (error) {
    throw new CustomError("Failed to update profile", 500);
  }
};

/**
 * Change password
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    // Verify current password
    if (!user.password_hash) {
      throw new CustomError("User has no password set", 400);
    }
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.password_hash
    );
    if (!isCurrentPasswordValid) {
      throw new CustomError("Current password is incorrect", 400);
    }

    // Validate new password
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new CustomError(
        `Password validation failed: ${passwordValidation.errors.join(", ")}`,
        400
      );
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { user_id: userId },
      data: {
        password_hash: hashedNewPassword,
        updated_at: new Date(),
      },
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError("Failed to change password", 500);
  }
};
