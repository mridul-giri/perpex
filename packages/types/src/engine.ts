import type { OrderSide, OrderStatus, OrderType } from "./exchange";

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
  positionType: OrderType;
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
  positions: EnginePosition[];
}

export interface EngineOpenOrder {
  userId: string;
  orderId: string;
  quantity: bigint;
  filledQuantity: bigint;
  createdAt: number;
}

export interface EngineSide {
  openOrders: EngineOpenOrder[];
}

export interface EngineOrder {
  orderId: string;
  userId: string;
  market: string;
  type: OrderType;
  side: OrderSide;
  price: bigint;
  quantity: bigint;
  filledQuantity: bigint;
  status: OrderStatus;
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
