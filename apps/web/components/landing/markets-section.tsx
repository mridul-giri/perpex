import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { MarketCandles } from "@/components/landing/market-candles";
import {
  BoxCorners,
  DASHED_RULE,
  ScreenRule,
} from "@/components/landing/rules";
import { cn } from "@/lib/cn";
import { formatCompact, formatNumber, formatSigned } from "@/lib/format";
import { loadMarketOverviews, type MarketOverview } from "@/lib/landing-data";
import { MARKETS, type MarketConfig } from "@/lib/markets";
import { buildSampleCandles } from "@/lib/sample-candles";

const EMPTY = "—";

export function MarketsSection() {
  return (
    <section aria-labelledby="markets-heading" className="mt-20 sm:mt-28">
      <div className="flex flex-col gap-3 px-5 pb-8 text-left sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pb-10">
        <div>
          <h2
            id="markets-heading"
            className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-ink"
          >
            Markets
          </h2>
          <p className="mt-3 max-w-[48ch] text-base leading-relaxed text-ink-muted">
            Every perpetual market on perpex, with its own order book. Prices
            and the last 24 hours come straight from the exchange.
          </p>
        </div>
        <Link
          href="/trade/BTC"
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-ink-muted transition-colors hover:text-ink sm:self-auto"
        >
          Open the terminal
          <ArrowRight className="size-4" strokeWidth={2} />
        </Link>
      </div>

      <div className="relative">
        <ScreenRule className="top-0" />
        <ScreenRule className="bottom-0" />
        <BoxCorners />
        <Suspense fallback={<MarketGridSkeleton />}>
          <LiveMarketGrid />
        </Suspense>
      </div>
    </section>
  );
}

async function LiveMarketGrid() {
  await connection();
  const overviews = await loadMarketOverviews();
  const anyLive = overviews.some((overview) => overview.candles !== null);

  return (
    <>
      {!anyLive && (
        <p className="border-b border-dashed border-white/[0.1] bg-white/[0.02] px-5 py-3 text-left text-sm text-ink-muted sm:px-8">
          Live market data is offline right now. Prices and charts will appear
          here as soon as the feed is back.
        </p>
      )}
      <MarketGrid>
        {overviews.map((overview, index) => (
          <MarketCard
            key={overview.market.symbol}
            overview={overview}
            sampleSeed={index + 11}
          />
        ))}
      </MarketGrid>
    </>
  );
}

function MarketGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "grid divide-y lg:grid-cols-3 lg:divide-x lg:divide-y-0",
        "divide-dashed divide-white/[0.1]",
      )}
    >
      {children}
    </div>
  );
}

function MarketCard({
  overview,
  sampleSeed,
}: {
  overview: MarketOverview;
  sampleSeed: number;
}) {
  const { market, candles, ticker, markPrice, fundingRateBps } = overview;

  const price = markPrice ?? ticker?.last ?? null;
  const priceLabel = markPrice ? "Mark price" : "Last price";
  const changePct = ticker ? Number(ticker.changePct) : null;
  const isUp = changePct !== null && changePct >= 0;

  return (
    <Link
      href={`/trade/${market.symbol}`}
      className="group flex flex-col text-left transition-colors duration-150 hover:bg-white/[0.02]"
    >
      <div className="flex items-start justify-between gap-4 px-5 pt-6 sm:px-8 sm:pt-8">
        <MarketName market={market} />
        {changePct !== null ? (
          <span
            className={cn(
              "tabular rounded-[3px] px-2 py-1 text-sm font-medium",
              isUp
                ? "bg-[rgb(0_194_120_/_0.12)] text-up"
                : "bg-[rgb(253_75_78_/_0.12)] text-down",
            )}
          >
            {formatSigned(changePct, 2)}%
          </span>
        ) : (
          <span className="rounded-[3px] bg-white/[0.04] px-2 py-1 text-sm text-ink-dim">
            {EMPTY}
          </span>
        )}
      </div>

      <div className="px-5 pt-6 sm:px-8">
        <span className="text-xs text-ink-dim">
          {price ? priceLabel : "Price"}
        </span>
        <div className="tabular mt-1 text-[2rem] font-semibold leading-none tracking-[-0.02em] text-ink">
          {price ? formatNumber(price, market.priceDecimals) : EMPTY}
        </div>
      </div>

      <div className="mx-5 mt-6 h-24 sm:mx-8">
        {candles ? (
          <MarketCandles candles={candles} />
        ) : (
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1 opacity-30">
              <MarketCandles candles={buildSampleCandles(sampleSeed)} />
            </div>
            <span className="mt-1.5 text-xs text-ink-dim">
              Sample chart · live data unavailable
            </span>
          </div>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 pt-6 sm:px-8">
        <Stat
          label="24h high"
          value={
            ticker ? formatNumber(ticker.high, market.priceDecimals) : null
          }
        />
        <Stat
          label="24h low"
          value={ticker ? formatNumber(ticker.low, market.priceDecimals) : null}
        />
        <Stat
          label="24h volume"
          value={ticker ? `$${formatCompact(ticker.volume)}` : null}
        />
        <Stat
          label="Funding"
          value={fundingRateBps !== null ? `${fundingRateBps} bps` : null}
        />
      </dl>

      <span
        className={cn(
          "mt-8 flex items-center justify-between border-t px-5 py-4 text-sm font-medium text-ink-muted transition-colors group-hover:text-ink sm:px-8",
          DASHED_RULE,
        )}
      >
        Trade {market.symbol}-PERP
        <ArrowRight
          className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
          strokeWidth={2}
        />
      </span>
    </Link>
  );
}

function MarketName({ market }: { market: MarketConfig }) {
  return (
    <span className="flex flex-col">
      <span className="text-2xl font-semibold leading-none text-ink">
        {market.symbol}
      </span>
      <span className="mt-1.5 text-sm text-ink-muted">
        {market.name} perpetual
      </span>
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-ink-dim">{label}</dt>
      <dd
        className={cn(
          "tabular text-sm font-medium",
          value ? "text-ink" : "text-ink-dim",
        )}
      >
        {value ?? EMPTY}
      </dd>
    </div>
  );
}

function MarketGridSkeleton() {
  return (
    <MarketGrid>
      {MARKETS.map((market) => (
        <div key={market.symbol} className="flex flex-col text-left" aria-busy>
          <div className="px-5 pt-6 sm:px-8 sm:pt-8">
            <MarketName market={market} />
          </div>
          <div className="px-5 pt-6 sm:px-8">
            <div className="h-3 w-16 animate-pulse rounded-[2px] bg-white/[0.05]" />
            <div className="mt-2 h-8 w-40 animate-pulse rounded-[3px] bg-white/[0.05]" />
          </div>
          <div className="mx-5 mt-6 h-24 animate-pulse rounded-[3px] bg-white/[0.03] sm:mx-8" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 pt-6 sm:px-8">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="flex flex-col gap-2">
                <div className="h-3 w-14 animate-pulse rounded-[2px] bg-white/[0.05]" />
                <div className="h-4 w-20 animate-pulse rounded-[2px] bg-white/[0.05]" />
              </div>
            ))}
          </div>
          <div className={cn("mt-8 border-t px-5 py-4 sm:px-8", DASHED_RULE)}>
            <div className="h-4 w-28 animate-pulse rounded-[2px] bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </MarketGrid>
  );
}
