import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { asyncHandler, CustomError } from "../middlewares/error.middleware";
import { prisma } from "../server";

const TRANSFER_STATUS_VALUES = [
  "pending",
  "in_transit",
  "completed",
  "cancelled",
] as const;

type TransferStatusValue = (typeof TRANSFER_STATUS_VALUES)[number];

const transferInclude = {
  batteries: {
    select: {
      battery_id: true,
      battery_code: true,
      model: true,
      status: true,
    },
  },
  stations_battery_transfer_logs_from_station_idTostations: {
    select: {
      station_id: true,
      name: true,
      address: true,
    },
  },
  stations_battery_transfer_logs_to_station_idTostations: {
    select: {
      station_id: true,
      name: true,
      address: true,
    },
  },
  users: {
    select: {
      user_id: true,
      full_name: true,
      email: true,
    },
  },
} satisfies Prisma.battery_transfer_logsInclude;

export const createBatteryTransfer = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = req.user?.userId;
    const {
      battery_id,
      to_station_id,
      transfer_reason,
      notes,
      transfer_status: transferStatusRaw,
    } = req.body;

    const transferStatus: TransferStatusValue = TRANSFER_STATUS_VALUES.includes(
      transferStatusRaw as TransferStatusValue
    )
      ? (transferStatusRaw as TransferStatusValue)
      : "completed";

    if (!adminId) {
      throw new CustomError("Admin not authenticated", 401);
    }

    if (!battery_id || !to_station_id || !transfer_reason) {
      throw new CustomError(
        "battery_id, to_station_id and transfer_reason are required",
        400
      );
    }

    if (!TRANSFER_STATUS_VALUES.includes(transferStatus)) {
      throw new CustomError("transfer_status is invalid", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const battery = await tx.batteries.findUnique({
        where: { battery_id },
        select: {
          battery_id: true,
          station_id: true,
          status: true,
        },
      });

      if (!battery) {
        throw new CustomError("Battery not found", 404);
      }

      if (battery.status === "in_use") {
        throw new CustomError(
          "Cannot transfer a battery that is currently in use",
          400
        );
      }

      if (battery.station_id === to_station_id) {
        throw new CustomError(
          "Destination station cannot be the same as current station",
          400
        );
      }

      const destinationStation = await tx.stations.findUnique({
        where: { station_id: to_station_id },
        select: {
          station_id: true,
          name: true,
          capacity: true,
          status: true,
        },
      });

      if (!destinationStation) {
        throw new CustomError("Destination station not found", 404);
      }

      if (destinationStation.status !== "active") {
        throw new CustomError(
          "Destination station must be active to receive batteries",
          400
        );
      }

      const batteryCountAtDestination = await tx.batteries.count({
        where: { station_id: to_station_id },
      });

      if (batteryCountAtDestination >= destinationStation.capacity) {
        throw new CustomError(
          `Destination station is at full capacity (${destinationStation.capacity})`,
          400
        );
      }

      // ✅ Chỉ set maintenance nếu transfer_reason liên quan đến maintenance
      // Các lý do khác (restock, rebalance, etc.) → giữ nguyên status
      const normalizedReason = transfer_reason.toLowerCase().trim();
      const maintenanceReasons = [
        "maintenance",
        "manufacturer_service",
        "repair",
        "service",
        "bảo trì",
      ];
      const shouldMarkMaintenance =
        transferStatus === "completed" &&
        maintenanceReasons.some((reason) =>
          normalizedReason.includes(reason)
        );

      // ✅ Xác định status mới dựa trên transfer_reason
      let newStatus: string;
      if (shouldMarkMaintenance) {
        newStatus = "maintenance";
      } else {
        // Giữ nguyên status hiện tại (full, charging, reserved, etc.)
        newStatus = battery.status;
      }

      await tx.batteries.update({
        where: { battery_id },
        data: {
          station_id: to_station_id,
          status: newStatus as any,
        },
      });

      const transferLog = await tx.battery_transfer_logs.create({
        data: {
          transfer_id: randomUUID(),
          battery_id: battery_id as string,
          from_station_id: battery.station_id,
          to_station_id: to_station_id as string,
          transfer_reason: transfer_reason as string,
          transferred_by: adminId,
          notes: notes as string | null,
          transfer_status: transferStatus,
        } as Prisma.battery_transfer_logsUncheckedCreateInput,
        include: transferInclude,
      });

      return transferLog;
    });

    res.status(201).json({
      success: true,
      message: "Battery transfer recorded successfully",
      data: result,
    });
  }
);

export const getBatteryTransfers = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      batteryId,
      fromStationId,
      toStationId,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const whereClause: Prisma.battery_transfer_logsWhereInput = {};

    if (batteryId) whereClause.battery_id = batteryId as string;
    if (fromStationId) whereClause.from_station_id = fromStationId as string;
    if (toStationId) whereClause.to_station_id = toStationId as string;
    if (status) {
      const statusValue = status as string;
      if (
        !TRANSFER_STATUS_VALUES.includes(statusValue as TransferStatusValue)
      ) {
        throw new CustomError("Invalid transfer status filter", 400);
      }
      whereClause.transfer_status = statusValue as TransferStatusValue;
    }

    const take = Math.max(1, parseInt(limit as string, 10));
    const skip = (Math.max(1, parseInt(page as string, 10)) - 1) * take;

    const [transfers, total] = await prisma.$transaction([
      prisma.battery_transfer_logs.findMany({
        where: whereClause,
        include: transferInclude,
        orderBy: { transferred_at: "desc" },
        skip,
        take,
      }),
      prisma.battery_transfer_logs.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      message: "Battery transfers retrieved successfully",
      data: {
        transfers,
        pagination: {
          page: Math.max(1, parseInt(page as string, 10)),
          limit: take,
          total,
          pages: Math.ceil(total / take) || 1,
        },
      },
    });
  }
);

export const getBatteryTransferDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new CustomError("transfer id is required", 400);
    }

    const transfer = await prisma.battery_transfer_logs.findUnique({
      where: { transfer_id: id },
      include: transferInclude,
    });

    if (!transfer) {
      throw new CustomError("Battery transfer log not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Battery transfer details retrieved successfully",
      data: transfer,
    });
  }
);
