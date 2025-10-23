import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";

const prisma = new PrismaClient();

/**
 * Get user tickets
 */
export const getUserTickets = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { status, priority, category, page = 1, limit = 10 } = req.query;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const whereClause: any = { user_id: userId };

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (category) {
      whereClause.category = category;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        assigned_to_staff: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        replies: {
          select: {
            reply_id: true,
            message: true,
            is_staff: true,
            created_at: true,
            user: {
              select: {
                user_id: true,
                full_name: true,
                role: true,
              },
            },
          },
          orderBy: { created_at: "asc" },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit as string),
    });

    const total = await prisma.supportTicket.count({ where: whereClause });

    res.status(200).json({
      success: true,
      message: "User tickets retrieved successfully",
      data: {
        tickets,
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
 * Create support ticket
 */
export const createSupportTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { category, subject, description, priority = "medium" } = req.body;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    if (!category || !subject || !description) {
      throw new CustomError(
        "Category, subject and description are required",
        400
      );
    }

    // Generate ticket number
    const ticketNumber = `TKT${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticket_number: ticketNumber,
        user_id: userId,
        category,
        subject,
        description,
        priority,
        status: "open",
      },
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
    });

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      data: ticket,
    });
  }
);

/**
 * Get ticket details
 */
export const getTicketDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        ticket_id: id,
        user_id: userId,
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        assigned_to_staff: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                user_id: true,
                full_name: true,
                role: true,
              },
            },
          },
          orderBy: { created_at: "asc" },
        },
      },
    });

    if (!ticket) {
      throw new CustomError("Ticket not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Ticket details retrieved successfully",
      data: ticket,
    });
  }
);

/**
 * Update ticket
 */
export const updateTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { subject, description, priority } = req.body;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        ticket_id: id,
        user_id: userId,
        status: { in: ["open", "in_progress"] },
      },
    });

    if (!ticket) {
      throw new CustomError("Ticket not found or cannot be updated", 404);
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { ticket_id: id },
      data: {
        subject,
        description,
        priority,
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        assigned_to_staff: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      data: updatedTicket,
    });
  }
);

/**
 * Get ticket replies
 */
export const getTicketReplies = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    // Check if ticket belongs to user
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        ticket_id: id,
        user_id: userId,
      },
    });

    if (!ticket) {
      throw new CustomError("Ticket not found", 404);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const replies = await prisma.ticketReply.findMany({
      where: { ticket_id: id },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
      skip,
      take: parseInt(limit as string),
    });

    const total = await prisma.ticketReply.count({
      where: { ticket_id: id },
    });

    res.status(200).json({
      success: true,
      message: "Ticket replies retrieved successfully",
      data: {
        replies,
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
 * Add ticket reply
 */
export const addTicketReply = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { message } = req.body;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    if (!message) {
      throw new CustomError("Message is required", 400);
    }

    // Check if ticket belongs to user
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        ticket_id: id,
        user_id: userId,
      },
    });

    if (!ticket) {
      throw new CustomError("Ticket not found", 404);
    }

    // Check if ticket is closed
    if (ticket.status === "closed") {
      throw new CustomError("Cannot reply to closed ticket", 400);
    }

    // Get user role to determine if reply is from staff
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true },
    });

    const isStaff = user?.role === "STAFF" || user?.role === "ADMIN";

    const reply = await prisma.ticketReply.create({
      data: {
        ticket_id: id,
        user_id: userId,
        message,
        is_staff: isStaff,
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            role: true,
          },
        },
      },
    });

    // If user is staff, update ticket status to in_progress
    if (isStaff && ticket.status === "open") {
      await prisma.supportTicket.update({
        where: { ticket_id: id },
        data: { status: "in_progress" },
      });
    }

    res.status(201).json({
      success: true,
      message: "Reply added successfully",
      data: reply,
    });
  }
);

/**
 * Close ticket
 */
export const closeTicket = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new CustomError("User not authenticated", 401);
  }

  const ticket = await prisma.supportTicket.findFirst({
    where: {
      ticket_id: id,
      user_id: userId,
      status: { in: ["open", "in_progress"] },
    },
  });

  if (!ticket) {
    throw new CustomError("Ticket not found or cannot be closed", 404);
  }

  const updatedTicket = await prisma.supportTicket.update({
    where: { ticket_id: id },
    data: {
      status: "closed",
      resolved_at: new Date(),
    },
    include: {
      user: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
      assigned_to_staff: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: "Ticket closed successfully",
    data: updatedTicket,
  });
});
