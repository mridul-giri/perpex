import { prisma } from "@perpex/db";
import type { Liquidation } from "@perpex/types";

export const createLiquidation = async (data: Liquidation) => {
  const market = await prisma.market.findUnique({
    where: { marketSlug: data.market },
  });

  if (!market) throw new Error("Market not found");

  await prisma.liquidation.create({
    data: {
      userId: data.userId,
      marketId: market.id,
      quantity: data.quantity,
      bankruptcyPrice: data.bankruptcyPrice,
      liquidationPrice: data.liquidationPrice,
    },
  });
};
