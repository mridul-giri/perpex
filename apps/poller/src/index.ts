import {
  connectRedis,
  consumeFromGroup,
  createConsumerGroup,
  STREAM_READERS,
} from "@perpex/redis";
import { config } from "@perpex/config";
import { createOrder } from "./services/order";
import { updateBalance } from "./services/balance";
import { upsertMarket } from "./services/market";

await connectRedis();

const { group: POLLER_GROUP, consumer: POLLER_CONSUMER } =
  STREAM_READERS.poller;

async function storeToDb(data: any) {
  switch (data.messageType) {
    case "order-created": {
      await createOrder(data);
      break;
    }
    case "balance-updated": {
      await updateBalance(data);
      break;
    }
    case "market-created": {
      await upsertMarket(data);
      break;
    }
  }
}

await createConsumerGroup(config.ORDERS_ACK, POLLER_GROUP);
await consumeFromGroup(
  config.ORDERS_ACK,
  POLLER_GROUP,
  POLLER_CONSUMER,
  async (data) => {
    console.log("from the pooler", data);
    await storeToDb(data);
  },
);
