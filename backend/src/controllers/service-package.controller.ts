import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";

const prisma = new PrismaClient();

/**
 * Get all service packages
 */
export const getServicePackages = asyncHandler(
  async (req: Request, res: Response) => {
    const { is_active = true, page = 1, limit = 10 } = req.query;

    const whereClause: any = {};
    if (is_active !== undefined) {
      whereClause.is_active = is_active === "true";
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const packages = await prisma.servicePackage.findMany({
      where: whereClause,
      include: {
        subscriptions: {
          where: { status: "active" },
          select: {
            subscription_id: true,
            user_id: true,
            start_date: true,
            end_date: true,
            remaining_swaps: true,
            user: {
              select: {
                user_id: true,
                full_name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit as string),
    });

    const total = await prisma.servicePackage.count({ where: whereClause });

    res.status(200).json({
      success: true,
      message: "Service packages retrieved successfully",
      data: {
        packages,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  }
);

/**
 * Get service package details
 */
export const getServicePackageDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const packageData = await prisma.servicePackage.findUnique({
      where: { package_id: id },
      include: {
        subscriptions: {
          include: {
            user: {
              select: {
                user_id: true,
                full_name: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!packageData) {
      throw new CustomError("Service package not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Service package details retrieved successfully",
      data: packageData,
    });
  }
);

/**
 * Create service package (Admin only)
 */
export const createServicePackage = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      description,
      price,
      swap_limit,
      duration_days,
      battery_models,
      is_active = true,
    } = req.body;

    if (!name || !price || !duration_days || !battery_models) {
      throw new CustomError(
        "Name, price, duration days and battery models are required",
        400
      );
    }

    const packageData = await prisma.servicePackage.create({
      data: {
        name,
        description,
        price,
        swap_limit,
        duration_days,
        battery_models,
        is_active,
      },
    });

    res.status(201).json({
      success: true,
      message: "Service package created successfully",
      data: packageData,
    });
  }
);

/**
 * Update service package (Admin only)
 */
export const updateServicePackage = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      swap_limit,
      duration_days,
      battery_models,
      is_active,
    } = req.body;

    const packageData = await prisma.servicePackage.findUnique({
      where: { package_id: id },
    });

    if (!packageData) {
      throw new CustomError("Service package not found", 404);
    }

    const updatedPackage = await prisma.servicePackage.update({
      where: { package_id: id },
      data: {
        name,
        description,
        price,
        swap_limit,
        duration_days,
        battery_models,
        is_active,
      },
    });

    res.status(200).json({
      success: true,
      message: "Service package updated successfully",
      data: updatedPackage,
    });
  }
);

/**
 * Delete service package (Admin only)
 */
export const deleteServicePackage = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const packageData = await prisma.servicePackage.findUnique({
      where: { package_id: id },
    });

    if (!packageData) {
      throw new CustomError("Service package not found", 404);
    }

    // Check if package has active subscriptions
    const activeSubscriptions = await prisma.userSubscription.findFirst({
      where: {
        package_id: id,
        status: "active",
      },
    });

    if (activeSubscriptions) {
      throw new CustomError(
        "Cannot delete package with active subscriptions",
        400
      );
    }

    await prisma.servicePackage.delete({
      where: { package_id: id },
    });

    res.status(200).json({
      success: true,
      message: "Service package deleted successfully",
    });
  }
);

