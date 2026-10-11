import { prisma } from "@perpex/db";

interface CandleAccumulator {
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  timestamp: Date;
}

const MINUTE_MS = 60 * 1000;

const candles = new Map<string, CandleAccumulator>();

const currentMinute = () =>
  new Date(Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS);

export const updateCandle = (
  market: string,
  price: string,
  quantity: string,
) => {
  const existing = candles.get(market);

  if (!existing) {
    candles.set(market, {
      open: price,
      high: price,
      low: price,
      close: price,
      volume: quantity,
      timestamp: currentMinute(),
    });
    return;
  }

  existing.high = String(Math.max(Number(existing.high), Number(price)));
  existing.low = String(Math.min(Number(existing.low), Number(price)));
  existing.close = price;
  existing.volume = String(Number(existing.volume) + Number(quantity));
};

const flush = async () => {
  const snapshot = [...candles.entries()];
  candles.clear();

  for (const [marketSlug, candle] of snapshot) {
    try {
      const market = await prisma.market.findUnique({ where: { marketSlug } });
      if (!market) continue;

      await prisma.candle.upsert({
        where: {
          marketId_timestamp: {
            marketId: market.id,
            timestamp: candle.timestamp,
          },
        },
        create: {
          marketId: market.id,
          timestamp: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        },
        update: {
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        },
      });
    } catch (error) {
      console.error(`candle write failed for ${marketSlug}`, error);
    }
  }
};

export const startCandleWriter = () => {
  const msToNextMinute = MINUTE_MS - (Date.now() % MINUTE_MS);

  setTimeout(() => {
    void flush();
    setInterval(() => void flush(), MINUTE_MS);
  }, msToNextMinute);
};
