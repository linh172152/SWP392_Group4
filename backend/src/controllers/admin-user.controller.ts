import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";

const prisma = new PrismaClient();

/**
 * Get all users
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role, status, page = 1, limit = 10, search } = req.query;

  const whereClause: any = {};

  if (role) {
    whereClause.role = role;
  }

  if (status) {
    whereClause.status = status;
  }

  if (search) {
    whereClause.OR = [
      { full_name: { contains: search as string, mode: "insensitive" } },
      { email: { contains: search as string, mode: "insensitive" } },
      { phone: { contains: search as string, mode: "insensitive" } },
    ];
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const users = await prisma.users.findMany({
    where: whereClause,
    include: {
      stations: {
        select: {
          station_id: true,
          name: true,
          address: true,
        },
      },
      vehicles: {
        select: {
          vehicle_id: true,
          license_plate: true,
          vehicle_type: true,
          model: true,
        },
      },
      user_subscriptions: {
        where: { status: "active" },
        include: {
          service_packages: {
            select: {
              package_id: true,
              name: true,
              price: true,
              duration_days: true,
            },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
    skip,
    take: parseInt(limit as string),
  });

  const total = await prisma.users.count({ where: whereClause });

  const mappedUsers = users.map((user: any) => {
    const { user_subscriptions, ...rest } = user;
    const subscriptions = user_subscriptions
      ? user_subscriptions.map((sub: any) => {
          const { service_packages, ...subRest } = sub;
          return {
            ...subRest,
            package: service_packages || null,
          };
        })
      : [];
    return {
      ...rest,
      user_subscriptions: subscriptions,
    };
  });

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data: {
      users: mappedUsers,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

/**
 * Get user details
 */
