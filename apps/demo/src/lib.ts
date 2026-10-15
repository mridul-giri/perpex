import { connectRedis, publishToStream } from "@perpex/redis";
import { config } from "@perpex/config";

export interface MarketConfig {
  slug: string;
  dp: number;
  fallback: number;
  stepPct: number;
  levelQty: string;
  marketQty: string;
  restQty: string;
  takerQty: string;
  vol: number;
}

export const MARKETS: MarketConfig[] = [
  {
    slug: "BTC_PERP",
    dp: 1,
    fallback: 82700,
    stepPct: 0.0004,
    levelQty: "0.4",
    marketQty: "0.05",
    restQty: "0.02",
    takerQty: "0.03",
    vol: 40,
  },
  {
    slug: "ETH_PERP",
    dp: 2,
    fallback: 2518,
    stepPct: 0.0006,
    levelQty: "8",
    marketQty: "1",
    restQty: "0.3",
    takerQty: "0.5",
    vol: 400,
  },
  {
    slug: "SOL_PERP",
    dp: 3,
    fallback: 108.2,
    stepPct: 0.0008,
    levelQty: "150",
    marketQty: "20",
    restQty: "5",
    takerQty: "8",
    vol: 6000,
  },
];

export const TRADERS = ["alice", "bob", "carol", "dave", "erin", "frank"];
export const MAKER = "mm-maker";
export const TAKER = "mm-taker";
export const DEMO_USERS = [...TRADERS, MAKER, TAKER];

export const DEMO_PASSWORD = "demo1234";

export const TRADER_DEPOSIT = "1000000";
export const BOT_DEPOSIT = "1000000000";

export const connect = connectRedis;

const publish = (command: Record<string, unknown>) =>
  publishToStream(config.ORDERS_CREATE, command);

export const createMarket = (slug: string) =>
  publish({
    userId: "demo",
    messageType: "create-market",
    correlationId: crypto.randomUUID(),
    marketSlug: slug,
  });

export const deposit = (userId: string, amount: string) =>
  publish({
    userId,
    messageType: "on-ramp",
    correlationId: crypto.randomUUID(),
    amount,
  });

export const limitOrder = (
  userId: string,
  market: string,
  side: "LONG" | "SHORT",
  price: string,
  quantity: string,
) =>
  publish({
    userId,
    messageType: "create-order",
    correlationId: crypto.randomUUID(),
    market,
    side,
    type: "LIMIT",
    quantity,
    leverage: 10,
    price,
  });

export const marketOrder = (
  userId: string,
  market: string,
  side: "LONG" | "SHORT",
  quantity: string,
) =>
  publish({
    userId,
    messageType: "create-order",
    correlationId: crypto.randomUUID(),
    market,
    side,
    type: "MARKET",
    quantity,
    leverage: 10,
    slippageTolerance: 0.02,
  });

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const markOf = async (slug: string): Promise<number | null> => {
  try {
    const res = await fetch(`${config.API_URL}/api/v1/markets/${slug}/risk`);
    const body = (await res.json()) as { markPrice: string | null };
    return body.markPrice ? Number(body.markPrice) : null;
  } catch {
    return null;
  }
};
