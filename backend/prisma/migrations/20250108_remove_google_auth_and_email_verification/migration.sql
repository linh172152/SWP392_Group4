-- Remove Google authentication and email verification fields
-- This migration removes:
-- 1. auth_provider column (enum: EMAIL, GOOGLE)
-- 2. email_verified column
-- 3. google_id column
-- 4. AuthProvider enum type

-- Step 1: Drop columns from users table
ALTER TABLE "users" 
DROP COLUMN IF EXISTS "auth_provider",
DROP COLUMN IF EXISTS "email_verified",
DROP COLUMN IF EXISTS "google_id";

-- Step 2: Drop AuthProvider enum type (if it exists and is not used elsewhere)
-- Note: Only drop if no other tables use this enum
DO $$ 
BEGIN
    -- Check if enum exists and drop it
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuthProvider') THEN
        DROP TYPE "AuthProvider";
    END IF;
END $$;

