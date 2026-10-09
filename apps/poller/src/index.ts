import {
  connectRedis,
  consumeFromGroup,
  createConsumerGroup,
  STREAM_READERS,
} from "@perpex/redis";
import { config } from "@perpex/config";
import type { ClosedPosition, Liquidation, Order } from "@perpex/types";
import { cancelOrder, createOrder, updateOrder } from "./services/order";
import { createFill } from "./services/fill";
import { updateBalance } from "./services/balance";
import { upsertMarket } from "./services/market";
import { createClosedPosition } from "./services/position";
import { createLiquidation } from "./services/liquidation";

await connectRedis();

const { group: POLLER_GROUP, consumer: POLLER_CONSUMER } =
  STREAM_READERS.poller;

async function storeToDb(data: any) {
  switch (data.messageType) {
    case "market-created": {
      await upsertMarket(data);
      break;
    }
    case "order-created": {
      await createOrder(data as Order);
      break;
    }
    case "order-updated": {
      await updateOrder(data as Order);
      break;
    }
    case "order-cancelled": {
      await cancelOrder(data as { orderId: string });
      break;
    }
    case "fill-created": {
      await createFill(data);
      break;
    }
    case "balance-updated": {
      await updateBalance(data);
      break;
    }
    case "position-closed": {
      await createClosedPosition(data as ClosedPosition);
      break;
    }
    case "liquidation": {
      await createLiquidation(data as Liquidation);
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
    await storeToDb(data);
  },
);
