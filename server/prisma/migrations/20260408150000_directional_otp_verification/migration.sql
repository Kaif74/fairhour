DO $$
BEGIN
  CREATE TYPE "OtpGeneratedFor" AS ENUM ('provider', 'receiver');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DROP TABLE IF EXISTS "service_otps";

CREATE TABLE "service_otps" (
  "id" TEXT NOT NULL,
  "service_id" TEXT NOT NULL,
  "phase" "OtpPhase" NOT NULL,
  "otp_hash" TEXT NOT NULL,
  "generated_for" "OtpGeneratedFor" NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "verified_at" TIMESTAMP(3),
  "failed_attempts" INTEGER NOT NULL DEFAULT 0,
  "failed_attempt_log" JSONB,
  "invalidated_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "service_otps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "service_otps_service_id_phase_idx" ON "service_otps"("service_id", "phase");
CREATE INDEX "service_otps_expires_at_idx" ON "service_otps"("expires_at");
CREATE INDEX "service_otps_invalidated_at_idx" ON "service_otps"("invalidated_at");

ALTER TABLE "service_otps"
ADD CONSTRAINT "service_otps_service_id_fkey"
FOREIGN KEY ("service_id") REFERENCES "Exchange"("id") ON DELETE CASCADE ON UPDATE CASCADE;
