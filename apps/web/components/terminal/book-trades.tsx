"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { OrderBook } from "./order-book";
import { TradesList } from "./trades-list";
import type { Depth, Trade } from "@/lib/market/types";

export interface BookTradesProps {
  depth: Depth;
  trades: Trade[];
  dp: number;
}

export function BookTrades({ depth, trades, dp }: BookTradesProps) {
  const [tab, setTab] = useState("book");

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-hairline px-3">
        <Tabs
          items={[
            { value: "book", label: "Book" },
            { value: "trades", label: "Trades" },
          ]}
          value={tab}
          onValueChange={setTab}
        />
        <span className="text-xs text-ink-muted">Unit</span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "book" ? (
          <OrderBook depth={depth} dp={dp} />
        ) : (
          <TradesList trades={trades} dp={dp} />
        )}
      </div>
    </div>
  );
}
