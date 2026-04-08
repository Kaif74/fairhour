ALTER TYPE "ExchangeStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OtpPhase') THEN
        CREATE TYPE "OtpPhase" AS ENUM ('start', 'completion');
    END IF;
END $$;

ALTER TABLE "Exchange"
ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "service_otps" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "phase" "OtpPhase" NOT NULL,
    "provider_otp" TEXT NOT NULL,
    "receiver_otp" TEXT NOT NULL,
    "provider_verified" BOOLEAN NOT NULL DEFAULT false,
    "receiver_verified" BOOLEAN NOT NULL DEFAULT false,
    "provider_verified_at" TIMESTAMP(3),
    "receiver_verified_at" TIMESTAMP(3),
    "provider_failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "receiver_failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "failed_attempt_log" JSONB,
    "invalidated_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_otps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "service_otps_service_id_phase_idx" ON "service_otps"("service_id", "phase");
CREATE INDEX IF NOT EXISTS "service_otps_expires_at_idx" ON "service_otps"("expires_at");
CREATE INDEX IF NOT EXISTS "service_otps_invalidated_at_idx" ON "service_otps"("invalidated_at");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'service_otps_service_id_fkey'
          AND table_name = 'service_otps'
    ) THEN
        ALTER TABLE "service_otps"
        ADD CONSTRAINT "service_otps_service_id_fkey"
        FOREIGN KEY ("service_id") REFERENCES "Exchange"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
