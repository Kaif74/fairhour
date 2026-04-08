-- Repair migration for schema objects that exist in the current Prisma schema
-- but were not captured in the historical migration chain.
-- This migration is intentionally idempotent so it can run safely on databases
-- where some or all of these objects already exist.

ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "walletAddress" TEXT;

ALTER TABLE "Service"
    ADD COLUMN IF NOT EXISTS "occupationId" TEXT;

ALTER TABLE "Exchange"
    ADD COLUMN IF NOT EXISTS "creditsEarned" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "occupationCode" TEXT,
    ADD COLUMN IF NOT EXISTS "valuationDetails" JSONB,
    ADD COLUMN IF NOT EXISTS "blockchainTxHash" TEXT;

CREATE TABLE IF NOT EXISTS "Occupation" (
    "id" TEXT NOT NULL,
    "ncoCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "majorGroup" TEXT NOT NULL,
    "skillLevel" INTEGER NOT NULL,
    "baseMultiplier" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Occupation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ServiceStats" (
    "id" TEXT NOT NULL,
    "occupationId" TEXT NOT NULL,
    "requestsLast30Days" INTEGER NOT NULL DEFAULT 0,
    "providersAvailable" INTEGER NOT NULL DEFAULT 1,
    "demandRatio" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceStats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL,
    "exchangeId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_walletAddress_key" ON "User"("walletAddress");
CREATE UNIQUE INDEX IF NOT EXISTS "Exchange_blockchainTxHash_key" ON "Exchange"("blockchainTxHash");
CREATE UNIQUE INDEX IF NOT EXISTS "Occupation_ncoCode_key" ON "Occupation"("ncoCode");
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceStats_occupationId_key" ON "ServiceStats"("occupationId");
CREATE UNIQUE INDEX IF NOT EXISTS "Review_exchangeId_reviewerId_key" ON "Review"("exchangeId", "reviewerId");

CREATE INDEX IF NOT EXISTS "Service_occupationId_idx" ON "Service"("occupationId");
CREATE INDEX IF NOT EXISTS "Occupation_majorGroup_idx" ON "Occupation"("majorGroup");
CREATE INDEX IF NOT EXISTS "Occupation_skillLevel_idx" ON "Occupation"("skillLevel");
CREATE INDEX IF NOT EXISTS "Review_providerId_idx" ON "Review"("providerId");
CREATE INDEX IF NOT EXISTS "Review_reviewerId_idx" ON "Review"("reviewerId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Service_occupationId_fkey'
    ) THEN
        ALTER TABLE "Service"
            ADD CONSTRAINT "Service_occupationId_fkey"
            FOREIGN KEY ("occupationId") REFERENCES "Occupation"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ServiceStats_occupationId_fkey'
    ) THEN
        ALTER TABLE "ServiceStats"
            ADD CONSTRAINT "ServiceStats_occupationId_fkey"
            FOREIGN KEY ("occupationId") REFERENCES "Occupation"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Review_exchangeId_fkey'
    ) THEN
        ALTER TABLE "Review"
            ADD CONSTRAINT "Review_exchangeId_fkey"
            FOREIGN KEY ("exchangeId") REFERENCES "Exchange"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Review_reviewerId_fkey'
    ) THEN
        ALTER TABLE "Review"
            ADD CONSTRAINT "Review_reviewerId_fkey"
            FOREIGN KEY ("reviewerId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Review_providerId_fkey'
    ) THEN
        ALTER TABLE "Review"
            ADD CONSTRAINT "Review_providerId_fkey"
            FOREIGN KEY ("providerId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
