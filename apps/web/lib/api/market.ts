import type { Interval } from "@/lib/candles";
import type { Candle, Depth, MarketRisk, Trade } from "@/lib/types";
import { apiRequest } from "./client";

const TIMEOUT_MS = 4000;
const timeout = () => AbortSignal.timeout(TIMEOUT_MS);

export const getCandles = async (
  slug: string,
  interval: Interval,
  limit: number,
) => {
  const response = await apiRequest<{ candles: Candle[] }>(
    `/markets/${slug}/candles`,
    { params: { interval, limit }, signal: timeout() },
  );
  return response.candles;
};

export const getTrades = async (slug: string, limit: number) => {
  const response = await apiRequest<{ items: Trade[] }>(
    `/markets/${slug}/trades`,
    { params: { limit }, signal: timeout() },
  );
  return response.items;
};

export const getDepth = async (slug: string) => {
  const response = await apiRequest<{ depth: Depth }>(
    `/markets/${slug}/orderbook`,
    { signal: timeout() },
  );
  return response.depth;
};

export const getMarketRisk = (slug: string) =>
  apiRequest<MarketRisk>(`/markets/${slug}/risk`, { signal: timeout() });
