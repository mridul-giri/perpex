import { deriveTicker } from "./derive";
import { MARKETS, marketByUiSymbol } from "./markets";
import { PerpexProvider } from "./provider";
import type { Candle, Depth, MarketRisk, Ticker, Trade } from "./types";

export interface TerminalData {
  candles: Candle[];
  depth: Depth;
  trades: Trade[];
  ticker: Ticker;
  risk: MarketRisk;
}

export async function loadTerminalData(
  uiMarket: string,
): Promise<TerminalData> {
  const config = marketByUiSymbol(uiMarket);
  if (!config) throw new Error(`Unknown market: ${uiMarket}`);

  const provider = new PerpexProvider();
  const [candles, trades, depth, risk] = await Promise.all([
    provider.getCandles(config.perpex, "1m", 300),
    provider.getTrades(config.perpex, 40),
    provider.getDepth(config.perpex),
    provider.getMarketRisk(config.perpex),
  ]);

  return { candles, depth, trades, ticker: deriveTicker(candles), risk };
}

export interface MarketSummary {
  ui: string;
  perpex: string;
  price: string;
  change: string;
  changePct: string;
  volume: string;
}

export async function loadMarketSummaries(): Promise<MarketSummary[]> {
  const provider = new PerpexProvider();

  const results = await Promise.all(
    MARKETS.map(async (market): Promise<MarketSummary | null> => {
      try {
        const [risk, ticker] = await Promise.all([
          provider.getMarketRisk(market.perpex),
          provider.getTicker(market.perpex),
        ]);
        return {
          ui: market.ui,
          perpex: market.perpex,
          price: risk.markPrice ?? ticker.last,
          change: ticker.change,
          changePct: ticker.changePct,
          volume: ticker.volume,
        };
      } catch {
        return null;
      }
    }),
  );

  return results.filter(
    (summary): summary is MarketSummary => summary !== null,
  );
}
