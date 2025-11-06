import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../server";
import { asyncHandler, CustomError } from "../middlewares/error.middleware";

const parseBenefits = (input: any): Prisma.InputJsonValue | undefined => {
  if (input === undefined || input === null) {
    return undefined;
  }

  if (Array.isArray(input)) {
    return input;
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (_err) {
      return [input];
    }
  }

  return [input];
};

const parseBoolean = (value: any, defaultValue: boolean): boolean => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return Boolean(value);
};

const parseJsonMetadata = (input: any): Prisma.InputJsonValue | undefined => {
  if (input === undefined || input === null || input === "") {
    return undefined;
  }

  if (typeof input === "object") {
    return input;
  }

  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch (_err) {
      throw new CustomError("metadata must be valid JSON", 400);
    }
  }

  return undefined;
};

export const getPublicPackages = asyncHandler(
  async (req: Request, res: Response) => {
    const { capacity } = req.query;

    const where: Prisma.ServicePackageWhereInput = {
      is_active: true,
    };

    if (capacity) {
      const capacityNumber = Number(capacity);
      if (Number.isNaN(capacityNumber)) {
        throw new CustomError("capacity must be a number", 400);
      }
      where.battery_capacity_kwh = capacityNumber;
    }

    const packages = await prisma.servicePackage.findMany({
      where,
      orderBy: [{ battery_capacity_kwh: "asc" }, { billing_cycle: "asc" }],
    });

    res.status(200).json({
      success: true,
      message: "Active packages retrieved successfully",
      data: packages,
    });
  }
);

export const adminListPackages = asyncHandler(
  async (_req: Request, res: Response) => {
    const packages = await prisma.servicePackage.findMany({
      orderBy: [{ battery_capacity_kwh: "asc" }, { billing_cycle: "asc" }],
    });

    res.status(200).json({
      success: true,
      message: "Packages retrieved successfully",
      data: packages,
    });
  }
);

export const adminCreatePackage = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      description,
      battery_capacity_kwh,
      duration_days,
      price,
      billing_cycle,
      benefits,
      is_active = true,
      metadata,
    } = req.body;

    if (!name || typeof name !== "string") {
      throw new CustomError("name is required", 400);
    }

    const capacityNumber = Number(battery_capacity_kwh);
    const durationNumber = Number(duration_days);
    const priceNumber = Number(price);

    if (Number.isNaN(capacityNumber) || capacityNumber <= 0) {
      throw new CustomError(
        "battery_capacity_kwh must be a positive number",
        400
      );
    }

    if (Number.isNaN(durationNumber) || durationNumber <= 0) {
      throw new CustomError("duration_days must be a positive number", 400);
    }

    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      throw new CustomError("price must be a non-negative number", 400);
    }

    const billingCycleValue = billing_cycle || "monthly";
    if (!["monthly", "yearly", "custom"].includes(billingCycleValue)) {
      throw new CustomError(
        "billing_cycle must be monthly, yearly or custom",
        400
      );
    }

    const parsedMetadata = parseJsonMetadata(metadata);

    const benefitsValue = parseBenefits(benefits);
    const metadataValue = parsedMetadata;

    const created = await prisma.servicePackage.create({
      data: {
        name,
        description,
        battery_capacity_kwh: capacityNumber,
        duration_days: durationNumber,
        price: new Prisma.Decimal(priceNumber),
        billing_cycle: billingCycleValue,
        ...(benefitsValue !== undefined ? { benefits: benefitsValue } : {}),
        swap_limit: null,
        ...(metadataValue !== undefined ? { metadata: metadataValue } : {}),
        is_active: parseBoolean(is_active, true),
      },
    });

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: created,
    });
  }
);

export const adminUpdatePackage = asyncHandler(
  async (req: Request, res: Response) => {
    const { packageId } = req.params;
    const {
      name,
      description,
      battery_capacity_kwh,
      duration_days,
      price,
      billing_cycle,
      benefits,
      is_active,
      metadata,
    } = req.body;

    if (!packageId) {
      throw new CustomError("packageId is required", 400);
    }

    const updateData: Prisma.ServicePackageUpdateInput = {};

    if (name !== undefined) {
      if (!name || typeof name !== "string") {
        throw new CustomError("name must be a non-empty string", 400);
      }
      updateData.name = name;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (battery_capacity_kwh !== undefined) {
      const capacityNumber = Number(battery_capacity_kwh);
      if (Number.isNaN(capacityNumber) || capacityNumber <= 0) {
        throw new CustomError(
          "battery_capacity_kwh must be a positive number",
          400
        );
      }
      updateData.battery_capacity_kwh = capacityNumber;
    }

    if (duration_days !== undefined) {
      const durationNumber = Number(duration_days);
      if (Number.isNaN(durationNumber) || durationNumber <= 0) {
        throw new CustomError("duration_days must be a positive number", 400);
      }
      updateData.duration_days = durationNumber;
    }

    if (price !== undefined) {
      const priceNumber = Number(price);
      if (Number.isNaN(priceNumber) || priceNumber < 0) {
        throw new CustomError("price must be a non-negative number", 400);
      }
      updateData.price = new Prisma.Decimal(priceNumber);
    }

    if (billing_cycle !== undefined) {
      if (!["monthly", "yearly", "custom"].includes(billing_cycle)) {
        throw new CustomError(
          "billing_cycle must be monthly, yearly or custom",
          400
        );
      }
      updateData.billing_cycle = billing_cycle;
    }

    if (benefits !== undefined) {
      const benefitsValue = parseBenefits(benefits);
      updateData.benefits =
        benefitsValue !== undefined ? benefitsValue : Prisma.JsonNull;
    }

    if (is_active !== undefined) {
      updateData.is_active = parseBoolean(is_active, true);
    }

    if (metadata !== undefined) {
      const metadataValue = parseJsonMetadata(metadata);
      updateData.metadata =
        metadataValue !== undefined ? metadataValue : Prisma.JsonNull;
    }

    if (Object.keys(updateData).length === 0) {
      throw new CustomError("No update fields provided", 400);
    }

    const updated = await prisma.servicePackage.update({
      where: { package_id: packageId },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Package updated successfully",
      data: updated,
    });
  }
);
