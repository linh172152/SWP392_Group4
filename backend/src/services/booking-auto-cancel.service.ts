import { PrismaClient, Prisma } from "@prisma/client";
import { notificationService } from "../server";
import {
  releaseBookingHold,
  type BookingHoldFields,
  buildBookingUncheckedUpdate,
} from "./booking-hold.service";

const prisma = new PrismaClient();

/**
 * Auto-cancel bookings that are not checked in within 10 minutes after scheduled time
 * This should run as a cron job every 5 minutes
 */
export async function autoCancelExpiredBookings() {
  try {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago

    // Find bookings that:
    // 1. Are confirmed
    // 2. Scheduled time was more than 10 minutes ago
    // 3. Not checked in yet (checked_in_at is null)
    // 4. Not already completed or cancelled
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: "confirmed", // Only confirmed bookings can be auto-cancelled
        scheduled_at: {
          lte: tenMinutesAgo, // Scheduled time was more than 10 minutes ago
        },
        checked_in_at: null, // ✅ User hasn't checked in (bỏ PIN check)
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        station: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    });

    if (expiredBookings.length === 0) {
      return { cancelled: 0, message: "No expired bookings to cancel" };
    }

    const cancelledBookings: {
      original: (typeof expiredBookings)[number];
      updated: Awaited<ReturnType<typeof prisma.booking.update>>;
      walletForfeitedAmount: number;
    }[] = [];

    for (const booking of expiredBookings) {
      const autoCancelNote =
        "Auto-cancelled: User did not arrive within 10 minutes of scheduled time.";

      const { updatedBooking, walletForfeitedAmount } =
        await prisma.$transaction(async (tx) => {
          const release = await releaseBookingHold({
            tx,
            booking: booking as unknown as BookingHoldFields,
            actorUserId: booking.user_id,
            notes: autoCancelNote,
          });

          const bookingUpdateData: Prisma.BookingUncheckedUpdateInput = {
            ...buildBookingUncheckedUpdate(release.bookingUpdate),
            status: "cancelled",
            notes: booking.notes
              ? `${booking.notes}\n${autoCancelNote}`
              : autoCancelNote,
          };

          const updated = await tx.booking.update({
            where: { booking_id: booking.booking_id },
            data: bookingUpdateData,
          });

          return {
            updatedBooking: updated,
            walletForfeitedAmount: release.walletForfeitedAmount,
          };
        });

      cancelledBookings.push({
        original: booking,
        updated: updatedBooking,
        walletForfeitedAmount,
      });

      try {
        const walletMessage =
          walletForfeitedAmount > 0
            ? ` Khoản đã thanh toán ${walletForfeitedAmount.toLocaleString("vi-VN")}đ sẽ không được hoàn theo chính sách.`
            : "";

        await notificationService.sendNotification({
          type: "booking_cancelled",
          userId: booking.user_id,
          title: "Đặt chỗ đã bị hủy tự động",
          message: `Đặt chỗ của bạn tại ${booking.station.name} đã bị hủy tự động do bạn không có mặt trong vòng 10 phút sau giờ đã đặt.${walletMessage}`,
          data: {
            email: booking.user.email,
            userName: booking.user.full_name,
            bookingId: booking.booking_code,
            stationName: booking.station.name,
            stationAddress: booking.station.address,
            scheduledTime: booking.scheduled_at.toISOString(),
            cancelledAt: new Date().toISOString(),
            wallet_forfeited_amount: walletForfeitedAmount,
          },
        });
      } catch (error) {
        console.error(
          `Failed to send cancellation notification for booking ${booking.booking_code}:`,
          error
        );
      }
    }

    return {
      cancelled: cancelledBookings.length,
      bookings: cancelledBookings.map((b) => b.updated.booking_code),
      message: `Successfully auto-cancelled ${cancelledBookings.length} expired booking(s)`,
    };
  } catch (error) {
    console.error("Error in autoCancelExpiredBookings:", error);
    throw error;
  }
}

/**
 * Send reminder notifications to users before scheduled time
 * This should run as a cron job every 5 minutes
 */
