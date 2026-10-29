import {
  getCandles,
  getDepth,
  getMarketRisk,
  getTrades,
} from "@/lib/api/market";
import {
  CHART_CANDLE_LIMIT,
  DEFAULT_INTERVAL,
  tickerFromHourlyCandles,
} from "@/lib/candles";
import { MARKETS, type MarketConfig } from "@/lib/markets";
import type { Candle, Depth, MarketRisk, Ticker, Trade } from "@/lib/types";

const RECENT_TRADES = 40;

export interface TerminalData {
  candles: Candle[];
  depth: Depth;
  trades: Trade[];
  risk: MarketRisk;
  ticker: Ticker;
}

export const loadTerminalData = async (market: MarketConfig) => {
  const [candles, trades, depth, risk] = await Promise.all([
    getCandles(market.slug, DEFAULT_INTERVAL, CHART_CANDLE_LIMIT),
    getTrades(market.slug, RECENT_TRADES),
    getDepth(market.slug),
    getMarketRisk(market.slug),
  ]);
  const hourlyCandles =
    DEFAULT_INTERVAL === "1h"
      ? candles
      : await getCandles(market.slug, "1h", 24);

  return {
    candles,
    trades,
    depth,
    risk,
    ticker: tickerFromHourlyCandles(hourlyCandles),
  };
};

export interface MarketSummary {
  market: MarketConfig;
  price: string;
  changePct: string;
  volume: string;
}

const loadMarketSummary = async (market: MarketConfig) => {
  const [risk, hourlyCandles] = await Promise.all([
    getMarketRisk(market.slug),
    getCandles(market.slug, "1h", 24),
  ]);
  const ticker = tickerFromHourlyCandles(hourlyCandles);

  return {
    market,
    price: risk.markPrice ?? ticker.last,
    changePct: ticker.changePct,
    volume: ticker.volume,
  };
};

export const loadMarketSummaries = async () => {
  const summaries = await Promise.all(
    MARKETS.map((market) => loadMarketSummary(market).catch(() => null)),
  );
  return summaries.filter((summary) => summary !== null);
};
