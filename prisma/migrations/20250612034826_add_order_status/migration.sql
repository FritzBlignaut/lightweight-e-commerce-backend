-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PLACED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PLACED';
