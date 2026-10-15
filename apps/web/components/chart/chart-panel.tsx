"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { aggregateCandles, INTERVALS } from "@/lib/market/candles";
import { PerpexProvider } from "@/lib/market/provider";
import type { Candle } from "@/lib/market/types";
import { PriceChart } from "./price-chart";

const TIMEFRAMES = INTERVALS.map((value) => ({ value, label: value }));

interface CandleSet {
  interval: string;
  candles: Candle[];
}

export interface ChartPanelProps {
  market: string;
  candles: Candle[];
}

export function ChartPanel({ market, candles }: ChartPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const seedRef = useRef(candles);
  const [timeframe, setTimeframe] = useState("1h");
  const [result, setResult] = useState<CandleSet | null>(null);
  const [showSma, setShowSma] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);

  useEffect(() => {
    seedRef.current = candles;
  }, [candles]);

  useEffect(() => {
    if (timeframe === "1m") return;

    let cancelled = false;
    (async () => {
      let data: Candle[];
      try {
        data = await new PerpexProvider().getCandles(market, timeframe, 300);
      } catch {
        data = aggregateCandles(seedRef.current, timeframe);
      }
      if (!cancelled) setResult({ interval: timeframe, candles: data });
    })();

    return () => {
      cancelled = true;
    };
  }, [timeframe, market]);

  const shown = timeframe === "1m" ? candles : (result?.candles ?? candles);
  const loading = timeframe !== "1m" && result?.interval !== timeframe;

  return (
    <div ref={panelRef} className="flex h-full flex-col">
      <div className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-hairline px-3 py-2">
        <span className="text-sm font-medium text-ink">Price</span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="md"
            aria-pressed={showSma}
            onClick={() => setShowSma((value) => !value)}
            className={showSma ? "text-signal" : undefined}
          >
            SMA
          </Button>
          <Button
            variant="ghost"
            size="md"
            aria-label="Reset zoom"
            onClick={() => setResetNonce((value) => value + 1)}
          >
            <RotateCcw className="size-[18px]" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="md"
            aria-label="Fullscreen"
            onClick={() => panelRef.current?.requestFullscreen?.()}
          >
            <Maximize2 className="size-[18px]" strokeWidth={1.5} />
          </Button>
          <Tabs
            items={TIMEFRAMES}
            value={timeframe}
            onValueChange={setTimeframe}
            size="md"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 p-2">
        <div
          className={cn(
            "h-full w-full transition-opacity",
            loading && "opacity-60",
          )}
        >
          <PriceChart
            candles={shown}
            showSma={showSma}
            resetNonce={resetNonce}
          />
        </div>
      </div>
    </div>
  );
}
