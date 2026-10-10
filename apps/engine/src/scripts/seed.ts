import { connectRedis, publishToStream } from "@perpex/redis";
import { config } from "@perpex/config";

const MARKET = "BTC_PERP";
const LEVERAGE = 10;
const DEPOSIT = "100000";
const USERS = ["alice", "bob", "carol"];

const publish = (command: Record<string, unknown>) =>
  publishToStream(config.ORDERS_CREATE, command);

const createMarket = () =>
  publish({
    userId: "seed",
    messageType: "create-market",
    correlationId: crypto.randomUUID(),
    marketSlug: MARKET,
  });

const deposit = (userId: string, amount: string) =>
  publish({
    userId,
    messageType: "on-ramp",
    correlationId: crypto.randomUUID(),
    amount,
  });

const order = (
  userId: string,
  side: "LONG" | "SHORT",
  price: string,
  quantity: string,
) =>
  publish({
    userId,
    messageType: "create-order",
    correlationId: crypto.randomUUID(),
    market: MARKET,
    side,
    type: "LIMIT",
    quantity,
    leverage: LEVERAGE,
    price,
    slippageTolerance: undefined,
  });

await connectRedis();

console.log(`seeding market ${MARKET}`);

await createMarket();

for (const userId of USERS) {
  await deposit(userId, DEPOSIT);
  console.log(`funded ${userId}`);
}

await order("alice", "LONG", "59000", "1");
await order("carol", "SHORT", "61000", "1");
console.log("placed resting bids/asks around the mid");

await order("alice", "LONG", "60000", "1");
await order("bob", "SHORT", "60000", "1");
console.log("placed a crossing order — expect a fill and two positions");

await new Promise((resolve) => setTimeout(resolve, 300));
console.log("seed complete; watch the engine logs and the ws depth feed");
process.exit(0);
