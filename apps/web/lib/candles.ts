import type { Candle, Ticker, Trade } from "@/lib/types";

export const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export type Interval = (typeof INTERVALS)[number];

export const INTERVAL_SECONDS: Record<Interval, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
};

export const DEFAULT_INTERVAL: Interval = "1h";
export const CHART_CANDLE_LIMIT = 300;

export const addTradeToCandles = (
  candles: Candle[],
  trade: Trade,
  interval: Interval,
): Candle[] => {
  const size = INTERVAL_SECONDS[interval];
  const bucket = Math.floor(trade.timestamp / size) * size;
  const last = candles[candles.length - 1];

  if (last && bucket <= last.timestamp) {
    const price = Number(trade.price);
    const updated: Candle = {
      ...last,
      high: String(Math.max(Number(last.high), price)),
      low: String(Math.min(Number(last.low), price)),
      close: trade.price,
      volume: String(Number(last.volume) + Number(trade.quantity)),
    };
    return [...candles.slice(0, -1), updated];
  }

  const candle: Candle = {
    timestamp: bucket,
    open: trade.price,
    high: trade.price,
    low: trade.price,
    close: trade.price,
    volume: trade.quantity,
  };
  return [...candles, candle];
};

export const tickerFromHourlyCandles = (hourlyCandles: Candle[]): Ticker => {
  const candles = hourlyCandles.slice(-24);
  const first = candles[0];
  const last = candles[candles.length - 1];

  if (!first || !last) {
    return {
      last: "0",
      change: "0",
      changePct: "0",
      high: "0",
      low: "0",
      volume: "0",
    };
  }

  const open = Number(first.open);
  const close = Number(last.close);
  const change = close - open;
  const changePct = open === 0 ? 0 : (change / open) * 100;
  const high = Math.max(...candles.map((candle) => Number(candle.high)));
  const low = Math.min(...candles.map((candle) => Number(candle.low)));
  const volume = candles.reduce(
    (sum, candle) => sum + Number(candle.volume) * Number(candle.close),
    0,
  );

  return {
    last: String(close),
    change: String(change),
    changePct: String(changePct),
    high: String(high),
    low: String(low),
    volume: String(volume),
  };
};
