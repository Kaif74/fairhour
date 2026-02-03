-- AlterTable
ALTER TABLE "Exchange" ADD COLUMN     "providerConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requesterConfirmed" BOOLEAN NOT NULL DEFAULT false;
