"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import type { Depth, DepthLevel } from "@/lib/market/types";

const BID_FILL = "rgb(0 194 120)";
const ASK_FILL = "rgb(253 75 78)";

const BAR_TRANSITION = {
  type: "tween",
  duration: 0.35,
  ease: [0.25, 0.1, 0.25, 1],
} as const;

const BAR_STYLE = {
  width: "100%",
  transformOrigin: "right",
  willChange: "transform",
} as const;

const MAX_LEVELS = 12;

interface Row {
  price: string;
  size: string;
  total: number;
}

const withCumulative = (levels: DepthLevel[]): Row[] => {
  let cum = 0;
  return levels.map(([price, size]) => {
    cum += Number(size);
    return { price, size, total: cum };
  });
};

interface DepthRowProps {
  row: Row;
  dp: number;
  sizeDp: number;
  side: "bid" | "ask";
  cumW: number;
  sizeW: number;
}

const DepthRow = memo(function DepthRow({
  row,
  dp,
  sizeDp,
  side,
  cumW,
  sizeW,
}: DepthRowProps) {
  const bid = side === "bid";
  return (
    <div className="relative grid grid-cols-3 px-3 py-1 text-xs">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0"
        style={{
          ...BAR_STYLE,
          backgroundColor: bid ? BID_FILL : ASK_FILL,
          opacity: 0.12,
        }}
        initial={false}
        animate={{ scaleX: cumW / 100 }}
        transition={BAR_TRANSITION}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0"
        style={{
          ...BAR_STYLE,
          backgroundColor: bid ? BID_FILL : ASK_FILL,
          opacity: 0.28,
        }}
        initial={false}
        animate={{ scaleX: sizeW / 100 }}
        transition={BAR_TRANSITION}
      />
      <span className={cn("relative tabular", bid ? "text-up" : "text-down")}>
        {fmt(row.price, dp)}
      </span>
      <span className="relative tabular text-right text-ink">
        {fmt(row.size, sizeDp)}
      </span>
      <span className="relative tabular text-right text-ink-muted">
        {fmt(row.total, sizeDp)}
      </span>
    </div>
  );
});

export interface OrderBookProps {
  depth: Depth;
  dp: number;
  sizeDp?: number;
}

export function OrderBook({ depth, dp, sizeDp = 3 }: OrderBookProps) {
  const asksAsc = withCumulative(depth.asks.slice(0, MAX_LEVELS));
  const bidsDesc = withCumulative(depth.bids.slice(0, MAX_LEVELS));

  const bestAsk = depth.asks[0] ? Number(depth.asks[0][0]) : 0;
  const bestBid = depth.bids[0] ? Number(depth.bids[0][0]) : 0;
  const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;

  const max = Math.max(
    ...asksAsc.map((r) => r.total),
    ...bidsDesc.map((r) => r.total),
    1,
  );

  let maxSize = 0;
  for (const row of [...asksAsc, ...bidsDesc]) {
    maxSize = Math.max(maxSize, Number(row.size));
  }
  if (maxSize === 0) maxSize = 1;

  return (
    <div className="flex h-full flex-col">
      <div className="grid shrink-0 grid-cols-3 border-b border-hairline px-3 py-2 text-xs text-ink-muted">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col-reverse gap-px overflow-y-auto">
        {asksAsc.map((row, i) => (
          <DepthRow
            key={`ask-${i}`}
            row={row}
            dp={dp}
            sizeDp={sizeDp}
            side="ask"
            cumW={(row.total / max) * 100}
            sizeW={(Number(row.size) / maxSize) * 100}
          />
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-between border-y border-hairline px-3 py-1.5">
        <span className="text-xs text-ink-muted">Spread</span>
        <span className="tabular text-xs font-medium text-ink">
          {fmt(spread, dp)}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto">
        {bidsDesc.map((row, i) => (
          <DepthRow
            key={`bid-${i}`}
            row={row}
            dp={dp}
            sizeDp={sizeDp}
            side="bid"
            cumW={(row.total / max) * 100}
            sizeW={(Number(row.size) / maxSize) * 100}
          />
        ))}
      </div>
    </div>
  );
}
