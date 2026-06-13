import type { User } from "@perpex/types";

export const Users = new Map<string, User>();
export const MarketPrice = 100;

export const maintenanceMarginRate = 0.005;

export const totalSlippageTolerance = 0.02;

Users.set("u1", {
  collateral: { availableBalance: 100, lockedBalance: 0 },
  positions: [],
});
