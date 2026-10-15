"use client";

import { createContext, useContext } from "react";
import type { Balance } from "@/lib/trading";

export interface BalanceContextValue {
  balance: Balance;
  availableNum: number;
  lockedNum: number;
  refresh: () => void;
  openDeposit: () => void;
  openWithdraw: () => void;
}

export const BalanceContext = createContext<BalanceContextValue | null>(null);

export function useBalance(): BalanceContextValue {
  const value = useContext(BalanceContext);
  if (!value) throw new Error("useBalance must be used within BalanceProvider");
  return value;
}
