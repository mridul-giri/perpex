import { SideBadge } from "@/components/ui/side-badge";
import { Cell, EmptyState, Row, Table } from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { priceDecimalsFor } from "@/lib/markets";
import type { OpenPosition } from "@/lib/types";

const SIZE_DECIMALS = 4;

export function PositionsTable({
  positions,
  closingMarket,
  onClose,
  emptyText,
}: {
  positions: OpenPosition[];
  closingMarket: string | null;
  onClose: (position: OpenPosition) => void;
  emptyText: string;
}) {
  if (!positions.length) return <EmptyState text={emptyText} />;

  return (
    <Table
      head={[
        "Market",
        "Side",
        "Size",
        "Entry price",
        "Margin",
        "Liq. price",
        "",
      ]}
    >
      {positions.map((position) => {
        const priceDecimals = priceDecimalsFor(position.market);
        return (
          <Row key={position.market}>
            <Cell>{position.market}</Cell>
            <Cell>
              <SideBadge side={position.side} />
            </Cell>
            <Cell right>{formatNumber(position.quantity, SIZE_DECIMALS)}</Cell>
            <Cell right>
              {formatNumber(position.averagePrice, priceDecimals)}
            </Cell>
            <Cell right>{formatNumber(position.margin, 2)}</Cell>
            <Cell right tone="down">
              {formatNumber(position.liquidationPrice, priceDecimals)}
            </Cell>
            <Cell right>
              <button
                type="button"
                disabled={closingMarket !== null}
                onClick={() => onClose(position)}
                className="cursor-pointer rounded-md bg-[rgb(253_75_78_/_0.15)] px-2.5 py-1 text-[11px] font-medium text-down transition-colors hover:bg-[rgb(253_75_78_/_0.25)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {closingMarket === position.market
                  ? "Closing…"
                  : "Market close"}
              </button>
            </Cell>
          </Row>
        );
      })}
    </Table>
  );
}
