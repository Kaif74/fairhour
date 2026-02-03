-- AlterTable
ALTER TABLE "User" ADD COLUMN     "availability" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "profileImageUrl" TEXT;
