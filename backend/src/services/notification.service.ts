import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { sendEmail } from "./email.service";

export interface NotificationData {
  type:
    | "booking_confirmed"
    | "booking_cancelled"
    | "pin_code"
    | "payment_success"
    | "payment_failed"
    | "subscription_expiring"
    | "subscription_expired";
  userId: string;
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(httpServer: HTTPServer) {
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
   * Send real-time notification to user
   */
  async sendNotification(notification: NotificationData): Promise<void> {
    try {
      // Send real-time notification via WebSocket
      this.io.to(`user_${notification.userId}`).emit("notification", {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        timestamp: new Date().toISOString(),
      });

      // Send email notification
      await this.sendEmailNotification(notification);

      console.log(
        `Notification sent to user ${notification.userId}: ${notification.title}`
      );
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }

  /**
   * Send email notification based on type
   */
  private async sendEmailNotification(
    notification: NotificationData
  ): Promise<void> {
    try {
      let subject = "";
      let html = "";

      switch (notification.type) {
        case "booking_confirmed":
          subject = "Đặt chỗ thành công - EV Battery Swap";
          html = this.generateBookingConfirmationEmail(notification);
          break;
        case "booking_cancelled":
          subject = "Hủy đặt chỗ - EV Battery Swap";
          html = this.generateBookingCancellationEmail(notification);
          break;
        case "pin_code":
          subject = "Mã PIN xác nhận - EV Battery Swap";
          html = this.generatePinCodeEmail(notification);
          break;
        case "payment_success":
          subject = "Thanh toán thành công - EV Battery Swap";
          html = this.generatePaymentSuccessEmail(notification);
          break;
        case "payment_failed":
          subject = "Thanh toán thất bại - EV Battery Swap";
          html = this.generatePaymentFailedEmail(notification);
          break;
        case "subscription_expiring":
          subject = "Gói đăng ký sắp hết hạn - EV Battery Swap";
          html = this.generateSubscriptionExpiringEmail(notification);
          break;
        case "subscription_expired":
          subject = "Gói đăng ký đã hết hạn - EV Battery Swap";
          html = this.generateSubscriptionExpiredEmail(notification);
          break;
        default:
          subject = "Thông báo - EV Battery Swap";
          html = this.generateGenericEmail(notification);
      }

      await sendEmail({
        to: notification.data?.email || "",
        subject,
        html,
      });
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  }

  private generateBookingConfirmationEmail(
    notification: NotificationData
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Đặt chỗ thành công</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .booking-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .pin-code { font-size: 24px; font-weight: bold; color: #4CAF50; text-align: center; padding: 10px; background: #e8f5e8; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Đặt chỗ thành công!</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${notification.data?.userName || "Quý khách"},</h2>
            <p>Chúng tôi xác nhận đặt chỗ của bạn đã thành công!</p>
            
            <div class="booking-details">
              <h3>📋 Thông tin đặt chỗ:</h3>
              <p><strong>Mã đặt chỗ:</strong> ${notification.data?.bookingId || "N/A"}</p>
              <p><strong>Trạm:</strong> ${notification.data?.stationName || "N/A"}</p>
              <p><strong>Địa chỉ:</strong> ${notification.data?.stationAddress || "N/A"}</p>
              <p><strong>Thời gian:</strong> ${notification.data?.bookingTime || "N/A"}</p>
              <p><strong>Loại pin:</strong> ${notification.data?.batteryType || "N/A"}</p>
            </div>

            <div class="pin-code">
              <h3>🔐 Mã PIN xác nhận:</h3>
              <div style="font-size: 32px; letter-spacing: 5px;">${notification.data?.pinCode || "N/A"}</div>
              <p><small>Vui lòng sử dụng mã này khi đến trạm</small></p>
            </div>

            <p><strong>Lưu ý:</strong> Mã PIN có hiệu lực trong 30 phút. Vui lòng đến trạm đúng giờ.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePinCodeEmail(notification: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Mã PIN xác nhận</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .pin-code { font-size: 32px; font-weight: bold; color: #2196F3; text-align: center; padding: 20px; background: #e3f2fd; border-radius: 10px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Mã PIN xác nhận</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${notification.data?.userName || "Quý khách"},</h2>
            <p>Đây là mã PIN xác nhận cho đặt chỗ của bạn:</p>
            
            <div class="pin-code">
              ${notification.data?.pinCode || "N/A"}
            </div>

            <p><strong>Thông tin đặt chỗ:</strong></p>
            <ul>
              <li>Mã đặt chỗ: ${notification.data?.bookingId || "N/A"}</li>
              <li>Trạm: ${notification.data?.stationName || "N/A"}</li>
              <li>Thời gian: ${notification.data?.bookingTime || "N/A"}</li>
            </ul>

            <p><strong>Lưu ý:</strong> Mã PIN có hiệu lực trong 30 phút. Vui lòng đến trạm đúng giờ.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateBookingCancellationEmail(
    notification: NotificationData
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Hủy đặt chỗ</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Hủy đặt chỗ</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${notification.data?.userName || "Quý khách"},</h2>
            <p>Đặt chỗ của bạn đã được hủy.</p>
            
            <p><strong>Mã đặt chỗ:</strong> ${notification.data?.bookingId || "N/A"}</p>
            <p><strong>Lý do:</strong> ${notification.data?.reason || "Không xác định"}</p>
            
            <p>Nếu bạn có thắc mắc, vui lòng liên hệ hỗ trợ.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePaymentSuccessEmail(notification: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Thanh toán thành công</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Thanh toán thành công</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${notification.data?.userName || "Quý khách"},</h2>
            <p>Thanh toán của bạn đã được xử lý thành công!</p>
            
            <p><strong>Số tiền:</strong> ${notification.data?.amount || "N/A"} VND</p>
            <p><strong>Mã giao dịch:</strong> ${notification.data?.transactionId || "N/A"}</p>
            <p><strong>Thời gian:</strong> ${notification.data?.paymentTime || "N/A"}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePaymentFailedEmail(notification: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Thanh toán thất bại</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Thanh toán thất bại</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${notification.data?.userName || "Quý khách"},</h2>
            <p>Thanh toán của bạn không thành công.</p>
            
            <p><strong>Lý do:</strong> ${notification.data?.reason || "Không xác định"}</p>
            <p><strong>Mã giao dịch:</strong> ${notification.data?.transactionId || "N/A"}</p>
            
            <p>Vui lòng thử lại hoặc liên hệ hỗ trợ nếu cần thiết.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateGenericEmail(notification: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Thông báo</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 Thông báo</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate subscription expiring email
   */
  private generateSubscriptionExpiringEmail(
    notification: NotificationData
  ): string {
    return `
      <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #ffc107; color: #000; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Gói đăng ký sắp hết hạn</h1>
            </div>
            <div class="content">
              <h2>${notification.title}</h2>
              <p>Xin chào <strong>${notification.data?.userName}</strong>,</p>
              <p>Gói đăng ký <strong>${notification.data?.packageName}</strong> của bạn sẽ hết hạn vào <strong>${notification.data?.expiryDate}</strong>.</p>
              <p><strong>Số lần đổi pin còn lại:</strong> ${notification.data?.remainingSwaps}</p>
              <p>Hãy gia hạn ngay để tiếp tục sử dụng dịch vụ miễn phí!</p>
              <a href="#" class="button">Gia hạn ngay</a>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate subscription expired email
   */
  private generateSubscriptionExpiredEmail(
    notification: NotificationData
  ): string {
    return `
      <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Gói đăng ký đã hết hạn</h1>
            </div>
            <div class="content">
              <h2>${notification.title}</h2>
              <p>Xin chào <strong>${notification.data?.userName}</strong>,</p>
              <p>Gói đăng ký <strong>${notification.data?.packageName}</strong> của bạn đã hết hạn.</p>
              <p>Từ bây giờ, bạn sẽ được tính phí cho mỗi lần đổi pin.</p>
              <p>Hãy đăng ký gói mới để tiếp tục sử dụng dịch vụ miễn phí!</p>
              <a href="#" class="button">Đăng ký gói mới</a>
            </div>
          </div>
        </body>
      </html>
    `;
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
