import type { Request, Response } from "express";
import { prisma } from "@perpex/db";
import { candlesQuerySchema, paginationQuerySchema } from "@perpex/schemas";
import { queryCandles } from "../repositories/candle";
import { requestEngine } from "../utils/request-engine";
import { encodeCursor, olderThanCursor, page } from "../utils/pagination";
import { ApiError } from "../utils/api-error";

export const getCandles = async (req: Request, res: Response) => {
  const market = req.params.market as string;
  const { interval, limit, from, to } = candlesQuerySchema.parse(req.query);

  const candles = await queryCandles({ market, interval, from, to, limit });

  res.json({ market, interval, candles });
};

export const getMarkets = async (req: Request, res: Response) => {
  const markets = await prisma.market.findMany({
    orderBy: { marketSlug: "asc" },
  });

  res.json({
    items: markets.map((market) => ({
      marketSlug: market.marketSlug,
      imageUrl: market.imageUrl,
    })),
    nextCursor: null,
  });
};

export const getMarket = async (req: Request, res: Response) => {
  const market = await prisma.market.findUnique({
    where: { marketSlug: req.params.market as string },
  });

  if (!market) throw new ApiError(404, "Market not found");

  res.json({ marketSlug: market.marketSlug, imageUrl: market.imageUrl });
};

export const getOrderbook = async (req: Request, res: Response) => {
  const data = await requestEngine({
    market: req.params.market as string,
    messageType: "get-depth",
  });

  res.json(data);
};

export const getMarketRisk = async (req: Request, res: Response) => {
  const data = await requestEngine({
    market: req.params.market as string,
    messageType: "get-market-risk",
  });

  res.json(data);
};

export const getTrades = async (req: Request, res: Response) => {
  const market = req.params.market as string;
  const { limit, cursor } = paginationQuerySchema.parse(req.query);

  const where: any = { market: { marketSlug: market } };
  if (cursor) where.AND = [olderThanCursor(cursor)];

  const rows = await prisma.fills.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: { makerOrder: { select: { side: true } } },
  });

  const result = page(rows, limit, (last) =>
    encodeCursor(last.createdAt, last.id),
  );

  res.json({
    market,
    items: result.items.map((fill) => ({
      id: fill.id,
      price: fill.price,
      quantity: fill.quantity,
      isBuyerMaker: fill.makerOrder.side === "LONG",
      timestamp: Math.floor(fill.createdAt.getTime() / 1000),
    })),
    nextCursor: result.nextCursor,
  });
};
