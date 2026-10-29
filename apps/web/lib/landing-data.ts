import { getCandles, getMarketRisk } from "@/lib/api/market";
import { tickerFromHourlyCandles } from "@/lib/candles";
import { MARKETS, type MarketConfig } from "@/lib/markets";
import type { Candle, Ticker } from "@/lib/types";

const HOURS_IN_DAY = 24;

export interface MarketOverview {
  market: MarketConfig;
  candles: Candle[] | null;
  ticker: Ticker | null;
  markPrice: string | null;
  fundingRateBps: string | null;
}

const loadMarketOverview = async (market: MarketConfig) => {
  const [candlesResult, riskResult] = await Promise.allSettled([
    getCandles(market.slug, "1h", HOURS_IN_DAY),
    getMarketRisk(market.slug),
  ]);

  const candles =
    candlesResult.status === "fulfilled" && candlesResult.value.length
      ? candlesResult.value
      : null;
  const risk = riskResult.status === "fulfilled" ? riskResult.value : null;

  const overview: MarketOverview = {
    market,
    candles,
    ticker: candles ? tickerFromHourlyCandles(candles) : null,
    markPrice: risk?.markPrice ?? null,
    fundingRateBps: risk?.fundingRateBps ?? null,
  };
  return overview;
};

export const loadMarketOverviews = () =>
  Promise.all(MARKETS.map(loadMarketOverview));
