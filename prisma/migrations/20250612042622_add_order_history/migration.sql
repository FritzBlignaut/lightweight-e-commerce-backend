-- CreateTable
CREATE TABLE "OrderHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "changedById" INTEGER NOT NULL,
    "fromStatus" "OrderStatus" NOT NULL,
    "toStatus" "OrderStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderHistory" ADD CONSTRAINT "OrderHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderHistory" ADD CONSTRAINT "OrderHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
