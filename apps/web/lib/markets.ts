export interface MarketConfig {
  symbol: string;
  slug: string;
  priceDecimals: number;
}

export const MARKETS: MarketConfig[] = [
  { symbol: "BTC", slug: "BTC_PERP", priceDecimals: 1 },
  { symbol: "ETH", slug: "ETH_PERP", priceDecimals: 2 },
  { symbol: "SOL", slug: "SOL_PERP", priceDecimals: 3 },
];

export const findMarket = (symbol: string) =>
  MARKETS.find((market) => market.symbol === symbol.toUpperCase());

export const priceDecimalsFor = (slug: string) =>
  MARKETS.find((market) => market.slug === slug)?.priceDecimals ?? 2;
