"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { Depth, DepthLevel } from "@/lib/types";

const MAX_LEVELS = 12;
const SIZE_DECIMALS = 3;
const BID_COLOR = "rgb(0 194 120)";
const ASK_COLOR = "rgb(253 75 78)";

const BAR_TRANSITION = {
  type: "tween",
  duration: 0.35,
  ease: [0.25, 0.1, 0.25, 1],
} as const;

interface BookRow {
  price: string;
  size: string;
  total: number;
}

const withRunningTotal = (levels: DepthLevel[]): BookRow[] => {
  let total = 0;
  return levels.map(([price, size]) => {
    total += Number(size);
    return { price, size, total };
  });
};

export function OrderBook({
  depth,
  priceDecimals,
}: {
  depth: Depth;
  priceDecimals: number;
}) {
  const asks = withRunningTotal(depth.asks.slice(0, MAX_LEVELS));
  const bids = withRunningTotal(depth.bids.slice(0, MAX_LEVELS));
  const allRows = [...asks, ...bids];

  const largestTotal = Math.max(...allRows.map((row) => row.total), 1);
  const largestSize = Math.max(...allRows.map((row) => Number(row.size)), 1);

  const bestAsk = Number(depth.asks[0]?.[0] ?? 0);
  const bestBid = Number(depth.bids[0]?.[0] ?? 0);
  const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;

  const renderRow = (row: BookRow, index: number, side: "bid" | "ask") => (
    <BookLevel
      key={`${side}-${index}`}
      row={row}
      side={side}
      priceDecimals={priceDecimals}
      totalWidth={(row.total / largestTotal) * 100}
      sizeWidth={(Number(row.size) / largestSize) * 100}
    />
  );

  return (
    <div className="flex h-full flex-col">
      <div className="grid shrink-0 grid-cols-3 border-b border-hairline px-3 py-2 text-xs text-ink-muted">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col-reverse gap-px overflow-y-auto">
        {asks.map((row, index) => renderRow(row, index, "ask"))}
      </div>

      <div className="flex shrink-0 items-center justify-between border-y border-hairline px-3 py-1.5">
        <span className="text-xs text-ink-muted">Spread</span>
        <span className="tabular text-xs font-medium text-ink">
          {formatNumber(spread, priceDecimals)}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto">
        {bids.map((row, index) => renderRow(row, index, "bid"))}
      </div>
    </div>
  );
}

const BookLevel = memo(function BookLevel({
  row,
  side,
  priceDecimals,
  totalWidth,
  sizeWidth,
}: {
  row: BookRow;
  side: "bid" | "ask";
  priceDecimals: number;
  totalWidth: number;
  sizeWidth: number;
}) {
  const isBid = side === "bid";
  const color = isBid ? BID_COLOR : ASK_COLOR;

  return (
    <div className="relative grid grid-cols-3 px-3 py-1 text-xs">
      <DepthBar color={color} opacity={0.12} widthPercent={totalWidth} />
      <DepthBar color={color} opacity={0.28} widthPercent={sizeWidth} />
      <span className={cn("relative tabular", isBid ? "text-up" : "text-down")}>
        {formatNumber(row.price, priceDecimals)}
      </span>
      <span className="relative tabular text-right text-ink">
        {formatNumber(row.size, SIZE_DECIMALS)}
      </span>
      <span className="relative tabular text-right text-ink-muted">
        {formatNumber(row.total, SIZE_DECIMALS)}
      </span>
    </div>
  );
});

function DepthBar({
  color,
  opacity,
  widthPercent,
}: {
  color: string;
  opacity: number;
  widthPercent: number;
}) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0"
      style={{
        width: "100%",
        transformOrigin: "right",
        willChange: "transform",
        backgroundColor: color,
        opacity,
      }}
      initial={false}
      animate={{ scaleX: widthPercent / 100 }}
      transition={BAR_TRANSITION}
    />
  );
}
