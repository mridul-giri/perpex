import {
  connectRedis,
  consumeFromGroup,
  createConsumerGroup,
  STREAM_READERS,
} from "@perpex/redis";
import { config } from "@perpex/config";
import { handleAccountCommand, storeUser } from "./commands/accounts";
import { handleCancelOrder, handleCreateOrder } from "./commands/orders";
import { handleCreateMarket } from "./commands/markets";
import { publishFunding } from "./commands/publish";
import { EngineManager } from "./services/engine-manager";
import { LiquidationManager } from "./services/liquidation";
import { FundingManager } from "./services/funding";
import { toBigInt } from "./utils/conversion";
import type {
  AccountCommand,
  CancelOrderCommand,
  CreateMarketCommand,
  CreateOrderCommand,
  FundingSettlementCommand,
  MarkPriceCommand,
} from "@perpex/types";

await connectRedis();

const engineManager = new EngineManager();
const liquidationManager = new LiquidationManager(engineManager);
const fundingManager = new FundingManager();

const MAX_FUNDING_RATE_BPS = 1n;

const fundingRateBps = (indexPrice: bigint, markPrice: bigint) => {
  const premiumBps = ((indexPrice - markPrice) * 10000n) / indexPrice;
  if (premiumBps > MAX_FUNDING_RATE_BPS) return MAX_FUNDING_RATE_BPS;
  if (premiumBps < -MAX_FUNDING_RATE_BPS) return -MAX_FUNDING_RATE_BPS;
  return premiumBps;
};

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
    case "cancel-order":
      await handleCancelOrder(engineManager, data as CancelOrderCommand);
      return;
    case "create-market":
      await handleCreateMarket(engineManager, data as CreateMarketCommand);
      return;
    case "mark-price": {
      const command = data as MarkPriceCommand;
      const engine = engineManager.get(command.market);
      if (!engine) return;

      const price = toBigInt(command.price);
      engine.setMarkPrice(price);
      engine.setIndexPrice(toBigInt(command.indexPrice));
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

await createConsumerGroup(config.ORDERS_CREATE, ENGINE_GROUP);
await consumeFromGroup(
  config.ORDERS_CREATE,
  ENGINE_GROUP,
  ENGINE_CONSUMER,
  handleCommand,
);
