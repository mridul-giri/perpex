"use client";

import { useRef, useState } from "react";
import { Maximize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { INTERVALS, type Interval } from "@/lib/candles";
import type { Candle } from "@/lib/types";
import { PriceChart } from "./price-chart";

const INTERVAL_TABS = INTERVALS.map((value) => ({ value, label: value }));

export interface ChartPanelProps {
  candles: Candle[];
  interval: Interval;
  loading: boolean;
  onIntervalChange: (interval: Interval) => void;
}

export function ChartPanel({
  candles,
  interval,
  loading,
  onIntervalChange,
}: ChartPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [showSma, setShowSma] = useState(false);
  const [zoomResets, setZoomResets] = useState(0);

  return (
    <div ref={panelRef} className="flex h-full flex-col">
      <div className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-hairline px-3 py-2">
        <span className="text-sm font-medium text-ink">Price</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="ghost"
            size="md"
            aria-pressed={showSma}
            onClick={() => setShowSma((value) => !value)}
            className={showSma ? "text-accent!" : undefined}
          >
            SMA
          </Button>
          <Button
            variant="ghost"
            size="md"
            aria-label="Reset zoom"
            onClick={() => setZoomResets((count) => count + 1)}
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
            items={INTERVAL_TABS}
            value={interval}
            onValueChange={onIntervalChange}
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
            candles={candles}
            showSma={showSma}
            zoomResets={zoomResets}
          />
        </div>
      </div>
    </div>
  );
}
