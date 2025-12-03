/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subtotalCents` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subtotalCents" INTEGER NOT NULL,
ADD COLUMN     "taxCents" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
