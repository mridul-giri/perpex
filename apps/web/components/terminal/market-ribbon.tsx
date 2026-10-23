"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { cn } from "@/lib/cn";
import { formatCompact, formatNumber, formatSigned } from "@/lib/format";
import { MARKETS, type MarketConfig } from "@/lib/markets";
import type { MarketRisk, Ticker } from "@/lib/types";

const LABEL = "text-xs leading-none text-ink-muted";
const VALUE =
  "tabular whitespace-nowrap text-sm font-medium leading-none text-ink";

export interface MarketRibbonProps {
  market: MarketConfig;
  ticker: Ticker;
  risk: MarketRisk;
}

export function MarketRibbon({ market, ticker, risk }: MarketRibbonProps) {
  const decimals = market.priceDecimals;
  const up = Number(ticker.changePct) >= 0;

  return (
    <div className="flex min-w-0 items-stretch rounded-md border border-hairline bg-panel px-2 py-3">
      <MarketSwitcher market={market} />

      <Stat
        label="Mark"
        value={risk.markPrice ? formatNumber(risk.markPrice, decimals) : "—"}
      />
      <Stat
        label="Oracle"
        value={risk.indexPrice ? formatNumber(risk.indexPrice, decimals) : "—"}
        className="max-sm:hidden"
      />

      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 px-3 text-center max-sm:hidden">
        <span className={LABEL}>24h Change</span>
        <div className="flex items-baseline gap-1.5">
          <span className={cn(VALUE, up ? "text-up" : "text-down")}>
            {formatSigned(ticker.change, decimals)}
          </span>
          <span
            className={cn(
              "tabular whitespace-nowrap text-xs leading-none",
              up ? "text-up" : "text-down",
            )}
          >
            {formatSigned(ticker.changePct, 2)}%
          </span>
        </div>
      </div>

      <Stat
        label="24h Volume"
        value={`$${formatCompact(ticker.volume)}`}
        className="max-md:hidden"
      />
      <Stat
        label="Funding"
        value={`${risk.fundingRateBps} bps`}
        className="max-xl:hidden"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 px-3 text-center",
        className,
      )}
    >
      <span className={LABEL}>{label}</span>
      <span className={VALUE}>{value}</span>
    </div>
  );
}

function MarketSwitcher({ market }: { market: MarketConfig }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const goTo = (symbol: string) => {
    setOpen(false);
    router.push(`/trade/${symbol}`);
  };

  return (
    <div className="relative flex-none" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1 transition-colors hover:bg-white/[0.03]"
      >
        <span className="flex flex-col items-center gap-0.5">
          <span className="text-lg font-semibold leading-none text-ink">
            {market.symbol}
          </span>
          <span className="text-xs leading-none text-ink-dim">
            {market.slug}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-ink-dim transition-transform",
            open && "rotate-180",
          )}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-md border border-hairline bg-panel shadow-float">
          {MARKETS.map((item) => (
            <button
              key={item.symbol}
              type="button"
              onClick={() => goTo(item.symbol)}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.04]",
                item.symbol === market.symbol ? "text-ink" : "text-ink-muted",
              )}
            >
              <span className="font-semibold">{item.symbol}</span>
              <span className="text-xs text-ink-dim">{item.slug}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
