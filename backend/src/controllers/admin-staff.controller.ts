import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";
import bcrypt from "bcrypt";
import { prisma } from "../server";

/**
 * Get all staff (Admin)
 */
export const getAllStaff = asyncHandler(async (req: Request, res: Response) => {
  const { station_id, status, page = 1, limit = 10, search } = req.query;

  const whereClause: any = {
    role: "STAFF",
  };

  if (station_id) {
    whereClause.station_id = station_id;
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

  const staff = await prisma.users.findMany({
    where: whereClause,
    include: {
      stations: {
        select: {
          station_id: true,
          name: true,
          address: true,
        },
      },
      _count: {
        select: {
          bookings_bookings_checked_in_by_staff_idTousers: true,
          transactions_transactions_staff_idTousers: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
    skip,
    take: parseInt(limit as string),
  });

  // Remove password_hash from response
  const staffWithoutPassword = staff.map((staffMember: typeof staff[number]) => {
    const { password_hash, ...rest } = staffMember;
    void password_hash;
    return rest;
  });

  const total = await prisma.users.count({ where: whereClause });

  res.status(200).json({
    success: true,
    message: "Staff retrieved successfully",
    data: staffWithoutPassword,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  });
});

/**
 * Get staff details (Admin)
 */
export const getStaffDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const staff = await prisma.users.findUnique({
      where: { user_id: id },
      include: {
        stations: {
          select: {
            station_id: true,
            name: true,
            address: true,
            status: true,
          },
        },
        bookings_bookings_checked_in_by_staff_idTousers: {
          take: 10,
          orderBy: { created_at: "desc" },
          select: {
            booking_id: true,
            status: true,
            scheduled_at: true,
            created_at: true,
          },
        },
        transactions_transactions_staff_idTousers: {
          take: 10,
          orderBy: { created_at: "desc" },
          select: {
            transaction_id: true,
            created_at: true,
          },
        },
        _count: {
          select: {
            bookings_bookings_checked_in_by_staff_idTousers: true,
            transactions_transactions_staff_idTousers: true,
          },
        },
      },
    });

    if (!staff) {
      throw new CustomError("Staff not found", 404);
    }

    if (staff.role !== "STAFF") {
      throw new CustomError("User is not a staff member", 400);
    }

    // Remove password_hash from response
    const { password_hash, ...staffWithoutPassword } = staff;
    void password_hash;

    res.status(200).json({
      success: true,
      message: "Staff details retrieved successfully",
      data: staffWithoutPassword,
    });
  }
);

/**
 * Create new staff (Admin)
 */
export const createStaff = asyncHandler(async (req: Request, res: Response) => {
  const {
    full_name,
    email,
    password,
    phone,
    avatar,
    station_id,
    status = "ACTIVE",
  } = req.body;

  if (!full_name || !email || !password || !station_id) {
    throw new CustomError(
      "Full name, email, password, and station_id are required",
      400
    );
  }

  // Check if email already exists
  const existingUser = await prisma.users.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new CustomError("User with this email already exists", 400);
  }

  // Check if station exists
  const station = await prisma.stations.findUnique({
    where: { station_id },
  });

  if (!station) {
    throw new CustomError("Station not found", 404);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const staff = await prisma.users.create({
    data: {
      full_name: full_name as string,
      email: email as string,
      password_hash: hashedPassword,
      phone: phone as string | null,
      avatar: avatar as string | null,
      role: "STAFF",
      station_id: station_id as string | null,
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

  // Remove password_hash from response
  const { password_hash: _passwordHash, ...staffWithoutPassword } = staff;
  void _passwordHash;

  res.status(201).json({
    success: true,
    message: "Staff created successfully",
    data: staffWithoutPassword,
  });
});

/**
 * Update staff (Admin)
 */
export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { full_name, email, phone, avatar, station_id, status } = req.body;

  const staff = await prisma.users.findUnique({
    where: { user_id: id },
  });

  if (!staff) {
    throw new CustomError("Staff not found", 404);
  }

  if (staff.role !== "STAFF") {
    throw new CustomError("User is not a staff member", 400);
  }

  // Check if email already exists (if changed)
  if (email && email !== staff.email) {
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

  const updateData: any = {};
  if (full_name !== undefined) updateData.full_name = full_name;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (avatar !== undefined) updateData.avatar = avatar;
  if (station_id !== undefined) updateData.station_id = station_id;
  if (status !== undefined) updateData.status = status;

  const updatedStaff = await prisma.users.update({
    where: { user_id: id },
    data: updateData,
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

  // Remove password_hash from response
  const { password_hash, ...staffWithoutPassword } = updatedStaff;
  void password_hash;

  res.status(200).json({
    success: true,
    message: "Staff updated successfully",
    data: staffWithoutPassword,
  });
});

/**
 * Delete staff (Admin)
 */
export const deleteStaff = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const staff = await prisma.users.findUnique({
    where: { user_id: id },
    include: {
      _count: {
        select: {
          bookings_bookings_checked_in_by_staff_idTousers: true,
          transactions_transactions_staff_idTousers: true,
        },
      },
    },
  });

  if (!staff) {
    throw new CustomError("Staff not found", 404);
  }

  if (staff.role !== "STAFF") {
    throw new CustomError("User is not a staff member", 400);
  }

  // Check if staff has active bookings at their station
  // Note: We check bookings at the staff's station that are still active
  if (staff.station_id) {
    const activeBookings = await prisma.bookings.count({
      where: {
        station_id: staff.station_id,
        status: {
          in: ["pending", "confirmed"],
        },
      },
    });

    if (activeBookings > 0) {
      throw new CustomError(
        "Cannot delete staff with active bookings at their station. Please reassign bookings first",
        400
      );
    }
  }

  // Delete staff (cascade will handle related records if configured)
  await prisma.users.delete({
    where: { user_id: id },
  });

  res.status(200).json({
    success: true,
    message: "Staff deleted successfully",
  });
});
