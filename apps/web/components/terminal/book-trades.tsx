"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import type { Depth, Trade } from "@/lib/types";
import { OrderBook } from "./order-book";
import { TradesList } from "./trades-list";

const TABS = [
  { value: "book", label: "Book" },
  { value: "trades", label: "Trades" },
] as const;

export function BookTrades({
  depth,
  trades,
  priceDecimals,
}: {
  depth: Depth;
  trades: Trade[];
  priceDecimals: number;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("book");

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center border-b border-hairline px-3">
        <Tabs items={TABS} value={tab} onValueChange={setTab} />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "book" ? (
          <OrderBook depth={depth} priceDecimals={priceDecimals} />
        ) : (
          <TradesList trades={trades} priceDecimals={priceDecimals} />
        )}
      </div>
    </div>
  );
}
