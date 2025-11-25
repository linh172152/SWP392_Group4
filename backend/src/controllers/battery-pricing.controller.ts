import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";
import { decimalToNumber } from "../utils/decimal.util";
import { prisma } from "../server";

/**
 * Get all battery pricing
 */
export const getBatteryPricing = asyncHandler(
  async (req: Request, res: Response) => {
    const { is_active, page = 1, limit = 10 } = req.query;

    // Validate and parse query parameters
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit as string) || 10)
    ); // Max 100, min 1

    // Only get global pricing (station_id = null) for public API
    const whereClause: Prisma.battery_pricingsWhereInput = {
      station_id: null,
    };
    if (is_active !== undefined) {
      whereClause.is_active = String(is_active) === "true";
    }

    const skip = (pageNum - 1) * limitNum;

    try {
      const pricings = await prisma.battery_pricings.findMany({
        where: whereClause,
        orderBy: { created_at: "desc" },
        skip,
        take: limitNum,
      });

      const total = await prisma.battery_pricings.count({
        where: whereClause,
      });

      // Convert Decimal price to number for JSON response (frontend expects number)
      const pricingsWithNumberPrice = pricings.map((pricing) => ({
        ...pricing,
        price: decimalToNumber(pricing.price),
      }));

      res.status(200).json({
        success: true,
        message: "Battery pricing retrieved successfully",
        data: {
          pricings: pricingsWithNumberPrice,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error: any) {
      console.error("Error fetching battery pricing:", error);
      throw new CustomError(
        error.message || "Database error",
        error.code === "P1001" ? 500 : 400
      );
    }
  }
);

/**
 * Get battery pricing by ID
 */
export const getBatteryPricingById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const pricing = await prisma.battery_pricings.findUnique({
      where: { pricing_id: id },
    });

    if (!pricing) {
      throw new CustomError("Battery pricing not found", 404);
    }

    // Convert Decimal price to number for JSON response (frontend expects number)
    const pricingWithNumberPrice = {
      ...pricing,
      price: decimalToNumber(pricing.price),
    };

    res.status(200).json({
      success: true,
      message: "Battery pricing retrieved successfully",
      data: pricingWithNumberPrice,
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

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber < 0) {
      throw new CustomError("Price must be a valid non-negative number", 400);
    }

    // Check if pricing for this model already exists (global pricing - station_id = null)
    const existingPricing = await prisma.battery_pricings.findFirst({
      where: {
        battery_model,
        station_id: null, // Prisma accepts null directly for nullable fields
      },
    });

    if (existingPricing) {
      throw new CustomError(
        `Pricing for battery model "${battery_model}" already exists`,
        400
      );
    }

    const pricing = await prisma.battery_pricings.create({
      data: {
        battery_model,
        price: new Prisma.Decimal(priceNumber),
        is_active,
        station_id: null, // ✅ Global pricing (not station-specific)
      },
    });

    // Convert Decimal price to number for JSON response (frontend expects number)
    const pricingWithNumberPrice = {
      ...pricing,
      price: decimalToNumber(pricing.price),
    };

    res.status(201).json({
      success: true,
      message: "Battery pricing created successfully",
      data: pricingWithNumberPrice,
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

    const pricing = await prisma.battery_pricings.findUnique({
      where: { pricing_id: id },
    });

    if (!pricing) {
      throw new CustomError("Battery pricing not found", 404);
    }

    // If battery_model is being changed, check if new model already exists (global pricing - station_id = null)
    if (battery_model && battery_model !== pricing.battery_model) {
      const existingPricing = await prisma.battery_pricings.findFirst({
        where: {
          battery_model,
          station_id: null, // Prisma accepts null directly for nullable fields
        },
      });

      if (existingPricing) {
        throw new CustomError(
          `Pricing for battery model "${battery_model}" already exists`,
          400
        );
      }
    }

    const updateData: Prisma.battery_pricingsUpdateInput = {};
    if (battery_model) {
      updateData.battery_model = battery_model;
    }
    if (price !== undefined) {
      const priceNumber = parseFloat(price);
      if (isNaN(priceNumber) || priceNumber < 0) {
        throw new CustomError("Price must be a valid non-negative number", 400);
      }
      updateData.price = new Prisma.Decimal(priceNumber);
    }
    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    const updatedPricing = await prisma.battery_pricings.update({
      where: { pricing_id: id },
      data: updateData,
    });

    // Convert Decimal price to number for JSON response (frontend expects number)
    const pricingWithNumberPrice = {
      ...updatedPricing,
      price: Number(updatedPricing.price),
    };

    res.status(200).json({
      success: true,
      message: "Battery pricing updated successfully",
      data: pricingWithNumberPrice,
    });
  }
);

/**
 * Delete battery pricing
 */
export const deleteBatteryPricing = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const pricing = await prisma.battery_pricings.findUnique({
      where: { pricing_id: id },
    });

    if (!pricing) {
      throw new CustomError("Battery pricing not found", 404);
    }

    await prisma.battery_pricings.delete({
      where: { pricing_id: id },
    });

    res.status(200).json({
      success: true,
      message: "Battery pricing deleted successfully",
    });
  }
);
