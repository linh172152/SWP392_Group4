import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";

const prisma = new PrismaClient();

/**
 * Get all battery pricing
 */
export const getBatteryPricing = asyncHandler(
  async (req: Request, res: Response) => {
    const { is_active, page = 1, limit = 10 } = req.query;

    const whereClause: any = {};
    if (is_active !== undefined) {
      whereClause.is_active = is_active === "true";
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const pricings = await prisma.batteryPricing.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit as string),
    });

    const total = await prisma.batteryPricing.count({
      where: whereClause,
    });

    res.status(200).json({
      success: true,
      message: "Battery pricing retrieved successfully",
      data: {
        pricings,
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
 * Get battery pricing by ID
 */
export const getBatteryPricingById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const pricing = await prisma.batteryPricing.findUnique({
      where: { pricing_id: id },
    });

    if (!pricing) {
      throw new CustomError("Battery pricing not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Battery pricing retrieved successfully",
      data: pricing,
    });
  }
);

/**
 * Create battery pricing
 */
export const createBatteryPricing = asyncHandler(
  async (req: Request, res: Response) => {
    const { battery_model, price, is_active = true } = req.body;

    if (!battery_model || !price) {
      throw new CustomError("Battery model and price are required", 400);
    }

    // Check if pricing for this model already exists
    const existingPricing = await prisma.batteryPricing.findUnique({
      where: { battery_model },
    });

    if (existingPricing) {
      throw new CustomError(
        `Pricing for battery model "${battery_model}" already exists`,
        400
      );
    }

    const pricing = await prisma.batteryPricing.create({
      data: {
        battery_model,
        price: parseFloat(price),
        is_active,
      },
    });

    res.status(201).json({
      success: true,
      message: "Battery pricing created successfully",
      data: pricing,
    });
  }
);

/**
 * Update battery pricing
 */
export const updateBatteryPricing = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { battery_model, price, is_active } = req.body;

    const pricing = await prisma.batteryPricing.findUnique({
      where: { pricing_id: id },
    });

    if (!pricing) {
      throw new CustomError("Battery pricing not found", 404);
    }

    // If battery_model is being changed, check if new model already exists
    if (battery_model && battery_model !== pricing.battery_model) {
      const existingPricing = await prisma.batteryPricing.findUnique({
        where: { battery_model },
      });

      if (existingPricing) {
        throw new CustomError(
          `Pricing for battery model "${battery_model}" already exists`,
          400
        );
      }
    }

    const updatedPricing = await prisma.batteryPricing.update({
      where: { pricing_id: id },
      data: {
        ...(battery_model && { battery_model }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(is_active !== undefined && { is_active }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Battery pricing updated successfully",
      data: updatedPricing,
    });
  }
);

/**
 * Delete battery pricing
 */
export const deleteBatteryPricing = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const pricing = await prisma.batteryPricing.findUnique({
      where: { pricing_id: id },
    });

    if (!pricing) {
      throw new CustomError("Battery pricing not found", 404);
    }

    await prisma.batteryPricing.delete({
      where: { pricing_id: id },
    });

    res.status(200).json({
      success: true,
      message: "Battery pricing deleted successfully",
    });
  }
);

