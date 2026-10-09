import { toBigInt } from "../utils/conversion";
import type { EngineUser } from "@perpex/types";

export const Users = new Map<string, EngineUser>();

export const maintenanceMarginRate = 0.005;

export const totalSlippageTolerance = 0.02;

export const INSURANCE_FUND_SEED = toBigInt("100000");

export const MAX_PRICE = toBigInt("1000000000000");

Users.set("u1", {
  collateral: { availableBalance: toBigInt("100"), lockedBalance: 0n },
  positions: new Map(),
});
