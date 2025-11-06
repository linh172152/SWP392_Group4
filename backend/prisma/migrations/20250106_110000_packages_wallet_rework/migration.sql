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



