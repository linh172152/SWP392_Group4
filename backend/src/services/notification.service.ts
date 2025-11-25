import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { PrismaClient } from "@prisma/client";

export interface NotificationData {
  type:
    | "booking_confirmed"
    | "booking_cancelled"
    | "booking_reminder"
    | "booking_final_reminder"
    | "payment_success"
    | "payment_failed"
    | "topup_success"
    | "cancellation_fee";
  userId: string;
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private prisma: PrismaClient;

  constructor(httpServer: HTTPServer, prismaClient: PrismaClient) {
    this.prisma = prismaClient;
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);

      // User joins their personal room
      socket.on("join_user_room", (userId: string) => {
        socket.join(`user_${userId}`);
        this.connectedUsers.set(userId, socket.id);
        console.log(`User ${userId} joined their room`);
      });

      // User leaves their personal room
      socket.on("leave_user_room", (userId: string) => {
        socket.leave(`user_${userId}`);
        this.connectedUsers.delete(userId);
        console.log(`User ${userId} left their room`);
      });

      socket.on("disconnect", () => {
        // Remove user from connected users
        for (const [userId, socketId] of this.connectedUsers.entries()) {
          if (socketId === socket.id) {
            this.connectedUsers.delete(userId);
            break;
          }
        }
        console.log(`User disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Send notification to user (In-App + Real-time push)
   * ✅ Removed: Email/SMS sending
   * ✅ New: Create Notification record in database
   */
  async sendNotification(notification: NotificationData): Promise<void> {
    try {
      // 1. Create Notification record in database
      const notificationRecord = await this.prisma.notifications.create({
        data: {
          user_id: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data || {},
          is_read: false,
        },
      });

      // 2. Send real-time notification via WebSocket
      this.io.to(`user_${notification.userId}`).emit("notification", {
        notification_id: notificationRecord.notification_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        timestamp: notificationRecord.created_at.toISOString(),
      });

      console.log(
        `✅ Notification created and sent to user ${notification.userId}: ${notification.title}`
      );
    } catch (error) {
      console.error("Failed to send notification:", error);
      throw error;
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
