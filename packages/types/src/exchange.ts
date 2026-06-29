export type OrderType = "LIMIT" | "MARKET";
export type OrderSide = "LONG" | "SHORT";
export type OrderStatus = "Open" | "Filled" | "PartiallyFilled" | "Cancelled";

export interface User {
  collateral: Collateral;
  positions: Position[];
}

export interface Collateral {
  availableBalance: number;
  lockedBalance: number;
}

//TODO: this should store in db
export interface Position {
  userId: string;
  market: string; //TODO: "change it to marketId and store market id here"
  positionType: OrderType;
  side: OrderSide;
  quantity: number;
  averagePrice: number;
  liquidationPrice: number;
  margin: number;
  createdAt: number;
  updatedAt: number;
}

export interface Order {
  orderId: string;
  userId: string;
  market: string;
  type: OrderType;
  side: OrderSide;
  price: number;
  quantity: number;
  filledQuantity: number;
  status: OrderStatus;
}

export interface PayloadType {
  userId: string;
  messageType?: string;
  market: string;
  side: OrderSide;
  quantity: number;
  leverage: number;
  correlationId: string | undefined;
  type: OrderType;
  price: number | undefined;
  slippageTolerance: number | undefined;
}

export interface ResponseType {
  [key: string]: any;
  correlationId: string;
  ok: boolean;
  error?: string;
}

export type StreamMessages = {
  name: string;
  messages: {
    id: string;
    message: {
      [x: string]: string;
    };
  }[];
}[];

export interface Bids {
  openOrders: OpenOrder[];
}

export interface Asks {
  openOrders: OpenOrder[];
}

export interface OpenOrder {
  userId: string;
  orderId: string;
  quantity: number;
  filledQuantity: number;
  createdAt: number;
}

export interface Fill {
  makerUserId: string;
  takerUserId: string;
  makerOrderId: string;
  takerOrderId: string;
  market: string;
  quantity: number;
  price: number;
  takerSide: OrderSide;
}
