import { Cell, EmptyState, Row, Table } from "@/components/ui/table";
import { formatDateTime, formatNumber } from "@/lib/format";
import { priceDecimalsFor } from "@/lib/markets";
import type { Fill } from "@/lib/types";

const SIZE_DECIMALS = 4;

export function FillsTable({
  fills,
  emptyText,
}: {
  fills: Fill[];
  emptyText: string;
}) {
  if (!fills.length) return <EmptyState text={emptyText} />;

  return (
    <Table head={["Time", "Market", "Price", "Size", "Role"]}>
      {fills.map((fill) => (
        <Row key={fill.fillId}>
          <Cell muted>{formatDateTime(fill.createdAt)}</Cell>
          <Cell>{fill.market}</Cell>
          <Cell right>
            {formatNumber(fill.price, priceDecimalsFor(fill.market))}
          </Cell>
          <Cell right>{formatNumber(fill.quantity, SIZE_DECIMALS)}</Cell>
          <Cell right>
            <span
              className={fill.role === "maker" ? "text-info" : "text-ink-muted"}
            >
              {fill.role}
            </span>
          </Cell>
        </Row>
      ))}
    </Table>
  );
}
