import {
  BOT_DEPOSIT,
  BOT_MAKER,
  BOT_TAKER,
  MARKETS,
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
  waitForMarketsInDatabase,
} from "./database.ts";

const TICK_MS = 1500;
const PRICE_REFRESH_TICKS = 4;

const livePrices = new Map<string, number>();

const refreshLivePrices = async () => {
  for (const market of MARKETS) {
    const price = await getMarkPrice(market.slug);
    if (price !== null) livePrices.set(market.slug, price);
  }
};

const randomSpread = () => 0.00005 + Math.random() * 0.0003;

const quoteAndTrade = async (market: DemoMarket) => {
  const price = livePrices.get(market.slug) ?? market.fallbackPrice;
  const buyPrice = price * (1 - randomSpread());
  const sellPrice = price * (1 + randomSpread());

  await placeLimitOrder({
    userId: BOT_MAKER,
    market: market.slug,
    side: "LONG",
    price: buyPrice.toFixed(market.decimals),
    quantity: market.botQuoteQuantity,
  });
  await placeLimitOrder({
    userId: BOT_MAKER,
    market: market.slug,
    side: "SHORT",
    price: sellPrice.toFixed(market.decimals),
    quantity: market.botQuoteQuantity,
  });

  await placeMarketOrder({
    userId: BOT_TAKER,
    market: market.slug,
    side: Math.random() > 0.5 ? "LONG" : "SHORT",
    quantity: market.botTradeQuantity,
  });
};

const stop = async () => {
  await closeDatabase();
  process.exit(0);
};

process.on("SIGINT", () => void stop());
process.on("SIGTERM", () => void stop());

await connectToRedis();

await createDemoUsers();
for (const market of MARKETS) await createMarket(market.slug);
await waitForMarketsInDatabase();

await deposit(BOT_MAKER, BOT_DEPOSIT);
await deposit(BOT_TAKER, BOT_DEPOSIT);

await refreshLivePrices();
console.log(
  "demo bot started on",
  MARKETS.map((market) => market.slug).join(", "),
);

for (let tick = 1; ; tick++) {
  if (tick % PRICE_REFRESH_TICKS === 0) await refreshLivePrices();

  for (const market of MARKETS) {
    await quoteAndTrade(market);
  }

  if (tick % 10 === 0) console.log(`demo bot tick ${tick}`);
  await sleep(TICK_MS);
}
