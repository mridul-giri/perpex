import { toBigInt } from "../utils/conversion";
import type { EngineUser } from "@perpex/types";

export const Users = new Map<string, EngineUser>();

export const maintenanceMarginRate = 0.005;

export const totalSlippageTolerance = 0.02;

Users.set("u1", {
  collateral: { availableBalance: toBigInt("100"), lockedBalance: 0n },
  positions: new Map(),
});
