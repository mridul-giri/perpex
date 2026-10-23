"use client";

import { useState } from "react";
import { useBalance } from "@/components/balance/balance-provider";
import { useAccountData } from "@/hooks/use-account-data";
import { cancelOrder, placeOrder } from "@/lib/api/account";
import { cn } from "@/lib/cn";
import type { OpenPosition, Order } from "@/lib/types";
import { FillsTable } from "./fills-table";
import { OpenOrdersTable } from "./open-orders-table";
import { OrderHistoryTable } from "./order-history-table";
import { PositionsTable } from "./positions-table";

const TABS = ["Positions", "Open Orders", "Order History", "Fills"] as const;
type Tab = (typeof TABS)[number];

const CLOSE_LEVERAGE = 10;
const CLOSE_SLIPPAGE = 0.02;

export function AccountPanel() {
  const account = useAccountData();
  const { refresh: refreshBalance } = useBalance();
  const [tab, setTab] = useState<Tab>("Positions");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const runAction = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    setActionError("");
    try {
      await action();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed.");
    }
    await account.reload();
    refreshBalance();
    setBusyId(null);
  };

  const onCancel = (order: Order) =>
    runAction(order.orderId, () => cancelOrder(order.orderId, order.market));

  const onClose = (position: OpenPosition) =>
    runAction(position.market, () =>
      placeOrder({
        type: "MARKET",
        side: position.side === "LONG" ? "SHORT" : "LONG",
        market: position.market,
        quantity: position.quantity,
        leverage: CLOSE_LEVERAGE,
        slippageTolerance: CLOSE_SLIPPAGE,
      }),
    );

  const counts: Partial<Record<Tab, number>> = {
    Positions: account.positions.length,
    "Open Orders": account.openOrders.length,
  };
  const emptyText = (text: string) => (account.loaded ? text : "Loading…");

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-5 overflow-x-auto border-b border-hairline px-4">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 whitespace-nowrap py-2.5 text-xs font-medium transition-colors",
              tab === item ? "text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            {item}
            {counts[item] ? (
              <span className="tabular rounded-md bg-panel-raised px-1.5 text-[11px] font-medium text-ink">
                {counts[item]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {actionError && (
        <p className="shrink-0 px-4 py-2 text-xs text-down">{actionError}</p>
      )}

      <div className="min-h-0 flex-1 overflow-auto text-xs">
        {tab === "Positions" && (
          <PositionsTable
            positions={account.positions}
            closingMarket={busyId}
            onClose={onClose}
            emptyText={emptyText("No open positions")}
          />
        )}
        {tab === "Open Orders" && (
          <OpenOrdersTable
            orders={account.openOrders}
            cancellingId={busyId}
            onCancel={onCancel}
            emptyText={emptyText("No open orders")}
          />
        )}
        {tab === "Order History" && (
          <OrderHistoryTable
            orders={account.orderHistory}
            emptyText={emptyText("No order history")}
          />
        )}
        {tab === "Fills" && (
          <FillsTable
            fills={account.fills}
            emptyText={emptyText("No fills yet")}
          />
        )}
      </div>
    </div>
  );
}
