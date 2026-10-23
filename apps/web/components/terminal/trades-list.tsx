import { cn } from "@/lib/cn";
import { formatNumber, formatTime } from "@/lib/format";
import type { Trade } from "@/lib/types";

const SIZE_DECIMALS = 3;

export function TradesList({
  trades,
  priceDecimals,
}: {
  trades: Trade[];
  priceDecimals: number;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-3 border-b border-hairline px-3 py-2 text-xs text-ink-muted">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>

      <div className="flex-1 overflow-auto">
        {trades.map((trade) => (
          <div key={trade.id} className="grid grid-cols-3 px-3 py-1 text-xs">
            <span
              className={cn(
                "tabular",
                trade.isBuyerMaker ? "text-down" : "text-up",
              )}
            >
              {formatNumber(trade.price, priceDecimals)}
            </span>
            <span className="tabular text-right text-ink">
              {formatNumber(trade.quantity, SIZE_DECIMALS)}
            </span>
            <span className="tabular text-right text-ink-dim">
              {formatTime(trade.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
