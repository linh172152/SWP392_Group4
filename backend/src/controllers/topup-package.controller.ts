import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";
import { prisma } from "../server";

/**
 * Get all top-up packages
 */
export const getTopUpPackages = asyncHandler(
  async (req: Request, res: Response) => {
    const { is_active, page = 1, limit = 10 } = req.query;

    const whereClause: any = {};
    if (is_active !== undefined) {
      whereClause.is_active = is_active === "true";
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const packages = await prisma.topup_packages.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit as string),
    });

    const total = await prisma.topup_packages.count({
      where: whereClause,
    });

    res.status(200).json({
      success: true,
      message: "Top-up packages retrieved successfully",
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
 * Get top-up package by ID
 */
export const getTopUpPackageById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const packageData = await prisma.topup_packages.findUnique({
      where: { package_id: id },
    });

    if (!packageData) {
      throw new CustomError("Top-up package not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Top-up package retrieved successfully",
      data: packageData,
    });
  }
);

/**
 * Create top-up package
 */
export const createTopUpPackage = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description, topup_amount, bonus_amount, is_active = true } =
      req.body;

    if (!name || !topup_amount || bonus_amount === undefined) {
      throw new CustomError(
        "Name, topup amount, and bonus amount are required",
        400
      );
    }

    // Calculate actual_amount
    const actualAmount = parseFloat(topup_amount) + parseFloat(bonus_amount);

    const packageData = await prisma.topup_packages.create({
      data: {
        name,
        description,
        topup_amount: parseFloat(topup_amount),
        bonus_amount: parseFloat(bonus_amount),
        actual_amount: actualAmount,
        is_active,
      },
    });

    res.status(201).json({
      success: true,
      message: "Top-up package created successfully",
      data: packageData,
    });
  }
);

/**
 * Update top-up package
 */
export const updateTopUpPackage = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, topup_amount, bonus_amount, is_active } =
      req.body;

    const packageData = await prisma.topup_packages.findUnique({
      where: { package_id: id },
    });

    if (!packageData) {
      throw new CustomError("Top-up package not found", 404);
    }

    // Calculate actual_amount if topup_amount or bonus_amount is being updated
    let actualAmount: any = packageData.actual_amount;
    const newTopupAmount =
      topup_amount !== undefined ? parseFloat(topup_amount) : Number(packageData.topup_amount);
    const newBonusAmount =
      bonus_amount !== undefined ? parseFloat(bonus_amount) : Number(packageData.bonus_amount);

    if (topup_amount !== undefined || bonus_amount !== undefined) {
      actualAmount = newTopupAmount + newBonusAmount; // Prisma Decimal accepts number
    }

    const updatedPackage = await prisma.topup_packages.update({
      where: { package_id: id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(topup_amount !== undefined && {
          topup_amount: newTopupAmount,
        }),
        ...(bonus_amount !== undefined && {
          bonus_amount: newBonusAmount,
        }),
        ...((topup_amount !== undefined || bonus_amount !== undefined) && {
          actual_amount: actualAmount as any, // Prisma Decimal accepts number
        }),
        ...(is_active !== undefined && { is_active }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Top-up package updated successfully",
      data: updatedPackage,
    });
  }
);

/**
 * Delete top-up package
 */
export const deleteTopUpPackage = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const packageData = await prisma.topup_packages.findUnique({
      where: { package_id: id },
    });

    if (!packageData) {
      throw new CustomError("Top-up package not found", 404);
    }

    await prisma.topup_packages.delete({
      where: { package_id: id },
    });

    res.status(200).json({
      success: true,
      message: "Top-up package deleted successfully",
    });
  }
);

