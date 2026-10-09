import { prisma } from "@perpex/db";
import type { ClosedPosition } from "@perpex/types";

export const createClosedPosition = async (data: ClosedPosition) => {
  const market = await prisma.market.findUnique({
    where: { marketSlug: data.market },
  });

  if (!market) throw new Error("Market not found");

  await prisma.position.create({
    data: {
      userId: data.userId,
      marketId: market.id,
      side: data.side,
      quantity: data.quantity,
      averagePrice: data.averagePrice,
      exitPrice: data.exitPrice,
      liquidationPrice: data.liquidationPrice,
      margin: data.margin,
      realizedPnl: data.realizedPnl,
    },
  });
};
