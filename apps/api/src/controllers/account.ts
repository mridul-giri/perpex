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
import { decodeCursor, encodeCursor, page } from "../utils/pagination";
import { ApiError } from "../utils/api-error";

export const getBalance = async (req: Request, res: Response) => {
  const result = await requestEngine({
    userId: req.user.id,
    messageType: "get-balance",
  });

  if (!result.ok) {
    throw new ApiError(404, result.error ?? "Balance unavailable");
  }

  res.json(result.data);
};

export const deposit = async (req: Request, res: Response) => {
  const { amount } = onrampSchema.parse(req.body);

  const result = await requestEngine({
    userId: req.user.id,
    amount,
    messageType: "on-ramp",
  });

  if (!result.ok) {
    throw new ApiError(400, result.error ?? "Deposit failed");
  }

  res.status(201).json(result.data);
};

export const withdraw = async (req: Request, res: Response) => {
  const { amount } = withdrawSchema.parse(req.body);

  const result = await requestEngine({
    userId: req.user.id,
    amount,
    messageType: "withdraw",
  });

  if (!result.ok) {
    throw new ApiError(400, result.error ?? "Withdraw failed");
  }

  res.status(201).json(result.data);
};

export const getPositions = async (req: Request, res: Response) => {
  const result = await requestEngine({
    userId: req.user.id,
    messageType: "get-positions",
  });

  if (!result.ok) {
    throw new ApiError(404, result.error ?? "Positions unavailable");
  }

  res.json(result.data);
};

export const getPosition = async (req: Request, res: Response) => {
  const { market } = marketParamSchema.parse(req.params);

  const position = await prisma.position.findFirst({
    where: { userId: req.user.id, market: { marketSlug: market } },
    include: { market: true },
  });

  if (!position) {
    throw new ApiError(404, "Position not found");
  }

  res.json(serializePosition(position));
};

export const getFills = async (req: Request, res: Response) => {
  const { limit, cursor } = paginationQuerySchema.parse(req.query);

  const where: any = {
    OR: [{ makerUserId: req.user.id }, { takerUserId: req.user.id }],
  };

  if (cursor) {
    const { createdAt, id } = decodeCursor(cursor);
    where.AND = [
      {
        OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: id } }],
      },
    ];
  }

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

  if (cursor) {
    const { createdAt, id } = decodeCursor(cursor);
    where.AND = [
      {
        OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: id } }],
      },
    ];
  }

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
  if (cursor) {
    const { createdAt, id } = decodeCursor(cursor);
    where.AND = [
      {
        OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: id } }],
      },
    ];
  }

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
