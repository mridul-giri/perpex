export type MarketSymbol = "BTCUSDT" | "SOLUSDT" | "ETHUSDT";
export type OrderType = "limit" | "market";
export type OrderSide = "long" | "short";
export type OrderStatus = "open" | "filled" | "partial" | "cancelled";

export interface User {
  collateral: Collateral;
  positions: Position[];
}

export interface Collateral {
  availableBalance: number;
  lockedBalance: number;
}

export interface Position {
  userId: string;
  symbol: MarketSymbol;
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
  symbol: string;
  type: OrderType;
  side: OrderSide;
  price: number;
  quantity: number;
  status: OrderStatus;
}

export interface PayloadType {
  userId: string;
  messageType?: string;
  symbol: MarketSymbol;
  type: OrderType;
  side: OrderSide;
  quantity: number;
  price: number;
  leverage: number;
  correlationId?: string;
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
  availableQuantity: number;
  openOrders: openOrder[];
}

export interface Asks {
  availableQuantity: number;
  openOrders: openOrder[];
}

export interface openOrder {
  userId: string;
  orderId: string;
  quantity: number;
  filledQuantity: number;
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
