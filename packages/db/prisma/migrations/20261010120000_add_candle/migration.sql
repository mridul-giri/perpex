-- CreateTable
CREATE TABLE "Candle" (
    "marketId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "open" TEXT NOT NULL,
    "high" TEXT NOT NULL,
    "low" TEXT NOT NULL,
    "close" TEXT NOT NULL,
    "volume" TEXT NOT NULL,

    CONSTRAINT "Candle_pkey" PRIMARY KEY ("marketId","timestamp")
);

-- AddForeignKey
ALTER TABLE "Candle" ADD CONSTRAINT "Candle_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Convert to a TimescaleDB hypertable when the extension is available.
-- On a plain Postgres instance this is a no-op and "Candle" stays a normal table.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'timescaledb') THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS timescaledb';
    PERFORM create_hypertable('"Candle"', 'timestamp', if_not_exists => TRUE);
  END IF;
END $$;
