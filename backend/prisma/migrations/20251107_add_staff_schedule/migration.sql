-- Ensure pgcrypto extension for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ScheduleStatus enum
CREATE TYPE "ScheduleStatus" AS ENUM ('scheduled', 'completed', 'absent', 'cancelled');

-- Create staff_schedules table
CREATE TABLE "staff_schedules" (
    "schedule_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "staff_id" UUID NOT NULL,
    "station_id" UUID,
    "shift_date" DATE NOT NULL,
    "shift_start" TIMESTAMPTZ NOT NULL,
    "shift_end" TIMESTAMPTZ NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "staff_schedules_pkey" PRIMARY KEY ("schedule_id"),
    CONSTRAINT "staff_schedules_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "staff_schedules_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("station_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Index to speed up staff/date lookups
CREATE INDEX "staff_schedules_staff_id_shift_date_idx"
    ON "staff_schedules" ("staff_id", "shift_date");