export async function sendBookingReminders() {
  try {
    const now = new Date();
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

    // Find bookings scheduled in 30 minutes (send reminder)
    const bookingsNeedingReminder = await prisma.booking.findMany({
      where: {
        status: { in: ["pending", "confirmed"] },
        scheduled_at: {
          gte: new Date(thirtyMinutesLater.getTime() - 5 * 60 * 1000), // 5 minutes window
          lte: new Date(thirtyMinutesLater.getTime() + 5 * 60 * 1000),
        },
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        station: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    });

    // Send 30-minute reminders
    for (const booking of bookingsNeedingReminder) {
      try {
        await notificationService.sendNotification({
          type: "booking_reminder",
          userId: booking.user_id,
          title: "Nhắc nhở đặt chỗ",
          message: `Bạn có đặt chỗ tại ${booking.station.name} sau 30 phút nữa. Vui lòng chuẩn bị đến đúng giờ.`,
          data: {
            email: booking.user.email,
            userName: booking.user.full_name,
            bookingId: booking.booking_code,
            stationName: booking.station.name,
            stationAddress: booking.station.address,
            scheduledTime: booking.scheduled_at.toISOString(),
          },
        });
      } catch (error) {
        console.error(
          `Failed to send reminder for booking ${booking.booking_code}:`,
          error
        );
      }
    }

    // Find bookings scheduled in 10 minutes (final reminder)
    const bookingsNeedingFinalReminder = await prisma.booking.findMany({
      where: {
        status: { in: ["pending", "confirmed"] },
        scheduled_at: {
          gte: new Date(tenMinutesLater.getTime() - 2 * 60 * 1000), // 2 minutes window
          lte: new Date(tenMinutesLater.getTime() + 2 * 60 * 1000),
        },
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        station: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    });

    // Send 10-minute final reminders
    for (const booking of bookingsNeedingFinalReminder) {
      try {
        await notificationService.sendNotification({
          type: "booking_final_reminder",
          userId: booking.user_id,
          title: "Nhắc nhở cuối cùng",
          message: `Bạn có đặt chỗ tại ${booking.station.name} sau 10 phút nữa. Vui lòng đến đúng giờ để tránh bị hủy tự động.`,
          data: {
            email: booking.user.email,
            userName: booking.user.full_name,
            bookingId: booking.booking_code,
            stationName: booking.station.name,
            stationAddress: booking.station.address,
            scheduledTime: booking.scheduled_at.toISOString(),
            // ✅ Removed: PIN code (không dùng nữa)
          },
        });
      } catch (error) {
        console.error(
          `Failed to send final reminder for booking ${booking.booking_code}:`,
          error
        );
      }
    }

    return {
      remindersSent: bookingsNeedingReminder.length,
      finalRemindersSent: bookingsNeedingFinalReminder.length,
      message: `Sent ${bookingsNeedingReminder.length} reminders and ${bookingsNeedingFinalReminder.length} final reminders`,
    };
  } catch (error) {
    console.error("Error in sendBookingReminders:", error);
    throw error;
  }
}

/**
 * Auto-cancel instant bookings that are not checked in within 15 minutes
 * This should run as a cron job every 5 minutes
 */
export async function autoCancelInstantBookings() {
  try {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago

    // Find instant bookings that:
    // 1. Are pending or confirmed
    // 2. Created/scheduled more than 15 minutes ago
    // 3. Not checked in yet (checked_in_at is null)
    // 4. Not already completed or cancelled
    const expiredInstantBookings = await prisma.booking.findMany({
      where: {
        is_instant: true, // ✅ Only instant bookings
        status: { in: ["pending", "confirmed"] },
        scheduled_at: {
          lte: fifteenMinutesAgo, // Created/scheduled more than 15 minutes ago
        },
        checked_in_at: null, // User hasn't checked in
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        station: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    });

    if (expiredInstantBookings.length === 0) {
      return { cancelled: 0, message: "No expired instant bookings to cancel" };
    }

    const cancelledBookings: {
      original: (typeof expiredInstantBookings)[number];
      updated: Awaited<ReturnType<typeof prisma.booking.update>>;
      walletForfeitedAmount: number;
    }[] = [];

    for (const booking of expiredInstantBookings) {
      const autoCancelNote =
        "Auto-cancelled: Instant booking expired - User did not arrive within 15 minutes.";

      const { updatedBooking, walletForfeitedAmount } =
        await prisma.$transaction(async (tx) => {
          const release = await releaseBookingHold({
            tx,
            booking: booking as unknown as BookingHoldFields,
            actorUserId: booking.user_id,
            notes: autoCancelNote,
          });

          const bookingUpdateData: Prisma.BookingUncheckedUpdateInput = {
            ...buildBookingUncheckedUpdate(release.bookingUpdate),
            status: "cancelled",
            notes: booking.notes
              ? `${booking.notes}\n${autoCancelNote}`
              : autoCancelNote,
          };

          const updated = await tx.booking.update({
            where: { booking_id: booking.booking_id },
            data: bookingUpdateData,
          });

          return {
            updatedBooking: updated,
            walletForfeitedAmount: release.walletForfeitedAmount,
          };
        });

      cancelledBookings.push({
        original: booking,
        updated: updatedBooking,
        walletForfeitedAmount,
      });

      try {
        const walletMessage =
          walletForfeitedAmount > 0
            ? ` Khoản đã thanh toán ${walletForfeitedAmount.toLocaleString("vi-VN")}đ sẽ không được hoàn theo chính sách.`
            : "";

        await notificationService.sendNotification({
          type: "booking_cancelled",
          userId: booking.user_id,
          title: "Đặt chỗ ngay đã bị hủy tự động",
          message: `Đặt chỗ ngay của bạn tại ${booking.station.name} đã bị hủy tự động do bạn không có mặt trong vòng 15 phút.${walletMessage}`,
          data: {
            email: booking.user.email,
            userName: booking.user.full_name,
            bookingId: booking.booking_code,
            stationName: booking.station.name,
            stationAddress: booking.station.address,
            scheduledTime: booking.scheduled_at.toISOString(),
            cancelledAt: new Date().toISOString(),
            wallet_forfeited_amount: walletForfeitedAmount,
          },
        });
      } catch (error) {
        console.error(
          `Failed to send cancellation notification for instant booking ${booking.booking_code}:`,
          error
        );
      }
    }

    return {
      cancelled: cancelledBookings.length,
      bookings: cancelledBookings.map((b) => b.updated.booking_code),
      message: `Successfully auto-cancelled ${cancelledBookings.length} expired instant booking(s)`,
    };
  } catch (error) {
    console.error("Error in autoCancelInstantBookings:", error);
    throw error;
  }
}
