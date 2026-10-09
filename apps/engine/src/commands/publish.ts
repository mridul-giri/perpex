import { publishToStream } from "@perpex/redis";
import { config } from "@perpex/config";
import { EngineError } from "../utils/engine-error";
import { toString } from "../utils/conversion";
import type { EngineCollateral, Liquidation, Market } from "@perpex/types";

export const publishError = async (
  correlationId: string | undefined,
  error: unknown,
) => {
  console.log("caught some error for user request", error);
  await publishToStream(config.ORDERS_ACK, {
    correlationId,
    ok: false,
    error: error instanceof EngineError ? error.message : "Engine Error",
  });
};

export const publishSuccess = async (
  correlationId: string,
  result: unknown,
) => {
  await publishToStream(config.ORDERS_ACK, {
    correlationId,
    ok: true,
    data: result,
  });
};

export const publishBalance = async (
  correlationId: string,
  collateral: EngineCollateral,
) => {
  await publishToStream(config.ORDERS_ACK, {
    correlationId,
    ok: true,
    data: {
      availableBalance: toString(collateral.availableBalance),
      lockedBalance: toString(collateral.lockedBalance),
    },
  });
};

export const publishBalanceUpdate = async (
  userId: string,
  collateral: EngineCollateral,
) => {
  await publishToStream(config.ORDERS_ACK, {
    userId,
    available: toString(collateral.availableBalance),
    locked: toString(collateral.lockedBalance),
    messageType: "balance-updated",
  });
};

export const publishMarketCreated = async (market: Market) => {
  await publishToStream(config.ORDERS_ACK, {
    ...market,
    messageType: "market-created",
  });
};

export const publishLiquidation = async (liquidation: Liquidation) => {
  await publishToStream(config.ORDERS_ACK, {
    ...liquidation,
    messageType: "liquidation",
  });
};
