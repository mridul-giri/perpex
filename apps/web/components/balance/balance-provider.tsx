"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BalanceContext } from "@/components/balance/balance-context";
import { DepositModal } from "@/components/modals/deposit-modal";
import { WithdrawModal } from "@/components/modals/withdraw-modal";
import "@/lib/auth";
import { PerpexTrading, type Balance } from "@/lib/trading";

const EMPTY: Balance = { availableBalance: "0", lockedBalance: "0" };
const POLL_MS = 5000;
const trading = new PerpexTrading();

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<Balance>(EMPTY);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setBalance(await trading.getBalance());
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await trading.getBalance();
        if (!cancelled) setBalance(next);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    return () => clearInterval(intervalId);
  }, [refresh]);

  const value = useMemo(
    () => ({
      balance,
      availableNum: Number(balance.availableBalance),
      lockedNum: Number(balance.lockedBalance),
      refresh: () => void refresh(),
      openDeposit: () => setDepositOpen(true),
      openWithdraw: () => setWithdrawOpen(true),
    }),
    [balance, refresh],
  );

  return (
    <BalanceContext.Provider value={value}>
      {children}
      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
      />
    </BalanceContext.Provider>
  );
}
