import { seededRandom } from "@/lib/seeded-random";
import type { Candle } from "@/lib/types";

const SAMPLE_COUNT = 24;

export function buildSampleCandles(seed: number) {
  const random = seededRandom(seed);
  const candles: Candle[] = [];
  let open = 100;

  for (let index = 0; index < SAMPLE_COUNT; index++) {
    const drift = 0.35;
    const close = open + drift + (random() - 0.5) * 3;
    const high = Math.max(open, close) + random() * 1.2;
    const low = Math.min(open, close) - random() * 1.2;
    candles.push({
      timestamp: index,
      open: String(open),
      high: String(high),
      low: String(low),
      close: String(close),
      volume: "0",
    });
    open = close;
  }

  return candles;
}
