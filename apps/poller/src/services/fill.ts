import { prisma } from "@perpex/db";

export const createFill = async (data: {
  makerUserId: string;
  takerUserId: string;
  makerOrderId: string;
  takerOrderId: string;
  market: string;
  price: string;
  quantity: string;
}) => {
  const market = await prisma.market.findUnique({
    where: { marketSlug: data.market },
  });

  if (!market) throw new Error("Market not found");

  await prisma.fills.create({
    data: {
      makerUserId: data.makerUserId,
      takerUserId: data.takerUserId,
      makerOrderId: data.makerOrderId,
      takerOrderId: data.takerOrderId,
      marketId: market.id,
      price: data.price,
      quantity: data.quantity,
    },
  });
};
