-- Create new enum for package billing cycle
CREATE TYPE "PackageBillingCycle" AS ENUM ('monthly', 'yearly', 'custom');

-- Add new structure fields to service packages
ALTER TABLE "service_packages"
  ADD COLUMN "battery_capacity_kwh" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "billing_cycle" "PackageBillingCycle" NOT NULL DEFAULT 'monthly',
  ADD COLUMN "benefits" JSONB,
  ADD COLUMN "metadata" JSONB;

-- Make legacy battery_models optional (case-insensitive matching now done elsewhere)
ALTER TABLE "service_packages"
  ALTER COLUMN "battery_models" DROP NOT NULL;

-- Backfill default capacity for existing rows, then drop default so future inserts must specify it
UPDATE "service_packages"
SET "battery_capacity_kwh" = COALESCE(NULLIF("battery_capacity_kwh", 0), 75);

ALTER TABLE "service_packages"
  ALTER COLUMN "battery_capacity_kwh" DROP DEFAULT;

-- Extend user subscriptions with cancellation tracking and metadata
ALTER TABLE "user_subscriptions"
  ADD COLUMN "cancelled_at" TIMESTAMP(3),
  ADD COLUMN "cancellation_reason" TEXT,
  ADD COLUMN "metadata" JSONB;

-- Create new enum for payment categorisation
CREATE TYPE "PaymentType" AS ENUM ('SWAP', 'TOPUP', 'PACKAGE_PURCHASE', 'PACKAGE_REFUND', 'PENALTY', 'OTHER');

-- Add payment classification + metadata for auditing wallet/package flows
ALTER TABLE "payments"
  ADD COLUMN "payment_type" "PaymentType" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "metadata" JSONB;

-- Ensure existing rows have the default applied
UPDATE "payments" SET "payment_type" = 'OTHER' WHERE "payment_type" IS NULL;

-- Extend battery status with reserved state (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'reserved' AND enumtypid = 'BatteryStatus'::regtype) THEN
    ALTER TYPE "BatteryStatus" ADD VALUE 'reserved';
  END IF;
END $$;

-- Extend payment status for booking holds/refunds
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'reserved' AND enumtypid = 'PaymentStatus'::regtype) THEN
    ALTER TYPE "PaymentStatus" ADD VALUE 'reserved';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'refunded' AND enumtypid = 'PaymentStatus'::regtype) THEN
    ALTER TYPE "PaymentStatus" ADD VALUE 'refunded';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'forfeited' AND enumtypid = 'PaymentStatus'::regtype) THEN
    ALTER TYPE "PaymentStatus" ADD VALUE 'forfeited';
  END IF;
END $$;

-- Enum for battery history actions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BatteryHistoryAction') THEN
    CREATE TYPE "BatteryHistoryAction" AS ENUM ('reserved', 'released', 'issued', 'returned', 'maintenance', 'damaged', 'reassigned');
  END IF;
END $$;

-- Vehicles track current battery
ALTER TABLE "vehicles"
  ADD COLUMN IF NOT EXISTS "current_battery_id" UUID;

ALTER TABLE "vehicles"
  ADD CONSTRAINT IF NOT EXISTS "vehicles_current_battery_id_fkey"
  FOREIGN KEY ("current_battery_id") REFERENCES "batteries"("battery_id") ON DELETE SET NULL;

-- Booking hold metadata
ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "locked_battery_id" UUID,
  ADD COLUMN IF NOT EXISTS "locked_subscription_id" UUID,
  ADD COLUMN IF NOT EXISTS "locked_swap_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "locked_wallet_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "locked_wallet_payment_id" UUID,
  ADD COLUMN IF NOT EXISTS "use_subscription" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "locked_battery_previous_status" "BatteryStatus",
  ADD COLUMN IF NOT EXISTS "hold_expires_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancellation_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "cancellation_notes" TEXT;

ALTER TABLE "bookings"
  ADD CONSTRAINT IF NOT EXISTS "bookings_locked_battery_id_fkey"
  FOREIGN KEY ("locked_battery_id") REFERENCES "batteries"("battery_id") ON DELETE SET NULL;

ALTER TABLE "bookings"
  ADD CONSTRAINT IF NOT EXISTS "bookings_locked_subscription_id_fkey"
  FOREIGN KEY ("locked_subscription_id") REFERENCES "user_subscriptions"("subscription_id") ON DELETE SET NULL;

ALTER TABLE "bookings"
  ADD CONSTRAINT IF NOT EXISTS "bookings_locked_wallet_payment_id_fkey"
  FOREIGN KEY ("locked_wallet_payment_id") REFERENCES "payments"("payment_id") ON DELETE SET NULL;

-- Battery history auditing
CREATE TABLE IF NOT EXISTS "battery_history" (
  "history_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "battery_id" UUID NOT NULL,
  "booking_id" UUID,
  "vehicle_id" UUID,
  "station_id" UUID,
  "action" "BatteryHistoryAction" NOT NULL DEFAULT 'reserved',
  "actor_user_id" UUID,
  "notes" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "battery_history_battery_id_fkey" FOREIGN KEY ("battery_id") REFERENCES "batteries"("battery_id") ON DELETE CASCADE,
  CONSTRAINT "battery_history_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("booking_id") ON DELETE CASCADE,
  CONSTRAINT "battery_history_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE SET NULL,
  CONSTRAINT "battery_history_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "battery_history_battery_id_created_at_idx"
  ON "battery_history" ("battery_id", "created_at");

CREATE INDEX IF NOT EXISTS "battery_history_booking_id_idx"
  ON "battery_history" ("booking_id");
