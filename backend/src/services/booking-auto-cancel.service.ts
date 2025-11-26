import { Prisma } from "@prisma/client";
import { notificationService, prisma } from "../server";
import {
  releaseBookingHold,
  type BookingHoldFields,
  buildBookingUncheckedUpdate,
} from "./booking-hold.service";

/**
 * Auto-cancel bookings that are not checked in within 30 minutes after scheduled time
 * This should run as a cron job every 5 minutes
 * Example: Booking at 14:00 → Only cancel if current time is 14:30 or later
 */
export async function autoCancelExpiredBookings() {
  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.warn(
        "⚠️ DATABASE_URL not found, skipping auto-cancel expired bookings"
      );
      return { cancelled: 0, errors: [] };
    }

    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago

    // Find bookings that:
    // 1. Are pending or confirmed (not completed/cancelled)
    // 2. Scheduled time was more than 30 minutes ago
    // 3. Not checked in yet (checked_in_at is null)
    // 4. Not already completed or cancelled
    const expiredBookings = await prisma.bookings.findMany({
      where: {
        status: { in: ["pending", "confirmed"] }, // ✅ Cancel both pending and confirmed bookings
        scheduled_at: {
          lte: thirtyMinutesAgo, // Scheduled time was more than 30 minutes ago
        },
        checked_in_at: null, // ✅ User hasn't checked in (bỏ PIN check)
      },
      include: {
        users_bookings_user_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        stations: {
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
      updated: Awaited<ReturnType<typeof prisma.bookings.update>>;
      walletRefundAmount: number;
    }[] = [];

    for (const booking of expiredBookings) {
      // Tạo message rõ ràng: khách hàng không đến
      const autoCancelNote =
        booking.status === "confirmed"
          ? "Tự động hủy: Khách hàng không đến trong vòng 30 phút sau giờ hẹn đã được xác nhận."
          : "Tự động hủy: Khách hàng không đến trong vòng 30 phút sau giờ hẹn.";

      const { updatedBooking, walletRefundAmount } = await prisma.$transaction(
        async (tx) => {
          // ✅ Không hoàn tiền/lượt khi hủy do khách hàng không đến (shouldRefund = false)
          const release = await releaseBookingHold({
            tx,
            booking: booking as unknown as BookingHoldFields,
            actorUserId: booking.user_id,
            notes: autoCancelNote,
            shouldRefund: false, // ✅ Forfeit: không hoàn tiền/lượt
          });

          const bookingUpdateData: Prisma.bookingsUncheckedUpdateInput = {
            ...buildBookingUncheckedUpdate(release.bookingUpdate),
            status: "cancelled",
            notes: booking.notes
              ? `${booking.notes}\n${autoCancelNote}`
              : autoCancelNote,
          };

          const updated = await tx.bookings.update({
            where: { booking_id: booking.booking_id },
            data: bookingUpdateData,
          });

          return {
            updatedBooking: updated,
            walletRefundAmount: release.walletRefundAmount,
          };
        }
      );

      cancelledBookings.push({
        original: booking,
        updated: updatedBooking,
        walletRefundAmount,
      });

      try {
        // ✅ Không có message hoàn tiền vì đã forfeit (không hoàn)
        await notificationService.sendNotification({
          type: "booking_cancelled",
          userId: booking.user_id,
          title: "Đặt chỗ đã bị hủy tự động",
          message: `Đặt chỗ của bạn tại ${booking.stations.name} đã bị hủy tự động do bạn không đến trong vòng 30 phút sau giờ hẹn. Khoản giữ và lượt đổi pin đã bị hủy do không đến đúng giờ.`,
          data: {
            email: booking.users_bookings_user_idTousers.email,
            userName: booking.users_bookings_user_idTousers.full_name,
            bookingId: booking.booking_code,
            stationName: booking.stations.name,
            stationAddress: booking.stations.address,
            scheduledTime: booking.scheduled_at.toISOString(),
            cancelledAt: new Date().toISOString(),
            wallet_refund_amount: walletRefundAmount,
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
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.warn("⚠️ DATABASE_URL not found, skipping booking reminders");
      return { remindersSent: 0, finalRemindersSent: 0, errors: [] };
    }

    const now = new Date();
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

    // Find bookings scheduled in 30 minutes (send reminder)
    const bookingsNeedingReminder = await prisma.bookings.findMany({
      where: {
        status: { in: ["pending", "confirmed"] },
        scheduled_at: {
          gte: new Date(thirtyMinutesLater.getTime() - 5 * 60 * 1000), // 5 minutes window
          lte: new Date(thirtyMinutesLater.getTime() + 5 * 60 * 1000),
        },
      },
      include: {
        users_bookings_user_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        stations: {
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
          message: `Bạn có đặt chỗ tại ${booking.stations.name} sau 30 phút nữa. Vui lòng chuẩn bị đến đúng giờ.`,
          data: {
            email: booking.users_bookings_user_idTousers.email,
            userName: booking.users_bookings_user_idTousers.full_name,
            bookingId: booking.booking_code,
            stationName: booking.stations.name,
            stationAddress: booking.stations.address,
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
    const bookingsNeedingFinalReminder = await prisma.bookings.findMany({
      where: {
        status: { in: ["pending", "confirmed"] },
        scheduled_at: {
          gte: new Date(tenMinutesLater.getTime() - 2 * 60 * 1000), // 2 minutes window
          lte: new Date(tenMinutesLater.getTime() + 2 * 60 * 1000),
        },
      },
      include: {
        users_bookings_user_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        stations: {
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
          message: `Bạn có đặt chỗ tại ${booking.stations.name} sau 10 phút nữa. Vui lòng đến đúng giờ để tránh bị hủy tự động.`,
          data: {
            email: booking.users_bookings_user_idTousers.email,
            userName: booking.users_bookings_user_idTousers.full_name,
            bookingId: booking.booking_code,
            stationName: booking.stations.name,
            stationAddress: booking.stations.address,
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
 * Auto-cancel instant bookings that are not checked in within 30 minutes
 * This should run as a cron job every 5 minutes
 * Example: Instant booking created at 14:00 → Only cancel if current time is 14:30 or later
 */
export async function autoCancelInstantBookings() {
  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.warn(
        "⚠️ DATABASE_URL not found, skipping auto-cancel instant bookings"
      );
      return { cancelled: 0, errors: [] };
    }
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago

    // Find instant bookings that:
    // 1. Are pending or confirmed
    // 2. Created/scheduled more than 30 minutes ago
    // 3. Not checked in yet (checked_in_at is null)
    // 4. Not already completed or cancelled
    const expiredInstantBookings = await prisma.bookings.findMany({
      where: {
        is_instant: true, // ✅ Only instant bookings
        status: { in: ["pending", "confirmed"] },
        scheduled_at: {
          lte: thirtyMinutesAgo, // Created/scheduled more than 30 minutes ago
        },
        checked_in_at: null, // User hasn't checked in
      },
      include: {
        users_bookings_user_idTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        stations: {
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
      updated: Awaited<ReturnType<typeof prisma.bookings.update>>;
      walletRefundAmount: number;
    }[] = [];

    for (const booking of expiredInstantBookings) {
      const autoCancelNote =
        "Auto-cancelled: Instant booking expired - User did not arrive within 30 minutes.";

      const { updatedBooking, walletRefundAmount } = await prisma.$transaction(
        async (tx) => {
          // ✅ Không hoàn tiền/lượt khi hủy do khách hàng không đến (shouldRefund = false)
          const release = await releaseBookingHold({
            tx,
            booking: booking as unknown as BookingHoldFields,
            actorUserId: booking.user_id,
            notes: autoCancelNote,
            shouldRefund: false, // ✅ Forfeit: không hoàn tiền/lượt
          });

          const bookingUpdateData: Prisma.bookingsUncheckedUpdateInput = {
            ...buildBookingUncheckedUpdate(release.bookingUpdate),
            status: "cancelled",
            notes: booking.notes
              ? `${booking.notes}\n${autoCancelNote}`
              : autoCancelNote,
          };

          const updated = await tx.bookings.update({
            where: { booking_id: booking.booking_id },
            data: bookingUpdateData,
          });

          return {
            updatedBooking: updated,
            walletRefundAmount: release.walletRefundAmount,
          };
        }
      );

      cancelledBookings.push({
        original: booking,
        updated: updatedBooking,
        walletRefundAmount,
      });

      try {
        // ✅ Không có message hoàn tiền vì đã forfeit (không hoàn)
        await notificationService.sendNotification({
          type: "booking_cancelled",
          userId: booking.user_id,
          title: "Đặt chỗ ngay đã bị hủy tự động",
          message: `Đặt chỗ ngay của bạn tại ${booking.stations.name} đã bị hủy tự động do bạn không đến trong vòng 30 phút sau giờ hẹn. Khoản giữ và lượt đổi pin đã bị hủy do không đến đúng giờ.`,
          data: {
            email: booking.users_bookings_user_idTousers.email,
            userName: booking.users_bookings_user_idTousers.full_name,
            bookingId: booking.booking_code,
            stationName: booking.stations.name,
            stationAddress: booking.stations.address,
            scheduledTime: booking.scheduled_at.toISOString(),
            cancelledAt: new Date().toISOString(),
            wallet_refund_amount: walletRefundAmount,
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
