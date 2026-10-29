import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BoxCorners, ScreenRule } from "@/components/landing/rules";

const FOOTER_LINKS = [
  { href: "/trade/BTC", label: "Trade" },
  { href: "/signin", label: "Sign in" },
  { href: "/signup", label: "Create account" },
];

const GITHUB_URL = "https://github.com/mridul-giri/perpex";

export function SiteFooter() {
  return (
    <footer className="relative mt-16 sm:mt-24">
      <ScreenRule className="top-0" />
      <BoxCorners />

      <div className="flex flex-col gap-4 px-5 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-ink-muted">
          Perpetual futures on a single matching engine.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-ink-muted transition-colors hover:text-ink"
          >
            GitHub
            <ArrowUpRight className="size-3.5" strokeWidth={2} />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </nav>
      </div>

      <div
        aria-hidden
        className="h-[0.53em] overflow-hidden text-[min(30vw,356px)]"
      >
        <span className="-mt-[0.22em] block text-center font-semibold leading-none tracking-[-0.04em] text-ink">
          perpex
        </span>
      </div>
    </footer>
  );
}
