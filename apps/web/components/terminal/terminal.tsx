"use client";

import { useEffect } from "react";
import { AccountMenu } from "@/components/account/account-menu";
import { useBalance } from "@/components/balance/balance-provider";
import { ChartPanel } from "@/components/chart/chart-panel";
import { AccountPanel } from "@/components/terminal/account-panel/account-panel";
import { BookTrades } from "@/components/terminal/book-trades";
import { MarketList } from "@/components/terminal/market-list";
import { MarketRibbon } from "@/components/terminal/market-ribbon";
import { OrderForm } from "@/components/terminal/order-form/order-form";
import { Panel } from "@/components/ui/panel";
import { useLiveMarket } from "@/hooks/use-live-market";
import type { MarketConfig } from "@/lib/markets";
import type { MarketSummary, TerminalData } from "@/lib/terminal-data";

export interface TerminalProps {
  market: MarketConfig;
  initial: TerminalData;
  summaries: MarketSummary[];
}

export function Terminal({ market, initial, summaries }: TerminalProps) {
  const live = useLiveMarket(market.slug, initial);
  const { refresh: refreshBalance } = useBalance();

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return (
    <>
      <div className="grid items-stretch gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <MarketRibbon
          market={market}
          ticker={initial.ticker}
          risk={live.risk}
        />
        <AccountMenu />
      </div>

      {!live.connected && (
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
            <ChartPanel
              candles={live.chart.candles}
              interval={live.chart.interval}
              loading={live.chartLoading}
              onIntervalChange={live.changeChartInterval}
            />
          </Panel>
          <Panel
            flush
            className="h-[440px] overflow-hidden sm:h-[520px] md:h-[580px] lg:h-full"
          >
            <BookTrades
              depth={live.depth}
              trades={live.trades}
              priceDecimals={market.priceDecimals}
            />
          </Panel>
        </div>

        <Panel flush className="overflow-hidden lg:h-full">
          <OrderForm market={market} markPrice={live.risk.markPrice} />
        </Panel>

        <Panel
          flush
          className="h-[320px] overflow-hidden sm:h-[380px] lg:h-full"
        >
          <AccountPanel />
        </Panel>

        <Panel
          flush
          className="h-[320px] overflow-hidden sm:h-[380px] lg:h-full"
        >
          <MarketList summaries={summaries} activeSymbol={market.symbol} />
        </Panel>
      </div>
    </>
  );
}
