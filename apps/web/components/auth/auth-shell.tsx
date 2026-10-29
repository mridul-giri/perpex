import Link from "next/link";
import { RisingCandles } from "@/components/landing/rising-candles";
import {
  BoxCorners,
  CrossMark,
  DASHED_RULE,
  ScreenRule,
} from "@/components/landing/rules";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-ground">
      <div
        className={`mx-auto flex min-h-dvh w-full max-w-[1180px] flex-col border-x ${DASHED_RULE}`}
      >
        <header className="relative flex h-24 shrink-0 items-center justify-center px-5 sm:px-8">
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

        <main className="relative flex flex-1 flex-col items-center justify-center px-5 py-14 sm:px-8 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 h-[420px] -translate-y-1/2 opacity-[0.08]"
          >
            <RisingCandles className="h-full w-full" />
          </div>

          <div className="relative w-full max-w-[420px]">
            <div className="text-center">
              <h1 className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-ink">
                {title}
              </h1>
              {subtitle && (
                <p className="mx-auto mt-3 max-w-[38ch] text-base leading-relaxed text-pretty text-ink-muted">
                  {subtitle}
                </p>
              )}
            </div>

            <div
              className={`relative mt-8 border bg-ground p-6 sm:p-8 ${DASHED_RULE}`}
            >
              <BoxCorners />
              {children}
            </div>

            {footer && (
              <div className="mt-6 text-center text-sm text-ink-muted">
                {footer}
              </div>
            )}
          </div>
        </main>

        <footer className="relative shrink-0 px-5 py-6 text-sm sm:px-8">
          <ScreenRule className="top-0" />
          <CrossMark className="left-0 top-0 -translate-x-1/2 -translate-y-1/2" />
          <CrossMark className="right-0 top-0 translate-x-1/2 -translate-y-1/2" />
          <div className="flex items-center justify-between gap-4">
            <span className="text-ink-dim">
              Perpetual futures on a single matching engine.
            </span>
            <Link
              href="/"
              className="shrink-0 text-ink-muted transition-colors hover:text-ink"
            >
              Back to home
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
