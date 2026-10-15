import {
  BOT_DEPOSIT,
  MAKER,
  MARKETS,
  TAKER,
  connect,
  createMarket,
  deposit,
  limitOrder,
  marketOrder,
  markOf,
  sleep,
} from "./lib.ts";
import { disconnect, ensureUsers, waitForMarkets } from "./db.ts";

const TICK_MS = 1500;

await connect();

await ensureUsers();
for (const market of MARKETS) await createMarket(market.slug);
await waitForMarkets();

await deposit(MAKER, BOT_DEPOSIT);
await deposit(TAKER, BOT_DEPOSIT);
await sleep(600);

const marks = new Map<string, number>();

const refreshMarks = async () => {
  for (const market of MARKETS) {
    const mark = await markOf(market.slug);
    if (mark !== null) marks.set(market.slug, mark);
  }
};

await refreshMarks();
console.log(
  "demo bot started — quoting + crossing on",
  MARKETS.map((market) => market.slug).join(", "),
);

const stop = async () => {
  await disconnect();
  process.exit(0);
};

process.on("SIGINT", () => void stop());
process.on("SIGTERM", () => void stop());

let tick = 0;
const run = async () => {
  while (true) {
    tick += 1;
    if (tick % 4 === 1) await refreshMarks();

    for (const market of MARKETS) {
      const center = marks.get(market.slug) ?? market.fallback;
      const bid = center * (1 - (0.00005 + Math.random() * 0.0003));
      const ask = center * (1 + (0.00005 + Math.random() * 0.0003));

      await limitOrder(
        MAKER,
        market.slug,
        "LONG",
        bid.toFixed(market.dp),
        market.restQty,
      );
      await limitOrder(
        MAKER,
        market.slug,
        "SHORT",
        ask.toFixed(market.dp),
        market.restQty,
      );

      const side = Math.random() > 0.5 ? "LONG" : "SHORT";
      await marketOrder(TAKER, market.slug, side, market.takerQty);
    }

    if (tick % 10 === 0) console.log(`demo bot tick ${tick}`);
    await sleep(TICK_MS);
  }
};

void run();
