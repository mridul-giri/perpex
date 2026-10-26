import bcrypt from "bcrypt";
import { Client } from "pg";
import { prisma } from "@perpex/db";
import { config } from "@perpex/config";
import {
  ALL_DEMO_USERS,
  CANDLE_HISTORY_MINUTES,
  DEMO_PASSWORD,
  MARKETS,
  type DemoMarket,
} from "./settings.ts";
import { sleep } from "./engine-commands.ts";

export const createDemoUsers = async () => {
  const password = await bcrypt.hash(DEMO_PASSWORD, 4);

  for (const id of ALL_DEMO_USERS) {
    const user = { id, name: id, email: `${id}@demo.local`, password };
    await prisma.user.upsert({ where: { id }, update: user, create: user });
  }
};

export const waitForMarketsInDatabase = async () => {
  const slugs = MARKETS.map((market) => market.slug);
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    const saved = await prisma.market.count({
      where: { marketSlug: { in: slugs } },
    });
    if (saved === slugs.length) return;
    await sleep(200);
  }

  console.warn("markets were not saved within 15s; continuing anyway");
};

export const writeCandleHistory = async (
  market: DemoMarket,
  endPrice: number,
) => {
  const marketRow = await prisma.market.findUnique({
    where: { marketSlug: market.slug },
  });
  if (!marketRow) {
    console.warn(`skipping candles for ${market.slug}: market not found`);
    return;
  }

  const candles = buildCandles(market, endPrice);

  await prisma.candle.deleteMany({ where: { marketId: marketRow.id } });
  await prisma.candle.createMany({
    data: candles.map((candle) => ({
      marketId: marketRow.id,
      timestamp: candle.timestamp,
      open: candle.open.toFixed(market.decimals),
      high: candle.high.toFixed(market.decimals),
      low: candle.low.toFixed(market.decimals),
      close: candle.close.toFixed(market.decimals),
      volume: candle.volume.toFixed(3),
    })),
    skipDuplicates: true,
  });
};

interface Candle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const ONE_MINUTE_MS = 60 * 1000;
const MAX_MOVE_PER_MINUTE = 0.0018;
const MAX_WICK = 0.0012;

const buildCandles = (market: DemoMarket, endPrice: number): Candle[] => {
  const random = createRandom(market.slug);
  const currentMinute = Math.floor(Date.now() / ONE_MINUTE_MS) * ONE_MINUTE_MS;

  const candles: Candle[] = [];
  let price = endPrice;

  for (
    let minutesAgo = CANDLE_HISTORY_MINUTES - 1;
    minutesAgo >= 0;
    minutesAgo--
  ) {
    const open = price;
    const close = open + (random() - 0.5) * endPrice * MAX_MOVE_PER_MINUTE;
    const wick = random() * endPrice * MAX_WICK;

    candles.push({
      timestamp: new Date(currentMinute - minutesAgo * ONE_MINUTE_MS),
      open,
      high: Math.max(open, close) + wick,
      low: Math.min(open, close) - wick,
      close,
      volume: market.candleVolume * (0.2 + random()),
    });

    price = close;
  }

  const lastClose = candles[candles.length - 1]!.close;
  const scale = endPrice / lastClose;

  return candles.map((candle) => ({
    ...candle,
    open: candle.open * scale,
    high: candle.high * scale,
    low: candle.low * scale,
    close: candle.close * scale,
  }));
};

const createRandom = (text: string) => {
  let seed = [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const CANDLE_VIEWS = [
  "candles_5m",
  "candles_15m",
  "candles_1h",
  "candles_4h",
  "candles_1d",
];

export const refreshCandleViews = async () => {
  const client = new Client({ connectionString: config.DATABASE_URL });
  await client.connect();

  try {
    for (const view of CANDLE_VIEWS) {
      await client.query(
        `CALL refresh_continuous_aggregate('${view}', NULL, NULL)`,
      );
    }
  } catch (error) {
    console.warn("candle view refresh skipped:", error);
  } finally {
    await client.end();
  }
};

export const closeDatabase = () => prisma.$disconnect();
