import type { Candle, Trade } from "./types";

const MINUTE_SECONDS = 60;

export const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;

export const INTERVAL_SECONDS: Record<string, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
};

export const minuteBucket = (timestamp: number) =>
  Math.floor(timestamp / MINUTE_SECONDS) * MINUTE_SECONDS;

export function aggregateCandles(
  candles: Candle[],
  interval: string,
): Candle[] {
  const size = INTERVAL_SECONDS[interval] ?? MINUTE_SECONDS;
  const out: Candle[] = [];

  for (const candle of candles) {
    const bucket = Math.floor(candle.timestamp / size) * size;
    const last = out[out.length - 1];
    if (last && last.timestamp === bucket) {
      last.high = String(Math.max(Number(last.high), Number(candle.high)));
      last.low = String(Math.min(Number(last.low), Number(candle.low)));
      last.close = candle.close;
      last.volume = String(Number(last.volume) + Number(candle.volume));
    } else {
      out.push({
        timestamp: bucket,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      });
    }
  }

  return out;
}

export function foldTrade(candles: Candle[], trade: Trade): Candle[] {
  const bucket = minuteBucket(trade.timestamp);
  const last = candles[candles.length - 1];

  if (last && minuteBucket(last.timestamp) === bucket) {
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

  return [
    ...candles,
    {
      timestamp: bucket,
      open: trade.price,
      high: trade.price,
      low: trade.price,
      close: trade.price,
      volume: trade.quantity,
    },
  ];
}
