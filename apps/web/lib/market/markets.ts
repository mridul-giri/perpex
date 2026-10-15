export interface MarketConfig {
  ui: string;
  perpex: string;
}

export const MARKETS: MarketConfig[] = [
  { ui: "BTC", perpex: "BTC_PERP" },
  { ui: "ETH", perpex: "ETH_PERP" },
  { ui: "SOL", perpex: "SOL_PERP" },
];

export const marketByUiSymbol = (ui: string) =>
  MARKETS.find((m) => m.ui === ui.toUpperCase());
