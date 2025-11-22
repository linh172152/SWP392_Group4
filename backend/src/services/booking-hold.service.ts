import { Prisma, BatteryStatus, PaymentStatus } from "@prisma/client";

export type BookingHoldFields = {
  booking_id: string;
  user_id: string;
  station_id: string;
  locked_battery_id: string | null;
  locked_battery_previous_status: BatteryStatus | null;
  locked_wallet_amount: Prisma.Decimal | null;
  locked_wallet_payment_id: string | null;
  locked_subscription_id: string | null;
  locked_swap_count: number;
  use_subscription: boolean;
};

type BookingUpdatePatch = {
  locked_battery_id?: string | null;
  locked_battery_previous_status?: BatteryStatus | null;
  locked_wallet_payment_id?: string | null;
  locked_wallet_amount?: Prisma.Decimal | number | null;
  locked_subscription_id?: string | null;
  locked_swap_count?: number;
  hold_expires_at?: Date | null;
};

type ReleaseParams = {
  tx: Prisma.TransactionClient;
  booking: BookingHoldFields;
  actorUserId?: string;
  notes?: string;
};

type ReleaseResult = {
  bookingUpdate: BookingUpdatePatch;
  walletRefundAmount: number;
  batteryReleasedId: string | null;
};

export function buildBookingUncheckedUpdate(
  patch: BookingUpdatePatch
): Prisma.bookingsUncheckedUpdateInput {
  const data: Prisma.bookingsUncheckedUpdateInput = {};

  if (patch.locked_battery_id !== undefined) {
    data.locked_battery_id = patch.locked_battery_id;
  }
  if (patch.locked_battery_previous_status !== undefined) {
    data.locked_battery_previous_status = patch.locked_battery_previous_status;
  }
  if (patch.locked_wallet_payment_id !== undefined) {
    data.locked_wallet_payment_id = patch.locked_wallet_payment_id;
  }
  if (patch.locked_wallet_amount !== undefined) {
    data.locked_wallet_amount =
      patch.locked_wallet_amount ?? new Prisma.Decimal(0);
  }
  if (patch.locked_subscription_id !== undefined) {
    data.locked_subscription_id = patch.locked_subscription_id;
  }
  if (patch.locked_swap_count !== undefined) {
    data.locked_swap_count = patch.locked_swap_count;
  }
  if (patch.hold_expires_at !== undefined) {
    data.hold_expires_at = patch.hold_expires_at;
  }

  return data;
}

const BATTERY_STATUS_DEFAULT = BatteryStatus.full;
const PAYMENT_STATUS_REFUNDED = "refunded" as unknown as PaymentStatus;
const PAYMENT_STATUS_COMPLETED = "completed" as unknown as PaymentStatus;

