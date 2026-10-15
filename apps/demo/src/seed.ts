import {
  BOT_DEPOSIT,
  MAKER,
  MARKETS,
  TAKER,
  TRADERS,
  TRADER_DEPOSIT,
  connect,
  createMarket,
  DEMO_USERS,
  deposit,
  limitOrder,
  marketOrder,
  markOf,
  sleep,
} from "./lib.ts";
import {
  disconnect,
  ensureUsers,
  refreshAggregates,
  seedCandleHistory,
  waitForMarkets,
} from "./db.ts";

const LEVELS = 12;

await connect();

console.log("ensuring demo users");
await ensureUsers();

for (const market of MARKETS) await createMarket(market.slug);
await waitForMarkets();
await sleep(400);

for (const userId of DEMO_USERS) {
  const amount =
    userId === MAKER || userId === TAKER ? BOT_DEPOSIT : TRADER_DEPOSIT;
  await deposit(userId, amount);
}
await sleep(400);

for (const market of MARKETS) {
  const center = (await markOf(market.slug)) ?? market.fallback;
  for (let i = 1; i <= LEVELS; i++) {
    const bid = (center * (1 - market.stepPct * i)).toFixed(market.dp);
    const ask = (center * (1 + market.stepPct * i)).toFixed(market.dp);
    await limitOrder(
      TRADERS[i % TRADERS.length]!,
      market.slug,
      "LONG",
      bid,
      market.levelQty,
    );
    await limitOrder(
      TRADERS[(i + 3) % TRADERS.length]!,
      market.slug,
      "SHORT",
      ask,
      market.levelQty,
    );
  }
  console.log(
    `ladder placed for ${market.slug} around ${center.toFixed(market.dp)}`,
  );
}

await sleep(600);

for (const market of MARKETS) {
  await marketOrder(TRADERS[0]!, market.slug, "LONG", market.marketQty);
  await marketOrder(TRADERS[1]!, market.slug, "SHORT", market.marketQty);
}

await sleep(600);
console.log("seeding candle history");
await seedCandleHistory(
  async (market) => (await markOf(market.slug)) ?? market.fallback,
);
await refreshAggregates();

await disconnect();
console.log("demo seed complete");
process.exit(0);
