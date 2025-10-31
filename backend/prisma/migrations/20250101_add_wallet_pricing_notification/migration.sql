-- Migration: Add Wallet, BatteryPricing, TopUpPackage, Notification models
-- Date: 2025-01-01
-- Description: Add new models for Wallet system, Battery Pricing, TopUp Packages, and In-App Notifications

-- ============================================
-- 1. Create Wallet table
-- ============================================
CREATE TABLE IF NOT EXISTS "wallets" (
    "wallet_id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL UNIQUE,
    "balance" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "wallets_user_id_idx" ON "wallets"("user_id");

-- ============================================
-- 2. Create BatteryPricing table
-- ============================================
CREATE TABLE IF NOT EXISTS "battery_pricings" (
    "pricing_id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "battery_model" VARCHAR(50) NOT NULL UNIQUE,
    "price" DECIMAL(10, 2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "battery_pricings_battery_model_idx" ON "battery_pricings"("battery_model");
CREATE INDEX IF NOT EXISTS "battery_pricings_is_active_idx" ON "battery_pricings"("is_active");

-- ============================================
-- 3. Create TopUpPackage table
-- ============================================
CREATE TABLE IF NOT EXISTS "topup_packages" (
    "package_id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "topup_amount" DECIMAL(10, 2) NOT NULL,
    "bonus_amount" DECIMAL(10, 2) NOT NULL,
    "actual_amount" DECIMAL(10, 2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "topup_packages_is_active_idx" ON "topup_packages"("is_active");

-- ============================================
-- 4. Create Notification table
-- ============================================
CREATE TABLE IF NOT EXISTS "notifications" (
    "notification_id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications"("type");
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications"("created_at");

-- ============================================
-- 5. Add is_instant column to bookings table
-- ============================================
ALTER TABLE "bookings" 
ADD COLUMN IF NOT EXISTS "is_instant" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "bookings_is_instant_idx" ON "bookings"("is_instant");

-- ============================================
-- 6. Add topup_package_id to payments table
-- ============================================
ALTER TABLE "payments" 
ADD COLUMN IF NOT EXISTS "topup_package_id" UUID;

-- Add foreign key constraint for topup_package_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'payments_topup_package_id_fkey'
    ) THEN
        ALTER TABLE "payments"
        ADD CONSTRAINT "payments_topup_package_id_fkey" 
        FOREIGN KEY ("topup_package_id") 
        REFERENCES "topup_packages"("package_id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "payments_topup_package_id_idx" ON "payments"("topup_package_id");

-- ============================================
-- 7. Create function to update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at on new tables
DROP TRIGGER IF EXISTS update_wallets_updated_at ON "wallets";
CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON "wallets"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_battery_pricings_updated_at ON "battery_pricings";
CREATE TRIGGER update_battery_pricings_updated_at
    BEFORE UPDATE ON "battery_pricings"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_topup_packages_updated_at ON "topup_packages";
CREATE TRIGGER update_topup_packages_updated_at
    BEFORE UPDATE ON "topup_packages"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Insert sample data (optional)
-- ============================================

-- Sample Battery Pricing
INSERT INTO "battery_pricings" ("battery_model", "price", "is_active")
VALUES 
    ('V', 80000.00, true),
    ('W', 75000.00, true),
    ('X', 90000.00, true)
ON CONFLICT ("battery_model") DO NOTHING;

-- Sample TopUp Packages
INSERT INTO "topup_packages" ("name", "description", "topup_amount", "bonus_amount", "actual_amount", "is_active")
VALUES 
    ('Nạp 100k', 'Nạp 100k tặng 10k', 100000.00, 10000.00, 110000.00, true),
    ('Nạp 200k', 'Nạp 200k tặng 25k', 200000.00, 25000.00, 225000.00, true),
    ('Nạp 500k', 'Nạp 500k tặng 75k', 500000.00, 75000.00, 575000.00, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. Create wallets for existing users (optional)
-- ============================================
INSERT INTO "wallets" ("user_id", "balance")
SELECT "user_id", 0
FROM "users"
WHERE NOT EXISTS (
    SELECT 1 FROM "wallets" WHERE "wallets"."user_id" = "users"."user_id"
);

-- ============================================
-- Migration Complete
-- ============================================
-- Tables created:
--   - wallets
--   - battery_pricings
--   - topup_packages
--   - notifications
--
-- Columns added:
--   - bookings.is_instant
--   - payments.topup_package_id
--
-- Indexes created:
--   - All necessary indexes for performance
--
-- Sample data inserted:
--   - 3 battery pricing records
--   - 3 topup packages
--   - Wallets for existing users (balance = 0)

