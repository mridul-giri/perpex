-- DropIndex
DROP INDEX "Candle_timestamp_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "InsuranceFund" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "balance" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceFund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceFund_marketId_key" ON "InsuranceFund"("marketId");

-- AddForeignKey
ALTER TABLE "InsuranceFund" ADD CONSTRAINT "InsuranceFund_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
