import { Prisma, PrismaClient, User } from "@prisma/client";
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

type VehicleWithBattery = Prisma.VehicleGetPayload<{
  include: {
    current_battery: {
      select: {
        battery_id: true;
        battery_code: true;
        status: true;
        current_charge: true;
        updated_at: true;
      };
    };
  };
}>;

type UserProfilePayload = Prisma.UserGetPayload<{
  include: {
    station: true;
    vehicles: {
      include: {
        current_battery: {
          select: {
            battery_id: true;
            battery_code: true;
            status: true;
            current_charge: true;
            updated_at: true;
          };
        };
      };
    };
  };
}>;

export type UserProfileResponse = Omit<UserProfilePayload, "password_hash"> & {
  vehicles: VehicleWithBattery[];
  swap_overview?: {
    total_swaps: number;
    subscription_swaps: number;
    wallet_swaps: number;
  };
  active_subscription?: {
    subscription_id: string;
    package_name: string | null;
    remaining_swaps: number | null;
    swap_limit: number | null;
    unlimited: boolean;
    ends_at: Date;
  };
};

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
): Promise<UserProfileResponse> => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        station: true,
        vehicles: {
          include: {
            current_battery: {
              select: {
                battery_id: true,
                battery_code: true,
                status: true,
                current_charge: true,
                updated_at: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    let swapOverview: UserProfileResponse["swap_overview"] | undefined;
    let activeSubscriptionInfo:
      | UserProfileResponse["active_subscription"]
      | undefined;

    if (user.role === "DRIVER") {
      const now = new Date();
      const [totalSwaps, subscriptionSwaps, activeSubscription] =
        await Promise.all([
          prisma.transaction.count({
            where: {
              user_id: userId,
            },
          }),
          prisma.transaction.count({
            where: {
              user_id: userId,
              booking: {
                use_subscription: true,
              },
            },
          }),
          prisma.userSubscription.findFirst({
            where: {
              user_id: userId,
              status: "active",
              start_date: { lte: now },
              end_date: { gte: now },
            },
            include: { package: true },
            orderBy: { created_at: "desc" },
          }),
        ]);

      const walletSwaps = Math.max(totalSwaps - subscriptionSwaps, 0);
      swapOverview = {
        total_swaps: totalSwaps,
        subscription_swaps: subscriptionSwaps,
        wallet_swaps: walletSwaps,
      };

      if (activeSubscription) {
        const unlimited = activeSubscription.remaining_swaps === null;
        activeSubscriptionInfo = {
          subscription_id: activeSubscription.subscription_id,
          package_name: activeSubscription.package?.name ?? null,
          remaining_swaps: activeSubscription.remaining_swaps,
          swap_limit: activeSubscription.package?.swap_limit ?? null,
          unlimited,
          ends_at: activeSubscription.end_date,
        };
      }
    }

    const { password_hash, ...userWithoutPassword } = user;
    void password_hash;

    const profile: UserProfileResponse = {
      ...userWithoutPassword,
      ...(swapOverview ? { swap_overview: swapOverview } : {}),
      ...(activeSubscriptionInfo
        ? { active_subscription: activeSubscriptionInfo }
        : {}),
    };

    return profile;
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
