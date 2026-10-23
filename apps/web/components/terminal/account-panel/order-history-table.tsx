import { SideBadge } from "@/components/ui/side-badge";
import { Cell, EmptyState, Row, Table } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { formatDateTime, formatNumber } from "@/lib/format";
import { priceDecimalsFor } from "@/lib/markets";
import type { Order, OrderStatus } from "@/lib/types";

const SIZE_DECIMALS = 4;

const STATUS_COLOR: Record<OrderStatus, string> = {
  Filled: "text-up",
  Cancelled: "text-down",
  PartiallyFilled: "text-warn",
  Open: "text-ink",
};

export function OrderHistoryTable({
  orders,
  emptyText,
}: {
  orders: Order[];
  emptyText: string;
}) {
  if (!orders.length) return <EmptyState text={emptyText} />;

  return (
    <Table head={["Time", "Market", "Type", "Price", "Size", "Status"]}>
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
          <Cell right>
            <span className={cn("font-medium", STATUS_COLOR[order.status])}>
              {order.status}
            </span>
          </Cell>
        </Row>
      ))}
    </Table>
  );
}
