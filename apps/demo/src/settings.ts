export interface DemoMarket {
  slug: string;
  decimals: number;
  fallbackPrice: number;
  ladderStep: number;
  ladderQuantity: string;
  seedTradeQuantity: string;
  botQuoteQuantity: string;
  botTradeQuantity: string;
  candleVolume: number;
}

export const MARKETS: DemoMarket[] = [
  {
    slug: "BTC_PERP",
    decimals: 1,
    fallbackPrice: 82700,
    ladderStep: 0.0004,
    ladderQuantity: "0.4",
    seedTradeQuantity: "0.05",
    botQuoteQuantity: "0.02",
    botTradeQuantity: "0.03",
    candleVolume: 40,
  },
  {
    slug: "ETH_PERP",
    decimals: 2,
    fallbackPrice: 2518,
    ladderStep: 0.0006,
    ladderQuantity: "8",
    seedTradeQuantity: "1",
    botQuoteQuantity: "0.3",
    botTradeQuantity: "0.5",
    candleVolume: 400,
  },
  {
    slug: "SOL_PERP",
    decimals: 3,
    fallbackPrice: 108.2,
    ladderStep: 0.0008,
    ladderQuantity: "150",
    seedTradeQuantity: "20",
    botQuoteQuantity: "5",
    botTradeQuantity: "8",
    candleVolume: 6000,
  },
];

export const TRADERS = ["alice", "bob", "carol", "dave", "erin", "frank"];

export const BOT_MAKER = "mm-maker";
export const BOT_TAKER = "mm-taker";

export const ALL_DEMO_USERS = [...TRADERS, BOT_MAKER, BOT_TAKER];

export const DEMO_PASSWORD = "demo1234";

export const TRADER_DEPOSIT = "1000000";
export const BOT_DEPOSIT = "1000000000";

export const LEVERAGE = 10;

export const LADDER_LEVELS = 12;

export const CANDLE_HISTORY_MINUTES = 7 * 24 * 60;
