export type OrderType = "LIMIT" | "MARKET";
export type OrderSide = "LONG" | "SHORT";
export type OrderStatus = "Open" | "Filled" | "PartiallyFilled" | "Cancelled";

export interface User {
  collateral: Collateral;
  orders?: Order[];
}

export interface Collateral {
  availableBalance: number;
  lockedBalance: number;
}

export interface Position {
  userId: string;
  market: string;
  type: OrderType;
  side: OrderSide;
  quantity: number;
  entryPrice: number;
  equity: number;
  marginPrice: number;
  liquidationPrice: number;
  averagePrice: number;
  status: OrderStatus;
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

export interface BasePayloadType {
  userId: string;
  messageType?: string;
  market: string;
  side: OrderSide;
  quantity: number;
  leverage: number;
  correlationId?: string;
}

export interface LimitOrderPayload extends BasePayloadType {
  type: "LIMIT";
  price: number;
}

export interface MarketOrderPayload extends BasePayloadType {
  type: "MARKET";
  slippageTolerance: number;
}

export type PayloadType = LimitOrderPayload | MarketOrderPayload;

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

// export type Position = {
//   symbol: Symbol;
//   type: Type;
//   side: Side;
//   quantity: number;
//   margin: number;
//   liquidationPrice: number;
//   averagePrice: number;
// };

// export type Fills = {
//   maker: string;
//   taker: string;
//   symbol: Symbol;
//   quantity: number;
//   price: number;
//   // long: number;
//   // short: number;
// }[];

// export type Users = {
//   userId: string;
//   name: string;
//   email: string;
//   password: string;
//   collateral: { balance: number; lockedBalance: number };
//   positions: Position[] | null;
//   orders: Order[] | null;
// }[];

// export type User = {
//   userId: string;
//   name: string;
//   email: string;
//   password: string;
//   collateral: { balance: number; lockedBalance: number };
//   orders: Order[] | null;
// };

// export type OrderInput = {
//   userId: string;
//   symbol: Symbol;
//   type: Type;
//   side: Side;
//   quantity: number;
//   limitPrice: number;
//   leverage: number;
// };

// export type PriceLevel = {
//   availableQuantity: number;
//   openOrder: {
//     userId: string;
//     orderId: string;
//     quantity: number;
//     filledQuantity: number;
//   }[];
// };

// export type OrderBook = {
//   bids: Record<number, PriceLevel>;
//   asks: Record<number, PriceLevel>;
//   lastTradedPrice: number;
//   indexPrice: number;
// };

// export type OrderBooks = Record<string, OrderBook>;

// export type Asks = Record<number | string, PriceLevel>;

// export type Bids = Record<number | string, PriceLevel>;
