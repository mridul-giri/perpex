-- TimescaleDB is required from here on (docker image: timescale/timescaledb).
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Ensure "Candle" is a hypertable even if the earlier conditional migration
-- ran on a plain Postgres instance.
SELECT create_hypertable(
  '"Candle"',
  by_range('timestamp'),
  if_not_exists => TRUE,
  migrate_data  => TRUE
);

-- One continuous aggregate per chart interval. WITH NO DATA defers the initial
-- materialization so this migration does not block; run refresh:candles after.
CREATE MATERIALIZED VIEW candles_5m
WITH (timescaledb.continuous) AS
SELECT
  "marketId",
  time_bucket('5 minutes', "timestamp") AS bucket,
  first(open, "timestamp")  AS open,
  max(high::numeric)::text  AS high,
  min(low::numeric)::text   AS low,
  last(close, "timestamp")  AS close,
  sum(volume::numeric)      AS volume
FROM "Candle"
GROUP BY "marketId", bucket
WITH NO DATA;

CREATE MATERIALIZED VIEW candles_15m
WITH (timescaledb.continuous) AS
SELECT
  "marketId",
  time_bucket('15 minutes', "timestamp") AS bucket,
  first(open, "timestamp")  AS open,
  max(high::numeric)::text  AS high,
  min(low::numeric)::text   AS low,
  last(close, "timestamp")  AS close,
  sum(volume::numeric)      AS volume
FROM "Candle"
GROUP BY "marketId", bucket
WITH NO DATA;

CREATE MATERIALIZED VIEW candles_1h
WITH (timescaledb.continuous) AS
SELECT
  "marketId",
  time_bucket('1 hour', "timestamp") AS bucket,
  first(open, "timestamp")  AS open,
  max(high::numeric)::text  AS high,
  min(low::numeric)::text   AS low,
  last(close, "timestamp")  AS close,
  sum(volume::numeric)      AS volume
FROM "Candle"
GROUP BY "marketId", bucket
WITH NO DATA;

CREATE MATERIALIZED VIEW candles_4h
WITH (timescaledb.continuous) AS
SELECT
  "marketId",
  time_bucket('4 hours', "timestamp") AS bucket,
  first(open, "timestamp")  AS open,
  max(high::numeric)::text  AS high,
  min(low::numeric)::text   AS low,
  last(close, "timestamp")  AS close,
  sum(volume::numeric)      AS volume
FROM "Candle"
GROUP BY "marketId", bucket
WITH NO DATA;

CREATE MATERIALIZED VIEW candles_1d
WITH (timescaledb.continuous) AS
SELECT
  "marketId",
  time_bucket('1 day', "timestamp") AS bucket,
  first(open, "timestamp")  AS open,
  max(high::numeric)::text  AS high,
  min(low::numeric)::text   AS low,
  last(close, "timestamp")  AS close,
  sum(volume::numeric)      AS volume
FROM "Candle"
GROUP BY "marketId", bucket
WITH NO DATA;

-- Refresh policies, bucket-scaled. end_offset ~ bucket width so an in-progress
-- bucket is never materialized as final.
SELECT add_continuous_aggregate_policy('candles_5m',
  start_offset => INTERVAL '3 hours',  end_offset => INTERVAL '5 minutes',
  schedule_interval => INTERVAL '5 minutes');
SELECT add_continuous_aggregate_policy('candles_15m',
  start_offset => INTERVAL '6 hours',  end_offset => INTERVAL '15 minutes',
  schedule_interval => INTERVAL '15 minutes');
SELECT add_continuous_aggregate_policy('candles_1h',
  start_offset => INTERVAL '1 day',    end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');
SELECT add_continuous_aggregate_policy('candles_4h',
  start_offset => INTERVAL '3 days',   end_offset => INTERVAL '4 hours',
  schedule_interval => INTERVAL '1 hour');
SELECT add_continuous_aggregate_policy('candles_1d',
  start_offset => INTERVAL '7 days',   end_offset => INTERVAL '1 day',
  schedule_interval => INTERVAL '6 hours');
