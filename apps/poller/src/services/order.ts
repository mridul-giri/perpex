import { prisma } from "@perpex/db";
import type { Order } from "@perpex/types";

export const createOrder = async (data: Order) => {
  const findMarket = await prisma.market.findUnique({
    where: {
      marketSlug: data.market,
    },
  });
 
  if (!findMarket) throw new Error("Market not found");

  await prisma.order.create({
    data: {
      id: data.orderId,
      userId: data.userId,
      marketId: findMarket.id,
      type: data.type,
      side: data.side,
      price: data.price,
      quantity: data.quantity,
      filledQuantity: data.filledQuantity,
      status: data.status,
    },
  });
};
