import type { Candle, Ticker } from "./types";

export function deriveTicker(candles: Candle[]): Ticker {
  if (candles.length === 0) {
    return {
      last: "0",
      change: "0",
      changePct: "0",
      high: "0",
      low: "0",
      volume: "0",
      openInterest: "",
    };
  }

  const first = Number(candles[0]!.open);
  const last = Number(candles[candles.length - 1]!.close);
  const change = last - first;
  const changePct = first === 0 ? 0 : (change / first) * 100;
  const high = Math.max(...candles.map((c) => Number(c.high)));
  const low = Math.min(...candles.map((c) => Number(c.low)));
  const quoteVolume = candles.reduce(
    (sum, c) => sum + Number(c.volume) * Number(c.close),
    0,
  );

  return {
    last: String(last),
    change: String(change),
    changePct: String(changePct),
    high: String(high),
    low: String(low),
    volume: String(quoteVolume),
    openInterest: "",
  };
}
