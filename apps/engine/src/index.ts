import {
  connectRedis,
  consumeFromGroup,
  createConsumerGroup,
  STREAM_READERS,
} from "@perpex/redis";
import { config } from "@perpex/config";
import { handleAccountCommand, storeUser } from "./commands/accounts";
import { handleCreateOrder } from "./commands/orders";
import { handleCreateMarket } from "./commands/markets";
import { EngineManager } from "./services/engine-manager";
import type {
  AccountCommand,
  CreateMarketCommand,
  CreateOrderCommand,
} from "@perpex/types";

await connectRedis();

const engineManager = new EngineManager();

const { group: ENGINE_GROUP, consumer: ENGINE_CONSUMER } =
  STREAM_READERS.engine;

let lastHandledId: string | null = null;

const handleCommand = async (data: unknown, id: string) => {
  lastHandledId = id;
  const message = data as { messageType?: string };

  switch (message.messageType) {
    case "store-user":
      storeUser(data as { userId: string });
      return;
    case "on-ramp":
    case "withdraw":
    case "get-balance":
      await handleAccountCommand(data as AccountCommand);
      return;
    case "create-order":
      await handleCreateOrder(engineManager, data as CreateOrderCommand);
      return;
    case "create-market":
      await handleCreateMarket(engineManager, data as CreateMarketCommand);
      return;
    default:
      console.log("unknown command type, ignoring:", message.messageType);
  }
};

await createConsumerGroup(config.ORDERS_CREATE, ENGINE_GROUP);
await consumeFromGroup(
  config.ORDERS_CREATE,
  ENGINE_GROUP,
  ENGINE_CONSUMER,
  handleCommand,
);
