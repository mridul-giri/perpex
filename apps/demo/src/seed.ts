import {
  ALL_DEMO_USERS,
  BOT_DEPOSIT,
  BOT_MAKER,
  BOT_TAKER,
  LADDER_LEVELS,
  MARKETS,
  TRADER_DEPOSIT,
  TRADERS,
  type DemoMarket,
} from "./settings.ts";
import {
  connectToRedis,
  createMarket,
  deposit,
  getMarkPrice,
  placeLimitOrder,
  placeMarketOrder,
  sleep,
} from "./engine-commands.ts";
import {
  closeDatabase,
  createDemoUsers,
  refreshCandleViews,
  waitForMarketsInDatabase,
  writeCandleHistory,
} from "./database.ts";

const createMarkets = async () => {
  for (const market of MARKETS) {
    await createMarket(market.slug);
  }
  await waitForMarketsInDatabase();
};

const fundUsers = async () => {
  for (const userId of ALL_DEMO_USERS) {
    const isBot = userId === BOT_MAKER || userId === BOT_TAKER;
    await deposit(userId, isBot ? BOT_DEPOSIT : TRADER_DEPOSIT);
  }
};

const waitForLivePrice = async (market: DemoMarket) => {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    const price = await getMarkPrice(market.slug);
    if (price !== null) return price;
    await sleep(500);
  }

  console.warn(`no live price for ${market.slug}; using the fallback price`);
  return market.fallbackPrice;
};

const placeLadder = async (market: DemoMarket, centerPrice: number) => {
  for (let level = 1; level <= LADDER_LEVELS; level++) {
    const distance = market.ladderStep * level;
    const buyPrice = centerPrice * (1 - distance);
    const sellPrice = centerPrice * (1 + distance);

    await placeLimitOrder({
      userId: TRADERS[level % TRADERS.length]!,
      market: market.slug,
      side: "LONG",
      price: buyPrice.toFixed(market.decimals),
      quantity: market.ladderQuantity,
    });
    await placeLimitOrder({
      userId: TRADERS[(level + 3) % TRADERS.length]!,
      market: market.slug,
      side: "SHORT",
      price: sellPrice.toFixed(market.decimals),
      quantity: market.ladderQuantity,
    });
  }

  console.log(
    `placed ladder for ${market.slug} around ${centerPrice.toFixed(market.decimals)}`,
  );
};

const placeFirstTrades = async (market: DemoMarket) => {
  await placeMarketOrder({
    userId: TRADERS[0]!,
    market: market.slug,
    side: "LONG",
    quantity: market.seedTradeQuantity,
  });
  await placeMarketOrder({
    userId: TRADERS[1]!,
    market: market.slug,
    side: "SHORT",
    quantity: market.seedTradeQuantity,
  });
};

await connectToRedis();

console.log("1. creating demo users");
await createDemoUsers();

console.log("2. creating markets");
await createMarkets();

console.log("3. funding demo users");
await fundUsers();

console.log("4-5. placing ladders and first trades");
const livePrices = new Map<string, number>();
for (const market of MARKETS) {
  const price = await waitForLivePrice(market);
  livePrices.set(market.slug, price);

  await placeLadder(market, price);
  await placeFirstTrades(market);
}

console.log("6. writing candle history");
for (const market of MARKETS) {
  await writeCandleHistory(market, livePrices.get(market.slug)!);
}
await refreshCandleViews();

await closeDatabase();
console.log("demo seed complete");
process.exit(0);
