import { connectRedis, publishToStream } from "@perpex/redis";
import { config } from "@perpex/config";
import { LEVERAGE } from "./settings.ts";

type Side = "LONG" | "SHORT";

export const connectToRedis = connectRedis;

const sendToEngine = (command: Record<string, unknown>) =>
  publishToStream(config.ORDERS_CREATE, {
    ...command,
    correlationId: crypto.randomUUID(),
  });

export const createMarket = (slug: string) =>
  sendToEngine({
    messageType: "create-market",
    userId: "demo",
    marketSlug: slug,
  });

export const deposit = (userId: string, amount: string) =>
  sendToEngine({ messageType: "on-ramp", userId, amount });

export const placeLimitOrder = (order: {
  userId: string;
  market: string;
  side: Side;
  price: string;
  quantity: string;
}) =>
  sendToEngine({
    messageType: "create-order",
    type: "LIMIT",
    leverage: LEVERAGE,
    ...order,
  });

export const placeMarketOrder = (order: {
  userId: string;
  market: string;
  side: Side;
  quantity: string;
}) =>
  sendToEngine({
    messageType: "create-order",
    type: "MARKET",
    leverage: LEVERAGE,
    slippageTolerance: 0.02,
    ...order,
  });

export const getMarkPrice = async (slug: string): Promise<number | null> => {
  try {
    const response = await fetch(
      `${config.API_URL}/api/v1/markets/${slug}/risk`,
    );
    const body = (await response.json()) as { markPrice: string | null };
    return body.markPrice ? Number(body.markPrice) : null;
  } catch {
    return null;
  }
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
