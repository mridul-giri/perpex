import bcrypt from "bcrypt";
import { Client } from "pg";
import { prisma } from "@perpex/db";
import { config } from "@perpex/config";
import {
  MARKETS,
  DEMO_USERS,
  DEMO_PASSWORD,
  sleep,
  type MarketConfig,
} from "./lib.ts";

export const ensureUsers = async () => {
  const password = await bcrypt.hash(DEMO_PASSWORD, 4);
  for (const id of DEMO_USERS) {
    await prisma.user.upsert({
      where: { id },
      update: { name: id, email: `${id}@demo.local`, password },
      create: { id, name: id, email: `${id}@demo.local`, password },
    });
  }
};

export const waitForMarkets = async (timeoutMs = 15000) => {
  const slugs = MARKETS.map((market) => market.slug);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const found = await prisma.market.findMany({
      where: { marketSlug: { in: slugs } },
    });
    if (found.length === slugs.length) return true;
    await sleep(200);
  }

  console.warn("timed out waiting for markets to persist; continuing anyway");
  return false;
};

const COUNT = 10080;
const MINUTE_MS = 60 * 1000;

const mulberry32 = (seed: number) => {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const seedOf = (value: string) =>
  [...value].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

export const seedCandleHistory = async (
  markFor: (market: MarketConfig) => Promise<number>,
) => {
  const nowMinute = Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS;

  for (const market of MARKETS) {
    const row = await prisma.market.findUnique({
      where: { marketSlug: market.slug },
    });
    if (!row) {
      console.log(`skip candles for ${market.slug}: market not found`);
      continue;
    }

    await prisma.candle.deleteMany({ where: { marketId: row.id } });

    const target = await markFor(market);
    const rand = mulberry32(seedOf(market.slug));
    const rows: {
      timestamp: Date;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }[] = [];
    let price = target;

    for (let i = COUNT - 1; i >= 0; i--) {
      const open = price;
      const close = open + (rand() - 0.5) * target * 0.0018;
      const wick = target * 0.0012 * rand();
      rows.push({
        timestamp: new Date(nowMinute - i * MINUTE_MS),
        open,
        high: Math.max(open, close) + wick,
        low: Math.min(open, close) - wick,
        close,
        volume: rand() * market.vol + market.vol * 0.2,
      });
      price = close;
    }

    const lastClose = rows[rows.length - 1]!.close;
    const factor = lastClose ? target / lastClose : 1;
    const data = rows.map((r) => ({
      marketId: row.id,
      timestamp: r.timestamp,
      open: (r.open * factor).toFixed(market.dp),
      high: (r.high * factor).toFixed(market.dp),
      low: (r.low * factor).toFixed(market.dp),
      close: (r.close * factor).toFixed(market.dp),
      volume: r.volume.toFixed(3),
    }));

    await prisma.candle.createMany({ data, skipDuplicates: true });
    console.log(`seeded ${data.length} candles for ${market.slug}`);
  }
};

const INTERVAL_VIEWS = [
  "candles_5m",
  "candles_15m",
  "candles_1h",
  "candles_4h",
  "candles_1d",
];

export const refreshAggregates = async () => {
  const client = new Client({ connectionString: config.DATABASE_URL });
  await client.connect();

  try {
    for (const view of INTERVAL_VIEWS) {
      await client.query(
        `CALL refresh_continuous_aggregate('${view}', NULL, NULL)`,
      );
    }
    console.log("backfilled candle continuous aggregates");
  } catch (error) {
    console.warn("continuous-aggregate refresh skipped:", error);
  } finally {
    await client.end();
  }
};

export const disconnect = () => prisma.$disconnect();