export async function releaseBookingHold({
  tx,
  booking,
  actorUserId,
  notes,
}: ReleaseParams): Promise<ReleaseResult> {
  let walletRefundAmount = 0;
  let batteryReleasedId: string | null = null;

  if (booking.locked_battery_id) {
    const targetStatus =
      booking.locked_battery_previous_status ?? BATTERY_STATUS_DEFAULT;

    await tx.batteries.update({
      where: { battery_id: booking.locked_battery_id },
      data: {
        status: targetStatus,
        updated_at: new Date(),
      },
    });

    await (tx as any).batteryHistory.create({
      data: {
        battery_id: booking.locked_battery_id,
        booking_id: booking.booking_id,
        station_id: booking.station_id,
        actor_user_id: actorUserId ?? null,
        action: "released",
        notes:
          notes ??
          "Booking cancelled or expired. Battery returned to previous status.",
      },
    });

    batteryReleasedId = booking.locked_battery_id;
  }

  if (booking.locked_wallet_payment_id) {
    const payment = await tx.payments.findUnique({
      where: { payment_id: booking.locked_wallet_payment_id },
    });

    const amountDecimal =
      booking.locked_wallet_amount ?? new Prisma.Decimal(0);
    walletRefundAmount = Number(amountDecimal);

    const wallet = await tx.wallets.upsert({
      where: { user_id: booking.user_id },
      update: {
        balance: {
          increment: amountDecimal,
        },
      },
      create: {
        user_id: booking.user_id,
        balance: amountDecimal,
      },
    });

    await tx.payments.update({
      where: { payment_id: booking.locked_wallet_payment_id },
      data: {
        payment_status: PAYMENT_STATUS_REFUNDED,
        paid_at: payment?.paid_at ?? new Date(),
        metadata: {
          ...((payment?.metadata as Record<string, unknown>) ?? {}),
          refunded_at: new Date().toISOString(),
          refunded_reason: notes ?? "booking_cancelled",
          refunded_amount: walletRefundAmount,
          wallet_balance_after: Number(wallet.balance),
        },
      },
    });
  }

  if (
    booking.locked_subscription_id &&
    booking.locked_swap_count > 0
  ) {
    const now = new Date();
    const subscription = await tx.user_subscriptions.findUnique({
      where: { subscription_id: booking.locked_subscription_id },
      select: {
        remaining_swaps: true,
        status: true,
        end_date: true,
      },
    });

    // ✅ Chỉ restore swaps nếu subscription còn active và chưa hết hạn
    if (
      subscription &&
      subscription.remaining_swaps !== null &&
      subscription.status === "active" &&
      subscription.end_date >= now
    ) {
      await tx.user_subscriptions.update({
        where: { subscription_id: booking.locked_subscription_id },
        data: {
          remaining_swaps: subscription.remaining_swaps + booking.locked_swap_count,
        },
      });
    }
    // Nếu subscription đã hết hạn hoặc không active, không restore swaps (đã mất)
  }

  const bookingUpdate: BookingUpdatePatch = {
    locked_battery_id: null,
    locked_battery_previous_status: null,
    locked_wallet_payment_id: null,
    locked_wallet_amount: new Prisma.Decimal(0),
    locked_subscription_id: null,
    locked_swap_count: 0,
    hold_expires_at: null,
  };

  return {
    bookingUpdate,
    walletRefundAmount,
    batteryReleasedId,
  };
}

type ConsumeParams = {
  tx: Prisma.TransactionClient;
  booking: BookingHoldFields;
  transactionId?: string;
  notes?: string;
};

type ConsumeResult = {
  bookingUpdate: BookingUpdatePatch;
  payment?: {
    payment_id: string;
    amount: Prisma.Decimal;
    payment_method: string;
    payment_status: PaymentStatus;
  } | null;
};

export async function consumeBookingHold({
  tx,
  booking,
  transactionId,
  notes,
}: ConsumeParams): Promise<ConsumeResult> {
  const bookingUpdate: BookingUpdatePatch = {
    locked_battery_id: null,
    locked_battery_previous_status: null,
    locked_wallet_payment_id: null,
    locked_wallet_amount: new Prisma.Decimal(0),
    locked_subscription_id: null,
    locked_swap_count: 0,
    hold_expires_at: null,
  };

  let paymentRecord: ConsumeResult["payment"] = null;

  if (booking.locked_wallet_payment_id) {
    const payment = await tx.payments.findUnique({
      where: { payment_id: booking.locked_wallet_payment_id },
    });

    if (payment) {
      paymentRecord = {
        payment_id: payment.payment_id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        payment_status: PAYMENT_STATUS_COMPLETED,
      };

      await tx.payments.update({
        where: { payment_id: payment.payment_id },
        data: {
          payment_status: PAYMENT_STATUS_COMPLETED,
          transaction_id: transactionId ?? payment.transaction_id ?? undefined,
          paid_at: payment.paid_at ?? new Date(),
          metadata: {
            ...((payment.metadata as Record<string, unknown>) ?? {}),
            consumed_at: new Date().toISOString(),
            consumed_reason: notes ?? "booking_completed",
          },
        },
      });
    }
  }

  return {
    bookingUpdate,
    payment: paymentRecord,
  };
}
