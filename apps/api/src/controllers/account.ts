import type { Request, Response } from "express";
import { prisma } from "@perpex/db";
import {
  onrampSchema,
  withdrawSchema,
  paginationQuerySchema,
  ordersQuerySchema,
  orderIdParamSchema,
  marketParamSchema,
} from "@perpex/schemas";
import { requestEngine } from "../utils/request-engine";
import { encodeCursor, olderThanCursor, page } from "../utils/pagination";
import { ApiError } from "../utils/api-error";

export const getBalance = async (req: Request, res: Response) => {
  const data = await requestEngine({
    userId: req.user.id,
    messageType: "get-balance",
  });

  res.json(data);
};

export const deposit = async (req: Request, res: Response) => {
  const { amount } = onrampSchema.parse(req.body);

  const data = await requestEngine({
    userId: req.user.id,
    amount,
    messageType: "on-ramp",
  });

  res.status(201).json(data);
};

export const withdraw = async (req: Request, res: Response) => {
  const { amount } = withdrawSchema.parse(req.body);

  const data = await requestEngine({
    userId: req.user.id,
    amount,
    messageType: "withdraw",
  });

  res.status(201).json(data);
};

export const getOpenPositions = async (req: Request, res: Response) => {
  const data = await requestEngine({
    userId: req.user.id,
    messageType: "get-positions",
  });

  res.json(data);
};

export const getPositionHistory = async (req: Request, res: Response) => {
  const { limit, cursor } = paginationQuerySchema.parse(req.query);

  const where: any = { userId: req.user.id };
  if (cursor) where.AND = [olderThanCursor(cursor)];

  const rows = await prisma.position.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: { market: true },
  });

  const result = page(rows, limit, (last) =>
    encodeCursor(last.createdAt, last.id),
  );

  res.json({
    items: result.items.map(serializePosition),
    nextCursor: result.nextCursor,
  });
};

export const getPosition = async (req: Request, res: Response) => {
  const { market } = marketParamSchema.parse(req.params);

  const data = (await requestEngine({
    userId: req.user.id,
    messageType: "get-positions",
  })) as { positions: { market: string }[] };

  const position = data.positions.find((open) => open.market === market);
  if (!position) throw new ApiError(404, "No open position in this market");

  res.json(position);
};

export const getFills = async (req: Request, res: Response) => {
  const { limit, cursor } = paginationQuerySchema.parse(req.query);

  const where: any = {
    OR: [{ makerUserId: req.user.id }, { takerUserId: req.user.id }],
  };

  if (cursor) where.AND = [olderThanCursor(cursor)];

  const rows = await prisma.fills.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: { market: true },
  });

  const result = page(rows, limit, (last) =>
    encodeCursor(last.createdAt, last.id),
  );

  res.json({
    items: result.items.map((fill) => ({
      fillId: fill.id,
      market: fill.market.marketSlug,
      price: fill.price,
      quantity: fill.quantity,
      makerOrderId: fill.makerOrderId,
      takerOrderId: fill.takerOrderId,
      role: fill.makerUserId === req.user.id ? "maker" : "taker",
      createdAt: fill.createdAt,
    })),
    nextCursor: result.nextCursor,
  });
};

export const getOrders = async (req: Request, res: Response) => {
  const { limit, cursor, market, status } = ordersQuerySchema.parse(req.query);

  const where: any = { userId: req.user.id };
  if (market) where.market = { marketSlug: market };
  if (status) where.status = status;

  if (cursor) where.AND = [olderThanCursor(cursor)];

  const rows = await prisma.order.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: { market: true },
  });

  const result = page(rows, limit, (last) =>
    encodeCursor(last.createdAt, last.id),
  );

  res.json({
    items: result.items.map(serializeOrder),
    nextCursor: result.nextCursor,
  });
};

export const getOrder = async (req: Request, res: Response) => {
  const { orderId } = orderIdParamSchema.parse(req.params);

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: req.user.id },
    include: { market: true },
  });

  if (!order) throw new ApiError(404, "Order not found");

  res.json(serializeOrder(order));
};

export const getLiquidations = async (req: Request, res: Response) => {
  const { limit, cursor } = paginationQuerySchema.parse(req.query);

  const where: any = { userId: req.user.id };
  if (cursor) where.AND = [olderThanCursor(cursor)];

  const rows = await prisma.liquidation.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: { market: true },
  });

  const result = page(rows, limit, (last) =>
    encodeCursor(last.createdAt, last.id),
  );

  res.json({
    items: result.items.map((liquidation) => ({
      id: liquidation.id,
      market: liquidation.market.marketSlug,
      quantity: liquidation.quantity,
      bankruptcyPrice: liquidation.bankruptcyPrice,
      liquidationPrice: liquidation.liquidationPrice,
      createdAt: liquidation.createdAt,
    })),
    nextCursor: result.nextCursor,
  });
};

const serializeOrder = (order: {
  id: string;
  type: string;
  side: string;
  price: string | null;
  quantity: string;
  filledQuantity: string;
  status: string;
  createdAt: Date;
  market: { marketSlug: string };
}) => ({
  orderId: order.id,
  market: order.market.marketSlug,
  type: order.type,
  side: order.side,
  price: order.price,
  quantity: order.quantity,
  filledQuantity: order.filledQuantity,
  status: order.status,
  createdAt: order.createdAt,
});

const serializePosition = (position: {
  id: string;
  side: string;
  quantity: string;
  averagePrice: string;
  exitPrice: string;
  liquidationPrice: string;
  margin: string;
  realizedPnl: string;
  createdAt: Date;
  updatedAt: Date;
  market: { marketSlug: string };
}) => ({
  positionId: position.id,
  market: position.market.marketSlug,
  side: position.side,
  quantity: position.quantity,
  averagePrice: position.averagePrice,
  exitPrice: position.exitPrice,
  liquidationPrice: position.liquidationPrice,
  margin: position.margin,
  realizedPnl: position.realizedPnl,
  createdAt: position.createdAt,
  updatedAt: position.updatedAt,
});
