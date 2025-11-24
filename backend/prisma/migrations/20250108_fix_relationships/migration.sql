-- Fix database relationships
-- This migration:
-- 1. Adds foreign key constraint for battery_history.station_id
-- 2. Adds station_id to battery_pricings (nullable - NULL = global pricing)
-- 3. Updates unique constraint for battery_pricings

-- Step 1: Add foreign key constraint for battery_history.station_id
-- Check if constraint already exists before adding
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'battery_history_station_id_fkey'
    ) THEN
        ALTER TABLE "battery_history"
        ADD CONSTRAINT "battery_history_station_id_fkey"
        FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE SET NULL;
    END IF;
END $$;

-- Step 2: Add station_id column to battery_pricings (nullable)
ALTER TABLE "battery_pricings"
ADD COLUMN IF NOT EXISTS "station_id" UUID;

-- Step 3: Add foreign key constraint for battery_pricings.station_id
-- Check if constraint already exists before adding
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'battery_pricings_station_id_fkey'
    ) THEN
        ALTER TABLE "battery_pricings"
        ADD CONSTRAINT "battery_pricings_station_id_fkey"
        FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE CASCADE;
    END IF;
END $$;

-- Step 4: Drop old unique constraint on battery_model
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'battery_pricings_battery_model_key'
    ) THEN
        ALTER TABLE "battery_pricings"
        DROP CONSTRAINT "battery_pricings_battery_model_key";
    END IF;
END $$;

-- Step 5: Add new unique constraint on (battery_model, station_id)
-- This allows: same model can have different prices per station, or global pricing (station_id = NULL)
CREATE UNIQUE INDEX IF NOT EXISTS "battery_pricings_battery_model_station_id_key"
ON "battery_pricings" ("battery_model", "station_id");

-- Note: For existing data, all pricing records will have station_id = NULL (global pricing)
-- Admin can later update specific station pricing if needed

