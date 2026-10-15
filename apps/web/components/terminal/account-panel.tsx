"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { fmt, fmtDateTime } from "@/lib/format";
import type { Side } from "@/lib/market/types";
import {
  PerpexTrading,
  type Fill,
  type OpenPosition,
  type OrderItem,
} from "@/lib/trading";
import { usePolling } from "@/lib/use-polling";

const trading = new PerpexTrading();
const POLL_MS = 5000;

type Tab = "Positions" | "Open Orders" | "Order History" | "Fills";
const TABS: Tab[] = ["Positions", "Open Orders", "Order History", "Fills"];

export interface AccountPanelProps {
  dp: number;
}

export function AccountPanel({ dp }: AccountPanelProps) {
  const [tab, setTab] = useState<Tab>("Positions");
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [openOrders, setOpenOrders] = useState<OrderItem[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderItem[]>([]);
  const [fills, setFills] = useState<Fill[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [closingMarket, setClosingMarket] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchAll = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const [pos, open, hist, fillsRes] = await Promise.allSettled([
      trading.getPositions(),
      trading.getOrders("Open"),
      trading.getOrders(),
      trading.getFills(),
    ]);
    if (requestId !== requestIdRef.current) return;

    if (pos.status === "fulfilled") setPositions(pos.value);
    if (open.status === "fulfilled") setOpenOrders(open.value);
    if (hist.status === "fulfilled") setOrderHistory(hist.value);
    if (fillsRes.status === "fulfilled") setFills(fillsRes.value);
    setLoaded(true);
  }, []);

  usePolling(fetchAll, POLL_MS);

  const cancelOrder = async (order: OrderItem) => {
    setCancelling(order.orderId);
    setOpenOrders((prev) => prev.filter((o) => o.orderId !== order.orderId));
    try {
      await trading.cancelOrder(order.orderId, order.market);
    } catch {}
    await fetchAll();
    setCancelling(null);
  };

  const closePosition = async (position: OpenPosition) => {
    setClosingMarket(position.market);
    try {
      await trading.placeOrder({
        type: "MARKET",
        side: position.side === "LONG" ? "SHORT" : "LONG",
        market: position.market,
        quantity: position.quantity,
        leverage: 10,
        slippageTolerance: 0.02,
      });
    } catch {}
    await fetchAll();
    setClosingMarket(null);
  };

  const counts: Partial<Record<Tab, number>> = {
    Positions: positions.length,
    "Open Orders": openOrders.length,
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-5 overflow-x-auto border-b border-hairline px-4">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 whitespace-nowrap py-2.5 text-xs font-medium transition-colors",
              tab === item ? "text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            {item}
            {counts[item] ? (
              <span className="tabular rounded-md bg-panel-raised px-1.5 text-[11px] font-medium text-ink">
                {counts[item]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto text-xs">
        {tab === "Positions" &&
          (positions.length ? (
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
              {positions.map((position) => (
                <tr
                  key={position.market}
                  className="border-t border-hairline/60"
                >
                  <Cell>{position.market}</Cell>
                  <Cell>
                    <SideBadge side={position.side} />
                  </Cell>
                  <Cell right>{fmt(position.quantity, 4)}</Cell>
                  <Cell right>{fmt(position.averagePrice, dp)}</Cell>
                  <Cell right>{fmt(position.margin, 2)}</Cell>
                  <Cell right tone="down">
                    {fmt(position.liquidationPrice, dp)}
                  </Cell>
                  <Cell right>
                    <button
                      type="button"
                      disabled={closingMarket !== null}
                      onClick={() => closePosition(position)}
                      className="cursor-pointer rounded-md bg-[rgb(253_75_78_/_0.15)] px-2.5 py-1 text-[11px] font-medium text-down transition-colors hover:bg-[rgb(253_75_78_/_0.25)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {closingMarket === position.market
                        ? "Closing…"
                        : "Market close"}
                    </button>
                  </Cell>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty text={loaded ? "No open positions" : "Loading…"} />
          ))}

        {tab === "Open Orders" &&
          (openOrders.length ? (
            <Table
              head={["Time", "Market", "Type", "Price", "Size", "Filled", ""]}
            >
              {openOrders.map((order) => (
                <tr key={order.orderId} className="border-t border-hairline/60">
                  <Cell muted>{fmtDateTime(order.createdAt)}</Cell>
                  <Cell>
                    <span className="flex items-center gap-2">
                      {order.market}
                      <SideBadge side={order.side} />
                    </span>
                  </Cell>
                  <Cell muted>{order.type.toLowerCase()}</Cell>
                  <Cell right>
                    {order.price ? fmt(order.price, dp) : "Market"}
                  </Cell>
                  <Cell right>{fmt(order.quantity, 4)}</Cell>
                  <Cell right>{fmt(order.filledQuantity, 4)}</Cell>
                  <Cell right>
                    <button
                      type="button"
                      disabled={cancelling === order.orderId}
                      onClick={() => cancelOrder(order)}
                      className="cursor-pointer rounded-md bg-panel-raised px-2.5 py-1 text-[11px] font-medium text-ink-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cancelling === order.orderId ? "Cancelling…" : "Cancel"}
                    </button>
                  </Cell>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty text={loaded ? "No open orders" : "Loading…"} />
          ))}

        {tab === "Order History" &&
          (orderHistory.length ? (
            <Table head={["Time", "Market", "Type", "Price", "Size", "Status"]}>
              {orderHistory.map((order) => (
                <tr key={order.orderId} className="border-t border-hairline/60">
                  <Cell muted>{fmtDateTime(order.createdAt)}</Cell>
                  <Cell>
                    <span className="flex items-center gap-2">
                      {order.market}
                      <SideBadge side={order.side} />
                    </span>
                  </Cell>
                  <Cell muted>{order.type.toLowerCase()}</Cell>
                  <Cell right>
                    {order.price ? fmt(order.price, dp) : "Market"}
                  </Cell>
                  <Cell right>{fmt(order.quantity, 4)}</Cell>
                  <Cell right>
                    <OrderStatus status={order.status} />
                  </Cell>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty text={loaded ? "No order history" : "Loading…"} />
          ))}

        {tab === "Fills" &&
          (fills.length ? (
            <Table head={["Time", "Market", "Price", "Size", "Role"]}>
              {fills.map((fill) => (
                <tr key={fill.fillId} className="border-t border-hairline/60">
                  <Cell muted>{fmtDateTime(fill.createdAt)}</Cell>
                  <Cell>{fill.market}</Cell>
                  <Cell right>{fmt(fill.price, dp)}</Cell>
                  <Cell right>{fmt(fill.quantity, 4)}</Cell>
                  <Cell right>
                    <span
                      className={
                        fill.role === "maker" ? "text-info" : "text-ink-muted"
                      }
                    >
                      {fill.role}
                    </span>
                  </Cell>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty text={loaded ? "No fills yet" : "Loading…"} />
          ))}
      </div>
    </div>
  );
}

function Table({
  head,
  children,
}: {
  head: string[];
  children: React.ReactNode;
}) {
  return (
    <table className="w-full min-w-[620px] border-collapse">
      <thead className="sticky top-0 bg-panel">
        <tr>
          {head.map((label, index) => (
            <th
              key={`${label}-${index}`}
              className={cn(
                "h-9 px-4 text-xs font-medium text-ink-muted",
                index > 1 ? "text-right" : "text-left",
              )}
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Cell({
  children,
  right,
  muted,
  tone,
}: {
  children: React.ReactNode;
  right?: boolean;
  muted?: boolean;
  tone?: "up" | "down";
}) {
  return (
    <td
      className={cn(
        "h-10 px-4",
        right && "tabular text-right",
        muted && "text-ink-muted",
        tone === "up" && "text-up",
        tone === "down" && "text-down",
      )}
    >
      {children}
    </td>
  );
}

function SideBadge({ side }: { side: Side }) {
  const isLong = side === "LONG";
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        isLong
          ? "bg-[rgb(0_194_120_/_0.15)] text-up"
          : "bg-[rgb(253_75_78_/_0.15)] text-down",
      )}
    >
      {side}
    </span>
  );
}

function OrderStatus({ status }: { status: OrderItem["status"] }) {
  const tone =
    status === "Filled"
      ? "text-up"
      : status === "Cancelled"
        ? "text-down"
        : status === "PartiallyFilled"
          ? "text-warn"
          : "text-ink";
  return <span className={cn("font-medium", tone)}>{status}</span>;
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-ink-dim">
      {text}
    </div>
  );
}
