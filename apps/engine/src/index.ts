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
import { publishFunding, publishMarkPrice } from "./commands/publish";
import { EngineManager } from "./services/engine-manager";
import { LiquidationManager } from "./services/liquidation";
import { FundingManager } from "./services/funding";
import {
  applySnapshot,
  loadLatestSnapshot,
  startSnapshotSchedule,
  takeSnapshot,
} from "./utils/snapshot";
import { replayMissed } from "./utils/replay";
import { toBigInt } from "./utils/conversion";
import { fundingRateBps } from "./utils/funding-rate";
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
const liquidationManager = new LiquidationManager(engineManager);
const fundingManager = new FundingManager();

let lastHandledId: string | null = null;

startSnapshotSchedule(engineManager, () => lastHandledId);

const shutdown = async (signal: string) => {
  console.log(`${signal} received; taking final snapshot`);
  await takeSnapshot(engineManager, lastHandledId);
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

const { group: ENGINE_GROUP, consumer: ENGINE_CONSUMER } =
  STREAM_READERS.engine;

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
    case "mark-price": {
      const command = data as MarkPriceCommand;
      const engine = engineManager.get(command.market);
      if (!engine) return;

      const price = toBigInt(command.price);
      const indexPrice = toBigInt(command.indexPrice);
      engine.setMarkPrice(price);
      engine.setIndexPrice(indexPrice);

      await publishMarkPrice(
        command.market,
        price,
        indexPrice,
        fundingRateBps(indexPrice, price),
      );

      await liquidationManager.liquidateUnderwater(command.market, price);
      return;
    }
    case "funding-settlement": {
      const command = data as FundingSettlementCommand;
      const engine = engineManager.get(command.market);
      if (!engine) return;

      const markPrice = engine.getMarkPrice();
      const indexPrice = engine.getIndexPrice();
      if (!markPrice || !indexPrice || indexPrice <= 0n) {
        console.log(`skipping funding for ${command.market}: missing price`);
        return;
      }

      const rate = fundingRateBps(indexPrice, markPrice);
      const result = fundingManager.settle(command.market, rate);

      await publishFunding(
        command.market,
        result.rateBps,
        result.payments,
        result.usedInsuranceFund,
      );

      await liquidationManager.liquidateUnderwater(command.market, markPrice);
      return;
    }
    default:
      console.log("unknown command type, ignoring:", message.messageType);
  }
};

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
