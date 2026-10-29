export interface MarketConfig {
  symbol: string;
  name: string;
  slug: string;
  priceDecimals: number;
}

export const MARKETS: MarketConfig[] = [
  { symbol: "BTC", name: "Bitcoin", slug: "BTC_PERP", priceDecimals: 1 },
  { symbol: "ETH", name: "Ethereum", slug: "ETH_PERP", priceDecimals: 2 },
  { symbol: "SOL", name: "Solana", slug: "SOL_PERP", priceDecimals: 3 },
];

export const findMarket = (symbol: string) =>
  MARKETS.find((market) => market.symbol === symbol.toUpperCase());

export const priceDecimalsFor = (slug: string) =>
  MARKETS.find((market) => market.slug === slug)?.priceDecimals ?? 2;
