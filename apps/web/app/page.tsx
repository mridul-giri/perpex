import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "perpex — Markets without limits",
  description:
    "Perpetual-futures exchange with a live order book, real-time candles, and leveraged order entry — settled by a single matching engine.",
};

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-ground">
      <header className="relative z-20">
        <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            aria-label="perpex home"
            className="inline-flex items-center gap-2.5"
          >
            <span className="font-pixel text-3xl leading-none tracking-[0.06em] text-ink">
              PERPEX
            </span>
          </Link>

          <Link
            href="/signin"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-5 text-sm font-medium text-[#062018] transition-[filter] duration-150 hover:brightness-110 active:brightness-95"
          >
            Log in
            <ArrowUpRight className="size-4" strokeWidth={2.25} />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-5 pt-14 sm:px-8 sm:pt-24 text-center">
        <h1 className="font-pixel text-[clamp(2.75rem,8.5vw,7rem)] leading-[0.92] text-ink">
          Markets without limits
          <span className="text-ink">.</span>
        </h1>
      </main>

      <section className="relative z-10 mt-14 sm:mt-20">
        <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8">
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 top-[15%] rounded-[24px] bg-panel"
            />
            <div className="relative z-10 mx-auto w-[88%] max-w-[1040px] pb-[8%] sm:pb-[5%]">
              <div className="rounded-[16px] bg-[#0a0b0f] p-2 shadow-float sm:p-3">
                <Image
                  src="/perpex-terminal.png"
                  alt="The perpex terminal showing the BTC-PERP price chart, order book, and leveraged order form."
                  width={2928}
                  height={1594}
                  priority
                  sizes="(min-width: 1180px) 1040px, 88vw"
                  className="w-full rounded-[12px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
