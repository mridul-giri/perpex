"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type UTCTimestamp,
} from "lightweight-charts";
import { cn } from "@/lib/cn";
import type { Candle } from "@/lib/types";

const UP = "#00c278";
const DOWN = "#fd4b4e";
const SMA_COLOR = "#27a3fd";
const GRID_H = "rgba(255,255,255,0.05)";
const AXIS_TEXT = "rgba(255,255,255,0.34)";
const BORDER = "rgba(255,255,255,0.06)";
const CROSSHAIR = "rgba(255,255,255,0.22)";
const CROSSHAIR_LABEL = "#202126";
const PRICE_LINE = "rgba(255,255,255,0.35)";
const INITIAL_VISIBLE_CANDLES = 90;
const SMA_PERIOD = 20;

const toCandle = (c: Candle) => ({
  time: c.timestamp as UTCTimestamp,
  open: Number(c.open),
  high: Number(c.high),
  low: Number(c.low),
  close: Number(c.close),
});

const movingAverage = (candles: Candle[], period: number) => {
  const out: LineData[] = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += Number(candles[i]!.close);
    if (i >= period) sum -= Number(candles[i - period]!.close);
    if (i >= period - 1) {
      out.push({
        time: candles[i]!.timestamp as UTCTimestamp,
        value: sum / period,
      });
    }
  }
  return out;
};

function OhlcLegend({ candle }: { candle: Candle }) {
  const up = Number(candle.close) >= Number(candle.open);
  const cells: [string, string][] = [
    ["o", candle.open],
    ["h", candle.high],
    ["l", candle.low],
    ["c", candle.close],
  ];

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-3.5 rounded-md bg-ground/90 px-3 py-1.5">
      {cells.map(([label, value]) => (
        <div key={label} className="flex items-baseline gap-1">
          <span className="text-[12px] text-ink-muted">{label}</span>
          <span
            className={cn(
              "tabular text-xs font-medium",
              label === "c" ? (up ? "text-up" : "text-down") : "text-ink",
            )}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

export interface PriceChartProps {
  candles: Candle[];
  showSma?: boolean;
  zoomResets?: number;
}

export function PriceChart({
  candles,
  showSma = false,
  zoomResets = 0,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const firstTimeRef = useRef<number | null>(null);
  const candlesRef = useRef<Candle[]>(candles);
  const [hover, setHover] = useState<Candle | null>(null);

  useEffect(() => {
    candlesRef.current = candles;
  }, [candles]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      overlayPriceScales: { ticksVisible: true, borderVisible: false },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: CROSSHAIR,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: CROSSHAIR_LABEL,
        },
        horzLine: {
          color: CROSSHAIR,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: CROSSHAIR_LABEL,
        },
      },
      rightPriceScale: {
        visible: true,
        ticksVisible: true,
        entireTextOnly: true,
        borderColor: BORDER,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: BORDER,
      },
      grid: {
        horzLines: { color: GRID_H, style: LineStyle.Dashed },
        vertLines: { visible: false },
      },
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: AXIS_TEXT,
        fontFamily: getComputedStyle(container).fontFamily,
        fontSize: 12,
      },
      localization: { locale: "en-US" },
    });

    candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: UP,
      downColor: DOWN,
      wickUpColor: UP,
      wickDownColor: DOWN,
      borderVisible: false,
      priceLineColor: PRICE_LINE,
      priceLineWidth: 1,
      priceLineStyle: LineStyle.Dashed,
    });

    chart.subscribeCrosshairMove((param) => {
      if (param.time === undefined || param.point === undefined) {
        setHover(null);
        return;
      }
      const time = Number(param.time);
      const found = candlesRef.current.find((c) => c.timestamp === time);
      setHover(found ?? null);
    });

    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      smaSeriesRef.current = null;
      firstTimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    const chart = chartRef.current;
    if (!candleSeries || !chart) return;

    const first = candles[0]?.timestamp ?? null;
    if (first !== firstTimeRef.current) {
      candleSeries.setData(candles.map(toCandle));
      firstTimeRef.current = first;
      const visible = Math.min(candles.length, INITIAL_VISIBLE_CANDLES);
      chart.timeScale().setVisibleLogicalRange({
        from: candles.length - visible,
        to: candles.length + 6,
      });
      return;
    }

    const last = candles[candles.length - 1];
    if (last) {
      candleSeries.update(toCandle(last));
      chart.timeScale().scrollToRealTime();
    }
  }, [candles]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (showSma) {
      if (!smaSeriesRef.current) {
        smaSeriesRef.current = chart.addSeries(LineSeries, {
          color: SMA_COLOR,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
      }
      smaSeriesRef.current.setData(movingAverage(candles, SMA_PERIOD));
    } else if (smaSeriesRef.current) {
      chart.removeSeries(smaSeriesRef.current);
      smaSeriesRef.current = null;
    }
  }, [candles, showSma]);

  useEffect(() => {
    if (zoomResets > 0) chartRef.current?.timeScale().fitContent();
  }, [zoomResets]);

  const legend = hover ?? candles[candles.length - 1] ?? null;

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {legend && <OhlcLegend candle={legend} />}
    </div>
  );
}
