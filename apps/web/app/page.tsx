import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GetStartedSection } from "@/components/landing/get-started-section";
import { MarketsSection } from "@/components/landing/markets-section";
import { RisingCandles } from "@/components/landing/rising-candles";
import { SiteFooter } from "@/components/landing/site-footer";
import {
  BoxCorners,
  CrossMark,
  DASHED_RULE,
  ScreenRule,
} from "@/components/landing/rules";
import terminalImage from "@/public/perpex-terminal.webp";

export const metadata: Metadata = {
  title: "perpex — Trade crypto perpetuals with up to 50x leverage",
  description:
    "Perpetual-futures exchange with a live order book, real-time candles, and leveraged order entry — settled by a single matching engine.",
};

export default function Home() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-ground">
      <div
        className={`mx-auto flex min-h-dvh w-full max-w-[1180px] flex-col border-x ${DASHED_RULE}`}
      >
        <header className="relative flex h-24 items-center justify-center px-5 sm:px-8">
          <ScreenRule className="bottom-0" />
          <CrossMark className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
          <CrossMark className="bottom-0 right-0 translate-x-1/2 translate-y-1/2" />
          <Link
            href="/"
            aria-label="perpex home"
            className="inline-flex items-center"
          >
            <span className="text-2xl font-semibold leading-none tracking-[0.02em] text-ink sm:text-4xl">
              perpex
            </span>
          </Link>
        </header>

        <main className="pt-14 text-center sm:pt-20">
          <div className="relative mx-5 py-6 sm:mx-8 sm:py-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-5 -right-5 opacity-[0.14] sm:-left-8 sm:-right-8"
            >
              <RisingCandles className="h-full w-full" />
            </div>

            <div className="relative">
              <h1 className="mx-auto max-w-[24ch] text-[clamp(2.25rem,5.2vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-balance text-ink">
                Trade crypto perpetuals with up to 50x leverage
              </h1>

              <p className="mx-auto mt-6 max-w-[62ch] text-base leading-relaxed text-pretty text-ink-muted sm:text-lg">
                Go long or short on BTC, ETH and SOL in seconds. Every order
                hits an in-memory matching engine, and the order book, trades
                and candles stream straight to your screen as they happen.
              </p>

              <Link
                href="/trade/BTC"
                className="mt-9 inline-flex h-12 items-center gap-2 rounded-[3px] bg-ink px-6 text-sm font-semibold text-ground transition-colors duration-150 hover:bg-white active:bg-ink-muted"
              >
                Start trading
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </Link>
            </div>
          </div>

          <div className="relative mt-12 p-1.5 sm:mt-16 sm:p-2">
            <ScreenRule className="top-0" />
            <ScreenRule className="bottom-0" />
            <BoxCorners />
            <Image
              src={terminalImage}
              alt="The perpex terminal showing the BTC-PERP price chart, order book, and leveraged order form."
              priority
              sizes="(min-width: 1180px) 1178px, 100vw"
              className="block w-full"
            />
          </div>

          <MarketsSection />
          <GetStartedSection />
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
