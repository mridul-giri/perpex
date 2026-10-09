-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "exitPrice" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "realizedPnl" TEXT NOT NULL DEFAULT '0';
