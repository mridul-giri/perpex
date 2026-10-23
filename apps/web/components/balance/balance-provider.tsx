"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { DepositModal } from "@/components/modals/deposit-modal";
import { WithdrawModal } from "@/components/modals/withdraw-modal";
import { usePolling } from "@/hooks/use-polling";
import { getBalance } from "@/lib/api/account";
import { isSignedIn } from "@/lib/session";
import type { Balance } from "@/lib/types";

const EMPTY_BALANCE: Balance = { availableBalance: "0", lockedBalance: "0" };
const POLL_MS = 5000;

interface BalanceContextValue {
  balance: Balance; // exact decimal strings from the API
  available: number; // the same values as numbers, for display and maths
  locked: number;
  refresh: () => void;
  openDeposit: () => void;
  openWithdraw: () => void;
}

const BalanceContext = createContext<BalanceContextValue | null>(null);

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<Balance>(EMPTY_BALANCE);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const loadBalance = useCallback(async () => {
    if (!isSignedIn()) {
      setBalance(EMPTY_BALANCE);
      return;
    }
    try {
      setBalance(await getBalance());
    } catch {}
  }, []);

  usePolling(loadBalance, POLL_MS);
  const refresh = useCallback(() => void loadBalance(), [loadBalance]);

  const value = useMemo<BalanceContextValue>(
    () => ({
      balance,
      available: Number(balance.availableBalance),
      locked: Number(balance.lockedBalance),
      refresh,
      openDeposit: () => setDepositOpen(true),
      openWithdraw: () => setWithdrawOpen(true),
    }),
    [balance, refresh],
  );

  return (
    <BalanceContext.Provider value={value}>
      {children}
      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        available={value.available}
        onDone={refresh}
      />
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        availableText={balance.availableBalance}
        onDone={refresh}
      />
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const value = useContext(BalanceContext);
  if (!value) throw new Error("useBalance must be used inside BalanceProvider");
  return value;
}
