import type { OrderSide, OrderType } from "./exchange";

export interface EnginePayload {
  userId: string;
  messageType?: string;
  market: string;
  side: OrderSide;
  quantity: bigint;
  leverage: number;
  correlationId: string | undefined;
  type: OrderType;
  price: bigint | undefined;
  slippageTolerance: number | undefined;
}

export interface EngineCollateral {
  availableBalance: bigint;
  lockedBalance: bigint;
}

export interface EnginePosition {
  userId: string;
  market: string;
  side: OrderSide;
  quantity: bigint;
  averagePrice: bigint;
  liquidationPrice: bigint;
  margin: bigint;
  createdAt: number;
  updatedAt: number;
}

export interface EngineUser {
  collateral: EngineCollateral;
  positions: Map<string, EnginePosition>;
}

export interface EngineOpenOrder {
  userId: string;
  orderId: string;
  quantity: bigint;
  filledQuantity: bigint;
  margin: bigint;
  leverage: number;
  createdAt: number;
}

export interface EngineSide {
  openOrders: EngineOpenOrder[];
}

export interface EngineFill {
  makerUserId: string;
  takerUserId: string;
  makerOrderId: string;
  takerOrderId: string;
  market: string;
  quantity: bigint;
  price: bigint;
  takerSide: OrderSide;
}

export interface EngineMakerFill {
  makerUserId: string;
  makerOrderId: string;
  makerSide: OrderSide;
  makerLeverage: number;
  makerMargin: bigint;
  makerFilledQuantity: bigint;
  makerRemainingQuantity: bigint;
  quantity: bigint;
  price: bigint;
}

export interface EngineClosedPosition {
  userId: string;
  market: string;
  side: OrderSide;
  quantity: bigint;
  averagePrice: bigint;
  exitPrice: bigint;
  liquidationPrice: bigint;
  margin: bigint;
  realizedPnl: bigint;
}
