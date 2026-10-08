export type OrderType = "LIMIT" | "MARKET";
export type OrderSide = "LONG" | "SHORT";
export type OrderStatus = "Open" | "Filled" | "PartiallyFilled" | "Cancelled";

export interface User {
  collateral: Collateral;
  positions: Position[];
}

export interface Collateral {
  availableBalance: string;
  lockedBalance: string;
}

//TODO: this should store in db
export interface Position {
  userId: string;
  market: string; //TODO: "change it to marketId and store market id here"
  positionType: OrderType;
  side: OrderSide;
  quantity: string;
  averagePrice: string;
  liquidationPrice: string;
  margin: string;
  createdAt: number;
  updatedAt: number;
}

export interface Order {
  orderId: string;
  userId: string;
  market: string;
  type: OrderType;
  side: OrderSide;
  price: string;
  quantity: string;
  filledQuantity: string;
  status: OrderStatus;
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

export interface Bids {
  openOrders: OpenOrder[];
}

export interface Asks {
  openOrders: OpenOrder[];
}

export interface OpenOrder {
  userId: string;
  orderId: string;
  quantity: string;
  filledQuantity: string;
  createdAt: number;
}

export interface Fill {
  makerUserId: string;
  takerUserId: string;
  makerOrderId: string;
  takerOrderId: string;
  market: string;
  quantity: string;
  price: string;
  takerSide: OrderSide;
}
