-- AlterTable
ALTER TABLE "Fills" ALTER COLUMN "price" SET DATA TYPE TEXT,
ALTER COLUMN "quantity" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Market" ALTER COLUMN "imageUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "price" SET DATA TYPE TEXT,
ALTER COLUMN "quantity" SET DATA TYPE TEXT,
ALTER COLUMN "filledQuantity" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "Balance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "available" TEXT NOT NULL,
    "locked" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "side" "OrderSide" NOT NULL,
    "quantity" TEXT NOT NULL,
    "averagePrice" TEXT NOT NULL,
    "liquidationPrice" TEXT NOT NULL,
    "margin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Liquidation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "bankruptcyPrice" TEXT NOT NULL,
    "liquidationPrice" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Liquidation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Balance_userId_key" ON "Balance"("userId");

-- CreateIndex
CREATE INDEX "Position_userId_marketId_idx" ON "Position"("userId", "marketId");

-- CreateIndex
CREATE INDEX "Liquidation_userId_idx" ON "Liquidation"("userId");

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liquidation" ADD CONSTRAINT "Liquidation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liquidation" ADD CONSTRAINT "Liquidation_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
