export interface Depth {
  bids: [string, string][];
  asks: [string, string][];
}

const depths = new Map<string, Depth>();

export const setDepth = (market: string, depth: Depth) => {
  depths.set(market, depth);
};

export const getDepth = (market: string) => depths.get(market);
