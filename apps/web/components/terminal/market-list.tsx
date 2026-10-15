import Link from "next/link";
import { cn } from "@/lib/cn";
import { fmt, fmtCompact, fmtSigned } from "@/lib/format";
import type { MarketSummary } from "@/lib/market/terminal-data";

export function MarketList({
  markets,
  active,
}: {
  markets: MarketSummary[];
  active?: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-hairline px-4 py-2.5">
        <span className="text-sm font-medium text-ink">Markets</span>
        <span className="text-xs text-ink-muted">24h volume</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {markets.length ? (
          markets.map((market) => {
            const up = Number(market.changePct) >= 0;
            return (
              <Link
                key={market.ui}
                href={`/trade/${market.ui}`}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.03]",
                  market.ui === active && "bg-white/[0.02]",
                )}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold text-ink">
                    {market.ui}
                  </span>
                  <span className="text-xs text-ink-dim">{market.perpex}</span>
                </span>
                <span className="flex min-w-0 flex-col items-end">
                  <span className="tabular text-sm font-medium text-ink">
                    {fmt(market.price, 2)}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="tabular text-xs text-ink-dim">
                      ${fmtCompact(market.volume)}
                    </span>
                    <span
                      className={cn(
                        "tabular text-xs",
                        up ? "text-up" : "text-down",
                      )}
                    >
                      {fmtSigned(market.changePct, 2)}%
                    </span>
                  </span>
                </span>
              </Link>
            );
          })
        ) : (
          <div className="flex items-center justify-center py-8 text-xs text-ink-dim">
            Markets unavailable
          </div>
        )}
      </div>
    </div>
  );
}
