import type { Side } from "@/lib/types";

const MAINTENANCE_MARGIN_RATE = 0.005;

export const orderValue = (price: number, size: number) => price * size;

export const marginRequired = (value: number, leverage: number) =>
  value / leverage;

export const liquidationPriceEstimate = (
  side: Side,
  price: number,
  leverage: number,
) => {
  if (price <= 0) return 0;
  const move = 1 / leverage - MAINTENANCE_MARGIN_RATE;
  return side === "LONG" ? price * (1 - move) : price * (1 + move);
};

export const sizeForPercent = (
  available: number,
  percent: number,
  leverage: number,
  price: number,
) => {
  if (available <= 0 || price <= 0) return 0;
  const margin = available * (percent / 100);
  const size = (margin * leverage) / price;
  return Math.floor(size * 1e4) / 1e4;
};
