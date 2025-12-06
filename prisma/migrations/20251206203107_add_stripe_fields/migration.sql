-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "paymentStatus" TEXT;
