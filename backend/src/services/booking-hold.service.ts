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
  walletForfeitedAmount: number;
  batteryReleasedId: string | null;
};

const BATTERY_STATUS_DEFAULT = BatteryStatus.full;
const PAYMENT_STATUS_FORFEITED = "forfeited" as unknown as PaymentStatus;
const PAYMENT_STATUS_COMPLETED = "completed" as unknown as PaymentStatus;

export async function releaseBookingHold({
  tx,
  booking,
  actorUserId,
  notes,
}: ReleaseParams): Promise<ReleaseResult> {
  let walletForfeitedAmount = 0;
  let batteryReleasedId: string | null = null;

  if (booking.locked_battery_id) {
    const targetStatus =
      booking.locked_battery_previous_status ?? BATTERY_STATUS_DEFAULT;

    await tx.battery.update({
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
    const payment = await tx.payment.findUnique({
      where: { payment_id: booking.locked_wallet_payment_id },
      select: { metadata: true },
    });

    walletForfeitedAmount = booking.locked_wallet_amount
      ? Number(booking.locked_wallet_amount)
      : 0;

    await tx.payment.update({
      where: { payment_id: booking.locked_wallet_payment_id },
      data: {
        payment_status: PAYMENT_STATUS_FORFEITED,
        metadata: {
          ...((payment?.metadata as Record<string, unknown>) ?? {}),
          forfeited_at: new Date().toISOString(),
          forfeited_reason: notes ?? "booking_cancelled",
          forfeited_amount: walletForfeitedAmount,
        },
      },
    });
  }

  const bookingUpdate: BookingUpdatePatch = {
    locked_battery_id: null,
    locked_battery_previous_status: null,
    locked_wallet_payment_id: null,
    hold_expires_at: null,
  };

  return {
    bookingUpdate,
    walletForfeitedAmount,
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
    const payment = await tx.payment.findUnique({
      where: { payment_id: booking.locked_wallet_payment_id },
    });

    if (payment) {
      paymentRecord = {
        payment_id: payment.payment_id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        payment_status: PAYMENT_STATUS_COMPLETED,
      };

      await tx.payment.update({
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
