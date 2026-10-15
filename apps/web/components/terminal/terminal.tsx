"use client";

import { useEffect, useRef, useState } from "react";
import { AccountMenu } from "@/components/account/account-menu";
import { ChartPanel } from "@/components/chart/chart-panel";
import { AccountPanel } from "@/components/terminal/account-panel";
import { BookTrades } from "@/components/terminal/book-trades";
import { MarketList } from "@/components/terminal/market-list";
import { MarketRibbon } from "@/components/terminal/market-ribbon";
import { OrderForm } from "@/components/terminal/order-form";
import { Panel } from "@/components/ui/panel";
import { env } from "@/lib/env";
import { foldTrade } from "@/lib/market/candles";
import type { MarketSummary, TerminalData } from "@/lib/market/terminal-data";
import type { Candle, Depth, MarketRisk, Trade } from "@/lib/market/types";
import { PerpexWsClient } from "@/lib/ws/perpex-ws";

interface DepthMessage {
  bids?: Depth["bids"];
  asks?: Depth["asks"];
}

interface MarkPriceMessage {
  markPrice?: string;
  indexPrice?: string | null;
  fundingRateBps?: string;
}

const toSeconds = (timestamp: number) =>
  timestamp > 1e12 ? Math.floor(timestamp / 1000) : timestamp;

export interface TerminalProps {
  market: string;
  symbol: string;
  dp: number;
  initial: TerminalData;
  markets: MarketSummary[];
}

export function Terminal({
  market,
  symbol,
  dp,
  initial,
  markets,
}: TerminalProps) {
  const [candles, setCandles] = useState<Candle[]>(initial.candles);
  const [depth, setDepth] = useState<Depth>(initial.depth);
  const [trades, setTrades] = useState<Trade[]>(initial.trades);
  const [risk, setRisk] = useState<MarketRisk>(initial.risk);
  const [connected, setConnected] = useState(true);
  const pendingDepthRef = useRef<Depth | null>(null);

  useEffect(() => {
    const ws = new PerpexWsClient(env.wsUrl);
    ws.onStatus = (status) => {
      if (status !== "connecting") setConnected(status === "open");
    };
    const offs = [
      ws.subscribe("depth", market, (data) => {
        const next = data as DepthMessage;
        if (Array.isArray(next?.bids) && Array.isArray(next?.asks)) {
          pendingDepthRef.current = { bids: next.bids, asks: next.asks };
        }
      }),
      ws.subscribe("trade", market, (data) => {
        const raw = data as Partial<Trade>;
        if (!raw?.price) return;
        const trade: Trade = {
          id: raw.id ?? crypto.randomUUID(),
          price: raw.price,
          quantity: raw.quantity ?? "0",
          timestamp: toSeconds(Number(raw.timestamp)),
          isBuyerMaker: raw.isBuyerMaker ?? false,
        };
        setTrades((prev) => [trade, ...prev].slice(0, 40));
        setCandles((prev) => foldTrade(prev, trade));
      }),
      ws.subscribe("markprice", market, (data) => {
        const message = data as MarkPriceMessage;
        setRisk((prev) => ({
          ...prev,
          markPrice: message.markPrice ?? prev.markPrice,
          indexPrice: message.indexPrice ?? prev.indexPrice,
          fundingRateBps: message.fundingRateBps ?? prev.fundingRateBps,
        }));
      }),
    ];

    return () => {
      offs.forEach((off) => off());
      ws.close();
    };
  }, [market]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (pendingDepthRef.current) {
        setDepth(pendingDepthRef.current);
        pendingDepthRef.current = null;
      }
    }, 500);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <div className="grid items-stretch gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <MarketRibbon
          dp={dp}
          ticker={initial.ticker}
          risk={risk}
          symbol={symbol}
          market={market}
        />
        <AccountMenu />
      </div>

      {!connected && (
        <div className="flex items-center gap-2 rounded-md bg-[rgb(253_75_78_/_0.14)] px-3 py-2 text-xs text-warn">
          <span className="size-1.5 animate-pulse rounded-full bg-warn" />
          Reconnecting to the live feed…
        </div>
      )}

      <div className="grid gap-3 lg:h-[900px] lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[minmax(0,1fr)_280px]">
        <div className="grid min-w-0 gap-3 lg:h-full lg:grid-cols-[minmax(0,1fr)_300px]">
          <Panel
            flush
            className="h-[360px] overflow-hidden sm:h-[460px] md:h-[540px] lg:h-full"
          >
            <ChartPanel market={market} candles={candles} />
          </Panel>
          <Panel
            flush
            className="h-[440px] overflow-hidden sm:h-[520px] md:h-[580px] lg:h-full"
          >
            <BookTrades depth={depth} trades={trades} dp={dp} />
          </Panel>
        </div>

        <Panel flush className="overflow-hidden lg:h-full">
          <OrderForm
            market={market}
            base={symbol}
            dp={dp}
            markPrice={risk.markPrice}
            live
          />
        </Panel>

        <Panel
          flush
          className="h-[320px] overflow-hidden sm:h-[380px] lg:h-full"
        >
          <AccountPanel dp={dp} />
        </Panel>

        <Panel
          flush
          className="h-[320px] overflow-hidden sm:h-[380px] lg:h-full"
        >
          <MarketList markets={markets} active={symbol} />
        </Panel>
      </div>
    </>
  );
}
