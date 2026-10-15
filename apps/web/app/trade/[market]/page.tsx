import { RequireAuth } from "@/components/auth/require-auth";
import { Terminal } from "@/components/terminal/terminal";
import { marketByUiSymbol } from "@/lib/market/markets";
import {
  loadMarketSummaries,
  loadTerminalData,
  type MarketSummary,
  type TerminalData,
} from "@/lib/market/terminal-data";
import { priceDp } from "@/lib/format";

export const instant = false;

export default async function TradePage(props: PageProps<"/trade/[market]">) {
  const { market } = await props.params;
  const symbol = market.toUpperCase();
  const config = marketByUiSymbol(symbol);
  const perpexSymbol = config?.perpex ?? symbol;
  const dp = priceDp(symbol);

  const [data, markets] = await Promise.all([
    loadTerminalData(symbol).catch(() => null as TerminalData | null),
    loadMarketSummaries().catch(() => [] as MarketSummary[]),
  ]);

  return (
    <main className="flex min-h-screen flex-col gap-3 px-3 py-4">
      <RequireAuth>
        {data ? (
          <Terminal
            market={perpexSymbol}
            symbol={symbol}
            dp={dp}
            initial={data}
            markets={markets}
          />
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
