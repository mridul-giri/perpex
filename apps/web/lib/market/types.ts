export type Side = "LONG" | "SHORT";

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
  openInterest: string;
}
