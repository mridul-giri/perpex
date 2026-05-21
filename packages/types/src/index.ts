export type Order = {
  orderId: string;
  userId: string;
  symbol: Symbol;
  type: Type;
  side: Side;
  price: number;
  quantity: number;
  status: Status;
};

export type Position = {
  symbol: Symbol;
  type: Type;
  side: Side;
  quantity: number;
  margin: number;
  liquidationPrice: number;
  averagePrice: number;
};

export type Fills = {
  maker: string;
  taker: string;
  symbol: Symbol;
  quantity: number;
  price: number;
  // long: number;
  // short: number;
}[];

export type Users = {
  userId: string;
  name: string;
  email: string;
  password: string;
  collateral: { balance: number; lockedBalance: number };
  positions: Position[] | null;
  orders: Order[] | null;
}[];

export type User = {
  userId: string;
  name: string;
  email: string;
  password: string;
  collateral: { balance: number; lockedBalance: number };
  orders: Order[] | null;
};

export type OrderInput = {
  userId: string;
  symbol: Symbol;
  type: Type;
  side: Side;
  quantity: number;
  limitPrice: number;
  leverage: number;
};

export type PriceLevel = {
  availableQuantity: number;
  openOrder: {
    userId: string;
    orderId: string;
    quantity: number;
    filledQuantity: number;
  }[];
};

export type OrderBook = {
  bids: Record<number, PriceLevel>;
  asks: Record<number, PriceLevel>;
  lastTradedPrice: number;
  indexPrice: number;
};

export type OrderBooks = Record<string, OrderBook>;

export type Asks = Record<number | string, PriceLevel>;

export type Bids = Record<number | string, PriceLevel>;

export enum Symbol {
  BTCUSDT = "BTCUSDT",
  SOLUSDT = "SOLUSDT",
}
export enum Type {
  LIMIT = "LIMIT",
  MARKET = "MARKET",
}
export enum Side {
  LONG = "LONG",
  SHORT = "SHORT",
}
export enum Status {
  OPEN = "OPEN",
  FILLED = "FILLED",
  PARTIAL = "PARTIAL",
  CANCELLED = "CANCELLED",
}
