import { Request, Response } from "express";
import { Prisma, ScheduleStatus, UserRole } from "@prisma/client";
import { prisma } from "../server";
import { asyncHandler, CustomError } from "../middlewares/error.middleware";

const parseDate = (value?: string | null): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new CustomError(`Invalid date value: ${value}`, 400);
  }
  return date;
};

const getShiftDate = (shiftStart: Date): Date => {
  return new Date(Date.UTC(
    shiftStart.getUTCFullYear(),
    shiftStart.getUTCMonth(),
    shiftStart.getUTCDate()
  ));
};

const assertStaffUser = async (staffId: string) => {
  const staff = await prisma.users.findUnique({
    where: { user_id: staffId },
    select: { user_id: true, role: true, station_id: true },
  });

  if (!staff || staff.role !== UserRole.STAFF) {
    throw new CustomError("Staff user not found", 404);
  }

  return staff;
};

const checkScheduleOverlap = async (
  staffId: string,
  shiftStart: Date,
  shiftEnd: Date,
  excludeScheduleId?: string
) => {
    const overlap = await prisma.staff_schedules.findFirst({
    where: {
      staff_id: staffId,
      schedule_id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
      AND: [
        { shift_start: { lt: shiftEnd } },
        { shift_end: { gt: shiftStart } },
      ],
    },
  });

  if (overlap) {
    throw new CustomError("Staff already has a schedule overlapping this time", 409);
  }
};

const normalizeStatus = (status?: string): ScheduleStatus | undefined => {
  if (!status) return undefined;
  const normalized = String(status).trim().toLowerCase() as ScheduleStatus;
  if (!Object.values(ScheduleStatus).includes(normalized)) {
    throw new CustomError("Invalid schedule status", 400);
  }
  return normalized;
};

export const getMyStaffSchedules = asyncHandler(
  async (req: Request, res: Response) => {
    const staffId = req.user?.userId;
    if (!staffId) {
      throw new CustomError("Staff not authenticated", 401);
    }

    const { from, to, status, include_past = "false" } = req.query;

    const where: Prisma.staff_schedulesWhereInput = {
      staff_id: staffId,
    };

    const fromDate = parseDate(from as string | undefined);
    const toDate = parseDate(to as string | undefined);

    if (fromDate || toDate) {
      where.shift_start = {};
      if (fromDate) {
        where.shift_start.gte = fromDate;
      }
      if (toDate) {
        where.shift_start.lte = toDate;
      }
    } else if (include_past !== "true") {
      where.shift_end = { gte: new Date() };
    }

    if (status) {
      where.status = normalizeStatus(String(status));
    }

    const schedules = await prisma.staff_schedules.findMany({
      where,
      orderBy: [{ shift_start: "asc" }],
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
      message: "Staff schedules retrieved successfully",
      data: schedules,
    });
  }
);

export const updateMyScheduleStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const staffId = req.user?.userId;
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!staffId) {
      throw new CustomError("Staff not authenticated", 401);
    }

    if (!status) {
      throw new CustomError("status is required", 400);
    }

    const normalizedStatus = normalizeStatus(status);
    if (!normalizedStatus) {
      throw new CustomError("Invalid status", 400);
    }

    const schedule = await prisma.staff_schedules.findUnique({
      where: { schedule_id: id },
    });

    if (!schedule || schedule.staff_id !== staffId) {
      throw new CustomError("Schedule not found", 404);
    }

    const allowedUpdates: ScheduleStatus[] = [
      ScheduleStatus.completed,
      ScheduleStatus.absent,
      ScheduleStatus.cancelled,
    ];

    if (!allowedUpdates.includes(normalizedStatus)) {
      throw new CustomError("Status update not allowed", 400);
    }

    const updated = await prisma.staff_schedules.update({
      where: { schedule_id: id },
      data: {
        status: normalizedStatus,
        notes: typeof notes === "string" ? notes : schedule.notes,
      },
    });

    res.status(200).json({
      success: true,
      message: "Schedule status updated",
      data: updated,
    });
  }
);

