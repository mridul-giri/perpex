import { cn } from "@/lib/cn";
import { fmt, fmtTime } from "@/lib/format";
import type { Trade } from "@/lib/market/types";

export interface TradesListProps {
  trades: Trade[];
  dp: number;
  sizeDp?: number;
}

export function TradesList({ trades, dp, sizeDp = 3 }: TradesListProps) {
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
              {fmt(trade.price, dp)}
            </span>
            <span className="tabular text-right text-ink">
              {fmt(trade.quantity, sizeDp)}
            </span>
            <span className="tabular text-right text-ink-dim">
              {fmtTime(trade.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
