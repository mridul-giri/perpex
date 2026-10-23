"use client";

import { useEffect, useRef, useState } from "react";
import { getCandles } from "@/lib/api/market";
import {
  addTradeToCandles,
  CHART_CANDLE_LIMIT,
  DEFAULT_INTERVAL,
  type Interval,
} from "@/lib/candles";
import { env } from "@/lib/env";
import type { TerminalData } from "@/lib/terminal-data";
import type { Candle, Depth, MarketRisk, Trade } from "@/lib/types";
import { WsClient } from "@/lib/ws-client";

const RECENT_TRADES = 40;
const DEPTH_REDRAW_MS = 500;

interface ChartState {
  interval: Interval;
  candles: Candle[];
}

interface TradeMessage {
  price: string;
  quantity: string;
  isBuyerMaker: boolean;
  timestamp: number;
}
interface MarkPriceMessage {
  markPrice: string;
  indexPrice: string | null;
  fundingRateBps: string;
}

export function useLiveMarket(slug: string, initial: TerminalData) {
  const [depth, setDepth] = useState<Depth>(initial.depth);
  const [trades, setTrades] = useState<Trade[]>(initial.trades);
  const [risk, setRisk] = useState<MarketRisk>(initial.risk);
  const [connected, setConnected] = useState(true);
  const [chart, setChart] = useState<ChartState>({
    interval: DEFAULT_INTERVAL,
    candles: initial.candles,
  });
  const [chartLoading, setChartLoading] = useState(false);
  const newestDepth = useRef<Depth | null>(null);
  const requestedInterval = useRef<Interval>(DEFAULT_INTERVAL);

  useEffect(() => {
    const ws = new WsClient(env.wsUrl);
    ws.onStatus = (status) => {
      if (status !== "connecting") setConnected(status === "open");
    };

    const onDepth = (data: unknown) => {
      newestDepth.current = data as Depth;
    };

    const onTrade = (data: unknown) => {
      const message = data as TradeMessage;
      const trade: Trade = {
        id: crypto.randomUUID(),
        price: message.price,
        quantity: message.quantity,
        timestamp: Math.floor(message.timestamp / 1000),
        isBuyerMaker: message.isBuyerMaker,
      };
      setTrades((previous) => [trade, ...previous].slice(0, RECENT_TRADES));
      setChart((previous) => ({
        ...previous,
        candles: addTradeToCandles(previous.candles, trade, previous.interval),
      }));
    };

    const onMarkPrice = (data: unknown) => {
      const message = data as MarkPriceMessage;
      setRisk((previous) => ({ ...previous, ...message }));
    };

    const unsubscribes = [
      ws.subscribe("depth", slug, onDepth),
      ws.subscribe("trade", slug, onTrade),
      ws.subscribe("markprice", slug, onMarkPrice),
    ];

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
      ws.close();
    };
  }, [slug]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!newestDepth.current) return;
      setDepth(newestDepth.current);
      newestDepth.current = null;
    }, DEPTH_REDRAW_MS);
    return () => clearInterval(intervalId);
  }, []);

  const changeChartInterval = async (interval: Interval) => {
    requestedInterval.current = interval;
    setChartLoading(true);
    try {
      const candles = await getCandles(slug, interval, CHART_CANDLE_LIMIT);
      if (requestedInterval.current === interval) {
        setChart({ interval, candles });
      }
    } catch {
    } finally {
      if (requestedInterval.current === interval) setChartLoading(false);
    }
  };

  return {
    depth,
    trades,
    risk,
    connected,
    chart,
    chartLoading,
    changeChartInterval,
  };
}
