import { prisma, Prisma } from "@perpex/db";
import { ApiError } from "../utils/api-error";

export interface Candle {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

const INTERVAL_VIEWS: Record<string, string | null> = {
  "1m": null,
  "5m": "candles_5m",
  "15m": "candles_15m",
  "1h": "candles_1h",
  "4h": "candles_4h",
  "1d": "candles_1d",
};

const toDate = (value: string): Date => {
  const numeric = Number(value);
  const date = Number.isNaN(numeric)
    ? new Date(value)
    : new Date(numeric < 1e11 ? numeric * 1000 : numeric); // seconds vs ms
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `Invalid timestamp: ${value}`);
  }
  return date;
};

interface CandleRow {
  bucket: Date;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export const queryCandles = async (params: {
  market: string;
  interval: string;
  from?: string;
  to?: string;
  limit: number;
}): Promise<Candle[]> => {
  const { market, interval, from, to, limit } = params;

  if (!(interval in INTERVAL_VIEWS)) {
    throw new ApiError(400, `Unsupported interval: ${interval}`);
  }

  const source = INTERVAL_VIEWS[interval];

  const marketFilter = Prisma.sql`"marketId" = (SELECT id FROM "Market" WHERE "marketSlug" = ${market})`;

  const bucketRef = source ? Prisma.raw("bucket") : Prisma.raw('"timestamp"');
  const fromClause = from
    ? Prisma.sql`AND ${bucketRef} >= ${toDate(from)}`
    : Prisma.empty;
  const toClause = to
    ? Prisma.sql`AND ${bucketRef} <= ${toDate(to)}`
    : Prisma.empty;

  const rows = source
    ? await prisma.$queryRaw<CandleRow[]>(Prisma.sql`
        SELECT bucket, open, high, low, close, volume
        FROM ${Prisma.raw(source)}
        WHERE ${marketFilter}
        ${fromClause}
        ${toClause}
        ORDER BY bucket DESC
        LIMIT ${limit}
      `)
    : await prisma.$queryRaw<CandleRow[]>(Prisma.sql`
        SELECT "timestamp" AS bucket, open, high, low, close, volume
        FROM "Candle"
        WHERE ${marketFilter}
        ${fromClause}
        ${toClause}
        ORDER BY bucket DESC
        LIMIT ${limit}
      `);

  return rows
    .map((row) => ({
      timestamp: Math.floor(new Date(row.bucket).getTime() / 1000),
      open: String(row.open),
      high: String(row.high),
      low: String(row.low),
      close: String(row.close),
      volume: String(row.volume),
    }))
    .reverse();
};
