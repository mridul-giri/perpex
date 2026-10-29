import { notFound } from "next/navigation";
import { RequireAuth } from "@/components/auth/require-auth";
import { BalanceProvider } from "@/components/balance/balance-provider";
import { Terminal } from "@/components/terminal/terminal";
import { findMarket } from "@/lib/markets";
import { loadMarketSummaries, loadTerminalData } from "@/lib/terminal-data";

export const instant = false;

const TERMINAL_THEME = [
  "[--radius-sm:2px]",
  "[--radius-md:3px]",
  "[--radius-lg:4px]",
  "[--radius-xl:6px]",
].join(" ");

export default async function TradePage(props: PageProps<"/trade/[market]">) {
  const { market: symbol } = await props.params;
  const market = findMarket(symbol);
  if (!market) notFound();

  const [data, summaries] = await Promise.all([
    loadTerminalData(market).catch(() => null),
    loadMarketSummaries(),
  ]);

  return (
    <main
      className={`flex min-h-screen flex-col font-terminal ${TERMINAL_THEME}`}
    >
      <RequireAuth>
        {data ? (
          <BalanceProvider>
            <Terminal market={market} initial={data} summaries={summaries} />
          </BalanceProvider>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <span className="text-sm font-medium text-ink-muted">
              Market data unavailable
            </span>
            <span className="text-xs text-ink-dim">
              Couldn&apos;t reach the perpex API (apps/api :3001). Start the
              backend and reload.
            </span>
          </div>
        )}
      </RequireAuth>
    </main>
  );
}