export const getUserDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await prisma.users.findUnique({
      where: { user_id: id },
      include: {
        stations: {
          select: {
            station_id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            status: true,
          },
        },
        vehicles: {
          select: {
            vehicle_id: true,
            license_plate: true,
            vehicle_type: true,
            model: true,
            make: true,
            year: true,
            battery_model: true,
            created_at: true,
          },
        },
        bookings_bookings_user_idTousers: {
          select: {
            booking_id: true,
            booking_code: true,
            status: true,
            scheduled_at: true,
            created_at: true,
            stations: {
              select: {
                station_id: true,
                name: true,
                address: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
          take: 10,
        },
        transactions_transactions_user_idTousers: {
          select: {
            transaction_id: true,
            transaction_code: true,
            payment_status: true,
            amount: true,
            swap_at: true,
            stations: {
              select: {
                station_id: true,
                name: true,
                address: true,
              },
            },
          },
          orderBy: { swap_at: "desc" },
          take: 10,
        },
        user_subscriptions: {
          include: {
            service_packages: {
              select: {
                package_id: true,
                name: true,
                price: true,
                duration_days: true,
                swap_limit: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
        support_tickets_support_tickets_user_idTousers: {
          select: {
            ticket_id: true,
            ticket_number: true,
            category: true,
            subject: true,
            priority: true,
            status: true,
            created_at: true,
          },
          orderBy: { created_at: "desc" },
          take: 5,
        },
        station_ratings: {
          select: {
            rating_id: true,
            rating: true,
            comment: true,
            created_at: true,
            stations: {
              select: {
                station_id: true,
                name: true,
                address: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
          take: 5,
        },
      },
    });

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    const { user_subscriptions, ...rest } = user;
    const subscriptions = user_subscriptions
      ? user_subscriptions.map((sub: any) => {
          const { service_packages, ...subRest } = sub;
          return {
            ...subRest,
            package: service_packages || null,
          };
        })
      : [];
    const mappedUser = {
      ...rest,
      user_subscriptions: subscriptions,
    };

    res.status(200).json({
      success: true,
      message: "User details retrieved successfully",
      data: mappedUser,
    });
  }
);

/**
 * Create new user
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const {
    full_name,
    email,
    password_hash,
    phone,
    avatar,
    role = "DRIVER",
    station_id,
    status = "ACTIVE",
  } = req.body;

  if (!full_name || !email) {
    throw new CustomError("Full name and email are required", 400);
  }

  // Check if email already exists
  const existingUser = await prisma.users.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new CustomError("User with this email already exists", 400);
  }

  // If role is STAFF, station_id is required
  if (role === "STAFF" && !station_id) {
    throw new CustomError("Station ID is required for staff users", 400);
  }

  // If station_id provided, check if station exists
  if (station_id) {
    const station = await prisma.stations.findUnique({
      where: { station_id },
    });

    if (!station) {
      throw new CustomError("Station not found", 404);
    }
  }

  const user = await prisma.users.create({
    data: {
      full_name: full_name as string,
      email: email as string,
      password_hash: password_hash as string | null,
      phone: phone as string | null,
      avatar: avatar as string | null,
      role: role as string,
      station_id: role === "STAFF" ? (station_id as string | null) : null,
      status: status as string,
      updated_at: new Date(),
    } as Prisma.usersUncheckedCreateInput,
    include: {
      stations: {
        select: {
          station_id: true,
          name: true,
          address: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: user,
  });
});

/**
 * Update user
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { full_name, email, phone, avatar, station_id } = req.body;

  const user = await prisma.users.findUnique({
    where: { user_id: id },
  });

  if (!user) {
    throw new CustomError("User not found", 404);
  }

  // Check if email already exists (if changed)
  if (email && email !== user.email) {
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new CustomError("User with this email already exists", 400);
    }
  }

  // If station_id provided, check if station exists
  if (station_id) {
    const station = await prisma.stations.findUnique({
      where: { station_id },
    });

    if (!station) {
      throw new CustomError("Station not found", 404);
    }
  }

  const updatedUser = await prisma.users.update({
    where: { user_id: id },
    data: {
      full_name,
      email,
      phone,
      avatar,
      station_id,
    },
    include: {
      stations: {
        select: {
          station_id: true,
          name: true,
          address: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: updatedUser,
  });
});

/**
 * Update user status
 */
export const updateUserStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new CustomError("Status is required", 400);
    }

    const user = await prisma.users.findUnique({
      where: { user_id: id },
    });

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    const updatedUser = await prisma.users.update({
      where: { user_id: id },
      data: { status },
      include: {
        stations: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: updatedUser,
    });
  }
);

/**
 * Update user role
 */
export const updateUserRole = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role, station_id } = req.body;

    if (!role) {
      throw new CustomError("Role is required", 400);
    }

    const user = await prisma.users.findUnique({
      where: { user_id: id },
    });

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    // If role is STAFF, station_id is required
    if (role === "STAFF" && !station_id) {
      throw new CustomError("Station ID is required for staff users", 400);
    }

    // If station_id provided, check if station exists
    if (station_id) {
      const station = await prisma.stations.findUnique({
        where: { station_id },
      });

      if (!station) {
        throw new CustomError("Station not found", 404);
      }
    }

    const updatedUser = await prisma.users.update({
      where: { user_id: id },
      data: {
        role,
        station_id: role === "STAFF" ? station_id : null,
      },
      include: {
        stations: {
          select: {
            station_id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: updatedUser,
    });
  }
);

/**
 * Delete user
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.users.findUnique({
    where: { user_id: id },
  });

  if (!user) {
    throw new CustomError("User not found", 404);
  }

  // Check if user has active bookings
  const activeBookings = await prisma.bookings.findFirst({
    where: {
      user_id: id,
      status: { in: ["pending", "confirmed"] },
    },
  });

  if (activeBookings) {
    throw new CustomError("Cannot delete user with active bookings", 400);
  }

  // Check if user has active transactions
  const activeTransactions = await prisma.transactions.findFirst({
    where: {
      user_id: id,
      payment_status: { in: ["pending", "completed"] },
    },
  });

  if (activeTransactions) {
    throw new CustomError("Cannot delete user with active transactions", 400);
  }

  await prisma.users.delete({
    where: { user_id: id },
  });

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});
