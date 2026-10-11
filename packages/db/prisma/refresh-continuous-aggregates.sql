-- Run once after applying the add_candle_continuous_aggregates migration, to
-- backfill the aggregates (they are created WITH NO DATA, i.e. empty).
-- CALL refresh_continuous_aggregate(...) manages its own transactions, so it
-- cannot run inside a migration transaction -- that is why this lives in a
-- separate file, executed statement-by-statement by scripts/refresh-candles.ts.
--
-- Usage: cd packages/db && bun run refresh:candles

CALL refresh_continuous_aggregate('candles_5m',  NULL, NULL);
CALL refresh_continuous_aggregate('candles_15m', NULL, NULL);
CALL refresh_continuous_aggregate('candles_1h',  NULL, NULL);
CALL refresh_continuous_aggregate('candles_4h',  NULL, NULL);
CALL refresh_continuous_aggregate('candles_1d',  NULL, NULL);
