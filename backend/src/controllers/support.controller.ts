import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { asyncHandler } from "../middlewares/error.middleware";
import { CustomError } from "../middlewares/error.middleware";
import { prisma } from "../server";

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

    const tickets = await prisma.support_tickets.findMany({
      where: whereClause,
      include: {
        users_support_tickets_assigned_to_staff_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        ticket_replies: {
          select: {
            reply_id: true,
            message: true,
            is_staff: true,
            created_at: true,
            users: {
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

    const total = await prisma.support_tickets.count({ where: whereClause });

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
    const ticketNumber = `TKT${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const ticket = await prisma.support_tickets.create({
      data: {
        ticket_number: ticketNumber,
        user_id: userId,
        category: category as string,
        subject: subject as string,
        description: description as string,
        priority: priority as string,
        status: "open",
        updated_at: new Date(),
      } as Prisma.support_ticketsUncheckedCreateInput,
      include: {
        users_support_tickets_user_idTousers: {
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

    const ticket = await prisma.support_tickets.findFirst({
      where: {
        ticket_id: id,
        user_id: userId,
      },
      include: {
        users_support_tickets_user_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        users_support_tickets_assigned_to_staff_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        ticket_replies: {
          include: {
            users: {
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

    const ticket = await prisma.support_tickets.findFirst({
      where: {
        ticket_id: id,
        user_id: userId,
        status: { in: ["open", "in_progress"] },
      },
    });

    if (!ticket) {
      throw new CustomError("Ticket not found or cannot be updated", 404);
    }

    const updatedTicket = await prisma.support_tickets.update({
      where: { ticket_id: id },
      data: {
        subject,
        description,
        priority,
      },
      include: {
        users_support_tickets_user_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        users_support_tickets_assigned_to_staff_idTousers: {
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
    const ticket = await prisma.support_tickets.findFirst({
      where: {
        ticket_id: id,
        user_id: userId,
      },
    });

    if (!ticket) {
      throw new CustomError("Ticket not found", 404);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const replies = await prisma.ticket_replies.findMany({
      where: { ticket_id: id },
      include: {
        users: {
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

    const total = await prisma.ticket_replies.count({
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
 * Admin: list all tickets with filters
 */
export const adminListTickets = asyncHandler(
  async (req: Request, res: Response) => {
    const { status, priority, category, assigned, page = 1, limit = 10 } =
      req.query;

    const whereClause: any = {};

    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (category) whereClause.category = category;
    if (assigned === "true") whereClause.assigned_to_staff_id = { not: null };
    if (assigned === "false") whereClause.assigned_to_staff_id = null;

    const take = Math.max(1, parseInt(limit as string, 10));
    const skip = (Math.max(1, parseInt(page as string, 10)) - 1) * take;

    const [tickets, total] = await prisma.$transaction([
      prisma.support_tickets.findMany({
        where: whereClause,
        include: {
          users_support_tickets_user_idTousers: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
              phone: true,
            },
          },
          users_support_tickets_assigned_to_staff_idTousers: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take,
      }),
      prisma.support_tickets.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      message: "Tickets retrieved successfully",
      data: {
        tickets,
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

/**
 * Admin: get detailed ticket info
 */
export const adminGetTicketDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const ticket = await prisma.support_tickets.findUnique({
      where: { ticket_id: id },
      include: {
        users_support_tickets_user_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        users_support_tickets_assigned_to_staff_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        ticket_replies: {
          include: {
            users: {
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
 * Admin: assign ticket to staff
 */
export const adminAssignTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = req.user?.userId;
    const { id } = req.params;
    const { staff_id } = req.body;

    if (!adminId) {
      throw new CustomError("Admin not authenticated", 401);
    }

    if (!staff_id) {
      throw new CustomError("staff_id is required", 400);
    }

    const staff = await prisma.users.findFirst({
      where: { user_id: staff_id, role: "STAFF" },
    });

    if (!staff) {
      throw new CustomError("Staff not found", 404);
    }

    const ticket = await prisma.support_tickets.findUnique({
      where: { ticket_id: id },
    });

    if (!ticket) {
      throw new CustomError("Ticket not found", 404);
    }

    const updated = await prisma.support_tickets.update({
      where: { ticket_id: id },
      data: {
        assigned_to_staff_id: staff_id,
        status: ticket.status === "open" ? "in_progress" : ticket.status,
      },
      include: {
        users_support_tickets_assigned_to_staff_idTousers: {
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
      message: "Ticket assigned successfully",
      data: updated,
    });
  }
);

/**
 * Admin: update ticket status
 */
export const adminUpdateTicketStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = req.user?.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (!adminId) {
      throw new CustomError("Admin not authenticated", 401);
    }

    if (!status) {
      throw new CustomError("status is required", 400);
    }

    const allowedStatuses = ["open", "in_progress", "resolved", "closed"];
    if (!allowedStatuses.includes(status)) {
      throw new CustomError("Invalid ticket status", 400);
    }

    const updated = await prisma.support_tickets.update({
      where: { ticket_id: id },
      data: { status },
    });

    res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      data: updated,
    });
  }
);

/**
 * Admin: reply to ticket
 */
export const adminReplyTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = req.user?.userId;
    const { id } = req.params;
    const { message } = req.body;

    if (!adminId) {
      throw new CustomError("Admin not authenticated", 401);
    }

    if (!message || typeof message !== "string") {
      throw new CustomError("message is required", 400);
    }

    const ticket = await prisma.support_tickets.findUnique({
      where: { ticket_id: id },
    });

    if (!ticket) {
      throw new CustomError("Ticket not found", 404);
    }

    const reply = await prisma.ticket_replies.create({
      data: {
        ticket_id: id,
        user_id: adminId,
        message: message as string,
        is_staff: true,
      } as Prisma.ticket_repliesUncheckedCreateInput,
      include: {
        users: {
          select: {
            user_id: true,
            full_name: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Reply added successfully",
      data: reply,
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
    const ticket = await prisma.support_tickets.findFirst({
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
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { role: true },
    });

    const isStaff = user?.role === "STAFF" || user?.role === "ADMIN";

    const reply = await prisma.ticket_replies.create({
      data: {
        ticket_id: id,
        user_id: userId,
        message: message as string,
        is_staff: isStaff,
      } as Prisma.ticket_repliesUncheckedCreateInput,
      include: {
        users: {
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
      await prisma.support_tickets.update({
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

  const ticket = await prisma.support_tickets.findFirst({
    where: {
      ticket_id: id,
      user_id: userId,
      status: { in: ["open", "in_progress"] },
    },
  });

  if (!ticket) {
    throw new CustomError("Ticket not found or cannot be closed", 404);
  }

  const updatedTicket = await prisma.support_tickets.update({
    where: { ticket_id: id },
    data: {
      status: "closed",
      resolved_at: new Date(),
    },
    include: {
      users_support_tickets_user_idTousers: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
      users_support_tickets_assigned_to_staff_idTousers: {
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
