import {
  connectRedis,
  consumeFromGroup,
  createConsumerGroup,
  setStreamMuted,
  STREAM_READERS,
} from "@perpex/redis";
import { config } from "@perpex/config";
import { handleAccountCommand, storeUser } from "./commands/accounts";
import { handleCancelOrder, handleCreateOrder } from "./commands/orders";
import { handleCreateMarket } from "./commands/markets";
import { handleGetDepth, handleGetMarketRisk } from "./commands/market-data";
import { handleFundingSettlement, handleMarkPrice } from "./commands/prices";
import { EngineManager } from "./services/engine-manager";
import {
  applySnapshot,
  loadLatestSnapshot,
  startSnapshotTimer,
  takeSnapshot,
} from "./utils/snapshot";
import { replayMissed } from "./utils/replay";
import type {
  AccountCommand,
  CancelOrderCommand,
  CreateMarketCommand,
  CreateOrderCommand,
  FundingSettlementCommand,
  GetDepthCommand,
  GetMarketRiskCommand,
  MarkPriceCommand,
} from "@perpex/types";

await connectRedis();

const engineManager = new EngineManager();

const runCommand = async (data: unknown) => {
  const message = data as { messageType?: string };

  switch (message.messageType) {
    case "store-user":
      storeUser(data as { userId: string });
      return;
    case "on-ramp":
    case "withdraw":
    case "get-balance":
    case "get-positions":
      await handleAccountCommand(data as AccountCommand);
      return;
    case "create-order":
      await handleCreateOrder(engineManager, data as CreateOrderCommand);
      return;
    case "cancel-order":
      await handleCancelOrder(engineManager, data as CancelOrderCommand);
      return;
    case "create-market":
      await handleCreateMarket(engineManager, data as CreateMarketCommand);
      return;
    case "get-depth":
      await handleGetDepth(engineManager, data as GetDepthCommand);
      return;
    case "get-market-risk":
      await handleGetMarketRisk(engineManager, data as GetMarketRiskCommand);
      return;
    case "mark-price":
      await handleMarkPrice(engineManager, data as MarkPriceCommand);
      return;
    case "funding-settlement":
      await handleFundingSettlement(
        engineManager,
        data as FundingSettlementCommand,
      );
      return;
    default:
      console.log("unknown command type, ignoring:", message.messageType);
  }
};

let lastHandledId: string | null = null;
let commandRunning = false;
let snapshotDue = false;
let shutdownRequested = false;

const snapshotAndExit = async () => {
  console.log("taking final snapshot before exit");
  await takeSnapshot(engineManager, lastHandledId);
  process.exit(0);
};

const handleCommand = async (data: unknown, id: string) => {
  commandRunning = true;
  try {
    await runCommand(data);
    lastHandledId = id;
  } finally {
    commandRunning = false;
  }

  if (shutdownRequested) return snapshotAndExit();

  if (snapshotDue) {
    snapshotDue = false;
    await takeSnapshot(engineManager, lastHandledId).catch((error) =>
      console.error("failed to take snapshot", error),
    );
  }
};

const requestShutdown = () => {
  shutdownRequested = true;
  if (!commandRunning) void snapshotAndExit();
};

process.on("SIGINT", requestShutdown);
process.on("SIGTERM", requestShutdown);

startSnapshotTimer(() => {
  snapshotDue = true;
});

const { group: ENGINE_GROUP, consumer: ENGINE_CONSUMER } =
  STREAM_READERS.engine;

const restored = await loadLatestSnapshot();

await createConsumerGroup(
  config.ORDERS_CREATE,
  ENGINE_GROUP,
  restored?.offset ?? "0",
);

if (restored) {
  applySnapshot(restored, engineManager);
  console.log("engine state restored from snapshot");

  setStreamMuted(true);
  await replayMissed(
    config.ORDERS_CREATE,
    ENGINE_GROUP,
    restored.offset,
    handleCommand,
  );
  setStreamMuted(false);
}

await consumeFromGroup(
  config.ORDERS_CREATE,
  ENGINE_GROUP,
  ENGINE_CONSUMER,
  handleCommand,
);
