export type OrderType = "LIMIT" | "MARKET";
export type OrderSide = "LONG" | "SHORT";
export type OrderStatus = "Open" | "Filled" | "PartiallyFilled" | "Cancelled";

export interface Order {
  orderId: string;
  userId: string;
  market: string;
  type: OrderType;
  side: OrderSide;
  price?: string;
  quantity: string;
  filledQuantity: string;
  status: OrderStatus;
}

export interface ClosedPosition {
  userId: string;
  market: string;
  side: OrderSide;
  quantity: string;
  averagePrice: string;
  exitPrice: string;
  liquidationPrice: string;
  margin: string;
  realizedPnl: string;
}

export interface CreateOrderCommand {
  userId: string;
  messageType: "create-order";
  market: string;
  side: OrderSide;
  quantity: string;
  leverage: number;
  correlationId: string;
  type: OrderType;
  price: string | undefined;
  slippageTolerance: number | undefined;
}

export interface CancelOrderCommand {
  userId: string;
  messageType: "cancel-order";
  market: string;
  orderId: string;
  correlationId: string;
}

export interface Liquidation {
  userId: string;
  market: string;
  quantity: string;
  price: string;
  liquidationPrice: string;
  bankruptcyPrice: string;
}
