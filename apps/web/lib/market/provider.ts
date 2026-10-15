import { apiFetch, type RequestOptions } from "@/lib/http";
import { deriveTicker } from "./derive";
import type { Candle, Depth, MarketRisk, Ticker, Trade } from "./types";

export interface ProviderMarket {
  marketSlug: string;
  imageUrl?: string;
}

export interface MarketDataProvider {
  getMarkets(): Promise<ProviderMarket[]>;
  getCandles(
    market: string,
    interval?: string,
    limit?: number,
  ): Promise<Candle[]>;
  getTrades(market: string, limit?: number): Promise<Trade[]>;
  getDepth(market: string): Promise<Depth>;
  getMarketRisk(market: string): Promise<MarketRisk>;
  getTicker(market: string): Promise<Ticker>;
}

interface CandlesResponse {
  market: string;
  interval: string;
  candles: Candle[];
}

interface TradesResponse {
  market: string;
  items: Trade[];
  nextCursor: string | null;
}

interface OrderbookResponse {
  market: string;
  depth: Depth;
}

interface MarketsResponse {
  items: ProviderMarket[];
  nextCursor: string | null;
}

const TIMEOUT_MS = 4000;
const withTimeout = (): RequestOptions => ({
  signal: AbortSignal.timeout(TIMEOUT_MS),
});

export class PerpexProvider implements MarketDataProvider {
  async getMarkets(): Promise<ProviderMarket[]> {
    const res = await apiFetch<MarketsResponse>("/markets", withTimeout());
    return res.items;
  }

  async getCandles(
    market: string,
    interval = "1m",
    limit = 300,
  ): Promise<Candle[]> {
    const res = await apiFetch<CandlesResponse>(`/markets/${market}/candles`, {
      ...withTimeout(),
      params: { interval, limit },
    });
    return res.candles;
  }

  async getTrades(market: string, limit = 40): Promise<Trade[]> {
    const res = await apiFetch<TradesResponse>(`/markets/${market}/trades`, {
      ...withTimeout(),
      params: { limit },
    });
    return res.items;
  }

  async getDepth(market: string): Promise<Depth> {
    const res = await apiFetch<OrderbookResponse>(
      `/markets/${market}/orderbook`,
      withTimeout(),
    );
    return res.depth;
  }

  async getMarketRisk(market: string): Promise<MarketRisk> {
    return apiFetch<MarketRisk>(`/markets/${market}/risk`, withTimeout());
  }

  async getTicker(market: string): Promise<Ticker> {
    const candles = await this.getCandles(market, "1h", 24);
    return deriveTicker(candles);
  }
}
