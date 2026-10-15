"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt, fmtCompact, fmtSigned } from "@/lib/format";
import { MARKETS } from "@/lib/market/markets";
import type { MarketRisk, Ticker } from "@/lib/market/types";

const LABEL = "text-xs leading-none text-ink-muted";
const VALUE =
  "tabular whitespace-nowrap text-sm font-medium leading-none text-ink";

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

function MarketSwitcher({
  symbol,
  market,
}: {
  symbol: string;
  market?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

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
            {symbol}
          </span>
          <span className="text-xs leading-none text-ink-dim">{market}</span>
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
          {MARKETS.map((item) => {
            const active = item.ui === symbol;
            return (
              <button
                key={item.ui}
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(`/trade/${item.ui}`);
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.04]",
                  active ? "text-ink" : "text-ink-muted",
                )}
              >
                <span className="font-semibold">{item.ui}</span>
                <span className="text-xs text-ink-dim">{item.perpex}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface MarketRibbonProps {
  dp: number;
  ticker: Ticker;
  risk: MarketRisk;
  symbol?: string;
  market?: string;
  countdown?: string;
}

export function MarketRibbon({
  dp,
  ticker,
  risk,
  symbol,
  market,
  countdown,
}: MarketRibbonProps) {
  const pct = Number(ticker.changePct);
  const up = pct >= 0;

  return (
    <div className="flex min-w-0 items-stretch rounded-md border border-hairline bg-panel px-2 py-3">
      {symbol && <MarketSwitcher symbol={symbol} market={market} />}

      <Stat
        label="Mark"
        value={risk.markPrice ? fmt(risk.markPrice, dp) : "—"}
      />
      <Stat
        label="Oracle"
        value={risk.indexPrice ? fmt(risk.indexPrice, dp) : "—"}
        className="max-sm:hidden"
      />

      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 px-3 text-center max-sm:hidden">
        <span className={LABEL}>24h Change</span>
        <div className="flex items-baseline gap-1.5">
          <span className={cn(VALUE, up ? "text-up" : "text-down")}>
            {fmtSigned(ticker.change, dp)}
          </span>
          <span
            className={cn(
              "tabular whitespace-nowrap text-xs leading-none",
              up ? "text-up" : "text-down",
            )}
          >
            {fmtSigned(pct, 2)}%
          </span>
        </div>
      </div>

      <Stat
        label="24h Volume"
        value={ticker.volume ? `$${fmtCompact(ticker.volume)}` : "—"}
        className="max-md:hidden"
      />
      <Stat
        label="Open Interest"
        value={
          ticker.openInterest ? `$${fmtCompact(ticker.openInterest)}` : "—"
        }
        className="max-xl:hidden"
      />
      <Stat
        label="Funding"
        value={`${risk.fundingRateBps} bps${countdown ? ` · ${countdown}` : ""}`}
        className="max-xl:hidden"
      />
    </div>
  );
}
