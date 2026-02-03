/*
  Warnings:

  - Added the required column `title` to the `Request` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "hours" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "title" TEXT NOT NULL;
