export type Side = "LONG" | "SHORT";
export type OrderType = "LIMIT" | "MARKET";
export type OrderStatus = "Open" | "PartiallyFilled" | "Filled" | "Cancelled";

export interface Candle {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface Trade {
  id: string;
  price: string;
  quantity: string;
  timestamp: number;
  isBuyerMaker: boolean;
}

export type DepthLevel = [price: string, quantity: string];

export interface Depth {
  bids: DepthLevel[];
  asks: DepthLevel[];
}

export interface MarketRisk {
  market: string;
  markPrice: string | null;
  indexPrice: string | null;
  fundingRateBps: string;
}

export interface Ticker {
  last: string;
  change: string;
  changePct: string;
  high: string;
  low: string;
  volume: string;
}

export interface Balance {
  availableBalance: string;
  lockedBalance: string;
}

export interface OpenPosition {
  market: string;
  side: Side;
  quantity: string;
  averagePrice: string;
  liquidationPrice: string;
  margin: string;
}

export interface Order {
  orderId: string;
  market: string;
  type: OrderType;
  side: Side;
  price: string | null;
  quantity: string;
  filledQuantity: string;
  status: OrderStatus;
  createdAt: string;
}

export interface Fill {
  fillId: string;
  market: string;
  price: string;
  quantity: string;
  role: "maker" | "taker";
  createdAt: string;
}

export type PlaceOrderInput =
  | {
      type: "LIMIT";
      side: Side;
      market: string;
      quantity: string;
      leverage: number;
      price: string;
    }
  | {
      type: "MARKET";
      side: Side;
      market: string;
      quantity: string;
      leverage: number;
      slippageTolerance: number;
    };

export interface OrderResult {
  orderId: string;
  status: OrderStatus;
  quantity: string;
  filledQuantity: string;
}
