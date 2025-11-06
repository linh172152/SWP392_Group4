ALTER TABLE "batteries"
  ADD COLUMN IF NOT EXISTS "health_percentage" DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS "cycle_count" INTEGER DEFAULT 0;

CREATE TYPE "TransferStatus" AS ENUM ('pending', 'in_transit', 'completed', 'cancelled');

ALTER TABLE "battery_transfer_logs"
  ADD COLUMN IF NOT EXISTS "transfer_status" "TransferStatus" DEFAULT 'completed';