export const adminListStaffSchedules = asyncHandler(
  async (req: Request, res: Response) => {
    const { staff_id, station_id, shift_date, from, to, status, page = "1", limit = "20" } = req.query;

    const where: Prisma.staff_schedulesWhereInput = {};

    if (staff_id) {
      where.staff_id = staff_id as string;
    }

    if (station_id) {
      where.station_id = station_id as string;
    }

    // Handle specific date filter
    if (shift_date) {
      const targetDate = parseDate(shift_date as string);
      if (targetDate) {
        // Filter by shift_date field (which stores the date part)
        const startOfDay = new Date(Date.UTC(
          targetDate.getUTCFullYear(),
          targetDate.getUTCMonth(),
          targetDate.getUTCDate()
        ));
        const endOfDay = new Date(Date.UTC(
          targetDate.getUTCFullYear(),
          targetDate.getUTCMonth(),
          targetDate.getUTCDate() + 1
        ));
        
        where.shift_date = {
          gte: startOfDay,
          lt: endOfDay
        };
      }
    } else {
      // Handle date range filter (from/to)
      const fromDate = parseDate(from as string | undefined);
      const toDate = parseDate(to as string | undefined);
      if (fromDate || toDate) {
        where.shift_start = {};
        if (fromDate) {
          where.shift_start.gte = fromDate;
        }
        if (toDate) {
          where.shift_start.lte = toDate;
        }
      }
    }

    if (status) {
      where.status = normalizeStatus(String(status));
    }

    const pageNumber = Math.max(parseInt(String(page), 10) || 1, 1);
    const pageSize = Math.max(parseInt(String(limit), 10) || 20, 1);
    const skip = (pageNumber - 1) * pageSize;

    const [schedules, total] = await prisma.$transaction([
      prisma.staff_schedules.findMany({
        where,
        orderBy: [{ shift_start: "asc" }],
        skip,
        take: pageSize,
        include: {
          users: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
              phone: true,
            },
          },
          stations: {
            select: {
              station_id: true,
              name: true,
            },
          },
        },
      }),
      prisma.staff_schedules.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      message: "Staff schedules retrieved",
      data: {
        schedules,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total,
          pages: Math.ceil(total / pageSize),
        },
      },
    });
  }
);

export const adminCreateStaffSchedule = asyncHandler(
  async (req: Request, res: Response) => {
    const { staff_id, station_id, shift_start, shift_end, status, notes } = req.body;

    if (!staff_id || !shift_start || !shift_end) {
      throw new CustomError("staff_id, shift_start and shift_end are required", 400);
    }

    const shiftStart = parseDate(shift_start);
    const shiftEnd = parseDate(shift_end);

    if (!shiftStart || !shiftEnd) {
      throw new CustomError("shift_start and shift_end must be valid dates", 400);
    }

    if (shiftEnd <= shiftStart) {
      throw new CustomError("shift_end must be greater than shift_start", 400);
    }

    const staff = await assertStaffUser(staff_id);

    const finalStationId = station_id ?? staff.station_id ?? null;
    if (!finalStationId) {
      throw new CustomError("station_id is required for this staff", 400);
    }

    await checkScheduleOverlap(staff_id, shiftStart, shiftEnd);

    const schedule = await prisma.staff_schedules.create({
      data: {
        staff_id,
        station_id: finalStationId,
        shift_date: getShiftDate(shiftStart),
        shift_start: shiftStart,
        shift_end: shiftEnd,
        status: normalizeStatus(status) ?? ScheduleStatus.scheduled,
        notes,
      },
      include: {
        users: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        stations: {
          select: {
            station_id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Staff schedule created",
      data: schedule,
    });
  }
);

export const adminUpdateStaffSchedule = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { shift_start, shift_end, status, notes, station_id } = req.body;

    const schedule = await prisma.staff_schedules.findUnique({
      where: { schedule_id: id },
    });

    if (!schedule) {
      throw new CustomError("Schedule not found", 404);
    }

    let shiftStart = shift_start ? parseDate(shift_start) : undefined;
    let shiftEnd = shift_end ? parseDate(shift_end) : undefined;

    if (shiftStart && shiftEnd && shiftEnd <= shiftStart) {
      throw new CustomError("shift_end must be greater than shift_start", 400);
    }

    if (!shiftStart && shiftEnd) {
      shiftStart = schedule.shift_start;
    }

    if (!shiftEnd && shiftStart) {
      shiftEnd = schedule.shift_end;
    }

    if (shiftStart && shiftEnd) {
      await checkScheduleOverlap(schedule.staff_id, shiftStart, shiftEnd, schedule.schedule_id);
    }

    const data: Prisma.staff_schedulesUpdateInput = {};

    if (shiftStart) {
      data.shift_start = shiftStart;
      data.shift_date = getShiftDate(shiftStart);
    }
    if (shiftEnd) {
      data.shift_end = shiftEnd;
    }
    if (status) {
      data.status = normalizeStatus(status);
    }
    if (typeof notes === "string") {
      data.notes = notes;
    }
    if (station_id !== undefined) {
      if (station_id === null || station_id === "null") {
        data.stations = { disconnect: true };
      } else if (typeof station_id === "string" && station_id.trim().length > 0) {
        data.stations = {
          connect: { station_id: station_id.trim() },
        };
      } else {
        throw new CustomError("station_id must be a valid string or null", 400);
      }
    }

    const updated = await prisma.staff_schedules.update({
      where: { schedule_id: id },
      data,
      include: {
        users: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        stations: {
          select: {
            station_id: true,
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Staff schedule updated",
      data: updated,
    });
  }
);

export const adminDeleteStaffSchedule = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.staff_schedules.delete({
      where: { schedule_id: id },
    });

    res.status(200).json({
      success: true,
      message: "Staff schedule deleted",
    });
  }
);

