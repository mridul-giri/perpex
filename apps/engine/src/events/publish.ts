import { publishToStream } from "@perpex/redis";
import { config } from "@perpex/config";
import { EngineError } from "../utils/engine-error";
import { toString } from "../utils/conversion";
import type { Depth } from "../services/book-manager";
import type {
  EngineClosedPosition,
  EngineCollateral,
  EngineFill,
  EnginePayload,
  Liquidation,
  Market,
  Order,
} from "@perpex/types";

export const publishError = async (
  correlationId: string | undefined,
  error: unknown,
) => {
  if (!(error instanceof EngineError)) {
    console.error("unexpected error handling user request", error);
  }
  await publishToStream(config.ORDERS_ACK, {
    correlationId,
    ok: false,
    status: error instanceof EngineError ? error.status : 500,
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

export const publishClosedPosition = async (closed: EngineClosedPosition) => {
  await publishToStream(config.ORDERS_ACK, {
    userId: closed.userId,
    market: closed.market,
    side: closed.side,
    quantity: toString(closed.quantity),
    averagePrice: toString(closed.averagePrice),
    exitPrice: toString(closed.exitPrice),
    liquidationPrice: toString(closed.liquidationPrice),
    margin: toString(closed.margin),
    realizedPnl: toString(closed.realizedPnl),
    messageType: "position-closed",
  });
};

export const publishLiquidation = async (liquidation: Liquidation) => {
  await publishToStream(config.ORDERS_ACK, {
    ...liquidation,
    messageType: "liquidation",
  });
};

export const publishInsuranceFund = async (market: string, balance: bigint) => {
  await publishToStream(config.ORDERS_ACK, {
    market,
    balance: toString(balance),
    messageType: "insurance-fund-updated",
  });
};

export const publishOrderCreated = async (
  orderId: string,
  payload: EnginePayload,
) => {
  const baseOrder = {
    orderId,
    userId: payload.userId,
    market: payload.market,
    side: payload.side,
    quantity: toString(payload.quantity),
    filledQuantity: "0",
    status: "Open",
  };
  const order =
    payload.type === "LIMIT" && payload.price !== undefined
      ? { ...baseOrder, type: "LIMIT", price: toString(payload.price) }
      : { ...baseOrder, type: "MARKET" };

  await publishToStream(config.ORDERS_ACK, {
    ...order,
    messageType: "order-created",
  });
};

export const publishOrderUpdated = async (order: Order) => {
  await publishToStream(config.ORDERS_ACK, {
    ...order,
    messageType: "order-updated",
  });
};

export const publishOrderCancelled = async (orderId: string) => {
  await publishToStream(config.ORDERS_ACK, {
    orderId,
    status: "Cancelled",
    messageType: "order-cancelled",
  });
};

export const publishFill = async (fill: EngineFill) => {
  await publishToStream(config.ORDERS_ACK, {
    ...fill,
    quantity: toString(fill.quantity),
    price: toString(fill.price),
    messageType: "fill-created",
  });
};

export const publishMarketCreated = async (market: Market) => {
  await publishToStream(config.ORDERS_ACK, {
    ...market,
    messageType: "market-created",
  });
};

export const publishDepth = async (market: string, depth: Depth) => {
  await publishToStream(config.ORDERS_ACK, {
    messageType: "depth",
    market,
    bids: depth.bids,
    asks: depth.asks,
  });
};

export const publishMarkPrice = async (
  market: string,
  markPrice: bigint,
  indexPrice: bigint | undefined,
  rateBps: bigint,
) => {
  await publishToStream(config.ORDERS_ACK, {
    messageType: "mark-price",
    market,
    markPrice: toString(markPrice),
    indexPrice: indexPrice !== undefined ? toString(indexPrice) : null,
    fundingRateBps: rateBps.toString(),
  });
};

export const publishFunding = async (
  market: string,
  rateBps: bigint,
  payments: number,
  usedInsuranceFund: bigint,
) => {
  await publishToStream(config.ORDERS_ACK, {
    messageType: "funding",
    market,
    rate: rateBps.toString(),
    payments,
    usedInsuranceFund: toString(usedInsuranceFund),
  });
};
