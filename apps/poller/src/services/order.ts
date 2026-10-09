import { prisma } from "@perpex/db";
import type { Order } from "@perpex/types";

export const createOrder = async (data: Order) => {
  const market = await prisma.market.findUnique({
    where: { marketSlug: data.market },
  });

  if (!market) throw new Error("Market not found");

  await prisma.order.create({
    data: {
      id: data.orderId,
      userId: data.userId,
      marketId: market.id,
      type: data.type,
      side: data.side,
      price: data.price,
      quantity: data.quantity,
      filledQuantity: data.filledQuantity,
      status: data.status,
    },
  });
};

export const updateOrder = async (data: Order) => {
  const market = await prisma.market.findUnique({
    where: { marketSlug: data.market },
  });

  if (!market) throw new Error("Market not found");

  await prisma.order.upsert({
    where: { id: data.orderId },
    create: {
      id: data.orderId,
      userId: data.userId,
      marketId: market.id,
      type: data.type,
      side: data.side,
      price: data.price,
      quantity: data.quantity,
      filledQuantity: data.filledQuantity,
      status: data.status,
    },
    update: {
      filledQuantity: data.filledQuantity,
      status: data.status,
    },
  });
};

export const cancelOrder = async (data: { orderId: string }) => {
  await prisma.order.updateMany({
    where: { id: data.orderId },
    data: { status: "Cancelled" },
  });
};
