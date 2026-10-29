import { SideBadge } from "@/components/ui/side-badge";
import { Cell, EmptyState, Row, Table } from "@/components/ui/table";
import { formatDateTime, formatNumber } from "@/lib/format";
import { priceDecimalsFor } from "@/lib/markets";
import type { Order } from "@/lib/types";

const SIZE_DECIMALS = 4;

export function OpenOrdersTable({
  orders,
  cancellingId,
  onCancel,
  emptyText,
}: {
  orders: Order[];
  cancellingId: string | null;
  onCancel: (order: Order) => void;
  emptyText: string;
}) {
  if (!orders.length) return <EmptyState text={emptyText} />;

  return (
    <Table head={["Time", "Market", "Type", "Price", "Size", "Filled", ""]}>
      {orders.map((order) => (
        <Row key={order.orderId}>
          <Cell muted>{formatDateTime(order.createdAt)}</Cell>
          <Cell>
            <span className="flex items-center gap-2">
              {order.market}
              <SideBadge side={order.side} />
            </span>
          </Cell>
          <Cell muted>{order.type.toLowerCase()}</Cell>
          <Cell right>
            {order.price
              ? formatNumber(order.price, priceDecimalsFor(order.market))
              : "Market"}
          </Cell>
          <Cell right>{formatNumber(order.quantity, SIZE_DECIMALS)}</Cell>
          <Cell right>{formatNumber(order.filledQuantity, SIZE_DECIMALS)}</Cell>
          <Cell right>
            <button
              type="button"
              disabled={cancellingId === order.orderId}
              onClick={() => onCancel(order)}
              className="cursor-pointer rounded-md bg-panel-raised px-2.5 py-1 text-[12px] font-medium text-ink-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancellingId === order.orderId ? "Cancelling…" : "Cancel"}
            </button>
          </Cell>
        </Row>
      ))}
    </Table>
  );
}
