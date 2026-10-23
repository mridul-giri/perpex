import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatCompact, formatNumber, formatSigned } from "@/lib/format";
import type { MarketSummary } from "@/lib/terminal-data";

export function MarketList({
  summaries,
  activeSymbol,
}: {
  summaries: MarketSummary[];
  activeSymbol: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-hairline px-4 py-2.5">
        <span className="text-sm font-medium text-ink">Markets</span>
        <span className="text-xs text-ink-muted">24h volume</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {summaries.length ? (
          summaries.map((summary) => (
            <MarketRow
              key={summary.market.symbol}
              summary={summary}
              active={summary.market.symbol === activeSymbol}
            />
          ))
        ) : (
          <div className="flex items-center justify-center py-8 text-xs text-ink-dim">
            Markets unavailable
          </div>
        )}
      </div>
    </div>
  );
}

function MarketRow({
  summary,
  active,
}: {
  summary: MarketSummary;
  active: boolean;
}) {
  const { market } = summary;
  const up = Number(summary.changePct) >= 0;

  return (
    <Link
      href={`/trade/${market.symbol}`}
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.03]",
        active && "bg-white/[0.02]",
      )}
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold text-ink">{market.symbol}</span>
        <span className="text-xs text-ink-dim">{market.slug}</span>
      </span>
      <span className="flex min-w-0 flex-col items-end">
        <span className="tabular text-sm font-medium text-ink">
          {formatNumber(summary.price, market.priceDecimals)}
        </span>
        <span className="flex items-center gap-2">
          <span className="tabular text-xs text-ink-dim">
            ${formatCompact(summary.volume)}
          </span>
          <span className={cn("tabular text-xs", up ? "text-up" : "text-down")}>
            {formatSigned(summary.changePct, 2)}%
          </span>
        </span>
      </span>
    </Link>
  );
}
