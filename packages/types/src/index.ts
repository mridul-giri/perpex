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

export interface PayloadType {
  userId: string;
  messageType: string;
  symbol: MarketSymbol;
  type: OrderType;
  side: OrderSide;
  quantity: number;
  price: number;
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

export type OrderBooks = Record<string, OrderBook>;

export type Asks = Record<number | string, PriceLevel>;

export type Bids = Record<number | string, PriceLevel>;

export type MarketSymbol = "BTCUSDT" | "SOLUSDT" | "ETHUSDT";
export type OrderType = "limit" | "market";
export type OrderSide = "long" | "short";
export type OrderStatus = "open" | "filled" | "partial" | "cancelled";
