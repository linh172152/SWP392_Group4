-- Remove unused fields and add performance indexes
-- This migration:
-- 1. Drops pin_code and pin_verified_at columns from bookings (no longer used)
-- 2. Adds indexes for better query performance

-- Step 1: Drop unused columns from bookings table
ALTER TABLE "bookings" 
DROP COLUMN IF EXISTS "pin_code",
DROP COLUMN IF EXISTS "pin_verified_at";

-- Step 2: Add indexes for Booking model
CREATE INDEX IF NOT EXISTS "bookings_status_scheduled_at_idx" ON "bookings"("status", "scheduled_at");
CREATE INDEX IF NOT EXISTS "bookings_station_id_status_idx" ON "bookings"("station_id", "status");
CREATE INDEX IF NOT EXISTS "bookings_user_id_status_idx" ON "bookings"("user_id", "status");
CREATE INDEX IF NOT EXISTS "bookings_checked_in_at_idx" ON "bookings"("checked_in_at");

-- Step 3: Add indexes for Transaction model
CREATE INDEX IF NOT EXISTS "transactions_user_id_payment_status_idx" ON "transactions"("user_id", "payment_status");
CREATE INDEX IF NOT EXISTS "transactions_station_id_created_at_idx" ON "transactions"("station_id", "created_at");
CREATE INDEX IF NOT EXISTS "transactions_payment_status_idx" ON "transactions"("payment_status");

-- Step 4: Add indexes for Battery model
CREATE INDEX IF NOT EXISTS "batteries_station_id_status_idx" ON "batteries"("station_id", "status");
CREATE INDEX IF NOT EXISTS "batteries_status_current_charge_idx" ON "batteries"("status", "current_charge");
CREATE INDEX IF NOT EXISTS "batteries_model_idx" ON "batteries"("model");

-- Step 5: Add indexes for Payment model
CREATE INDEX IF NOT EXISTS "payments_user_id_payment_status_idx" ON "payments"("user_id", "payment_status");
CREATE INDEX IF NOT EXISTS "payments_payment_status_created_at_idx" ON "payments"("payment_status", "created_at");

-- Step 6: Add indexes for UserSubscription model
CREATE INDEX IF NOT EXISTS "user_subscriptions_user_id_status_idx" ON "user_subscriptions"("user_id", "status");
CREATE INDEX IF NOT EXISTS "user_subscriptions_status_end_date_idx" ON "user_subscriptions"("status", "end_date");

-- Step 7: Add indexes for Vehicle model
CREATE INDEX IF NOT EXISTS "vehicles_user_id_idx" ON "vehicles"("user_id");

-- Step 8: Add indexes for SupportTicket model
CREATE INDEX IF NOT EXISTS "support_tickets_user_id_status_idx" ON "support_tickets"("user_id", "status");
CREATE INDEX IF NOT EXISTS "support_tickets_assigned_to_staff_id_status_idx" ON "support_tickets"("assigned_to_staff_id", "status");

-- Step 9: Add indexes for StationRating model
CREATE INDEX IF NOT EXISTS "station_ratings_station_id_idx" ON "station_ratings"("station_id");
CREATE INDEX IF NOT EXISTS "station_ratings_user_id_idx" ON "station_ratings"("user_id");

-- Step 10: Add indexes for BatteryTransferLog model
CREATE INDEX IF NOT EXISTS "battery_transfer_logs_battery_id_idx" ON "battery_transfer_logs"("battery_id");
CREATE INDEX IF NOT EXISTS "battery_transfer_logs_from_station_id_transfer_status_idx" ON "battery_transfer_logs"("from_station_id", "transfer_status");
CREATE INDEX IF NOT EXISTS "battery_transfer_logs_to_station_id_transfer_status_idx" ON "battery_transfer_logs"("to_station_id", "transfer_status");

-- Step 11: Add indexes for ServicePackage model
CREATE INDEX IF NOT EXISTS "service_packages_is_active_idx" ON "service_packages"("is_active");

-- Step 12: Add indexes for TopUpPackage model
CREATE INDEX IF NOT EXISTS "topup_packages_is_active_idx" ON "topup_packages"("is_active");

-- Step 13: Add indexes for BatteryPricing model
CREATE INDEX IF NOT EXISTS "battery_pricings_is_active_idx" ON "battery_pricings"("is_active");

-- Step 14: Add index for User model
CREATE INDEX IF NOT EXISTS "users_station_id_idx" ON "users"("station_id");

