import { apiFetch } from "@/lib/http";
import type { Side } from "@/lib/market/types";

export interface Balance {
  availableBalance: string;
  lockedBalance: string;
}

export interface OpenPosition {
  market: string;
  side: Side;
  quantity: string;
  averagePrice: string;
  liquidationPrice: string;
  margin: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  orderId: string;
  market: string;
  type: "LIMIT" | "MARKET";
  side: Side;
  price: string | null;
  quantity: string;
  filledQuantity: string;
  status: "Open" | "PartiallyFilled" | "Filled" | "Cancelled";
  createdAt: string;
}

export interface Fill {
  fillId: string;
  market: string;
  price: string;
  quantity: string;
  makerOrderId: string;
  takerOrderId: string;
  role: "maker" | "taker";
  createdAt: string;
}

export interface LiquidationItem {
  id: string;
  market: string;
  quantity: string;
  bankruptcyPrice: string;
  liquidationPrice: string;
  createdAt: string;
}

export interface OrderResult {
  orderId: string;
  status: string;
  price?: string;
  quantity: string;
  filledQuantity: string;
}

export interface PlaceOrderInput {
  type: "LIMIT" | "MARKET";
  side: Side;
  market: string;
  quantity: string;
  leverage: number;
  price?: string;
  slippageTolerance?: number;
}

interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

const idempotencyKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export class PerpexTrading {
  getBalance(): Promise<Balance> {
    return apiFetch<Balance>("/account/balance");
  }

  deposit(amount: string): Promise<Balance> {
    return apiFetch<Balance>("/account/deposits", {
      method: "POST",
      body: { amount },
      idempotencyKey: idempotencyKey(),
    });
  }

  withdraw(amount: string): Promise<Balance> {
    return apiFetch<Balance>("/account/withdrawals", {
      method: "POST",
      body: { amount },
      idempotencyKey: idempotencyKey(),
    });
  }

  placeOrder(input: PlaceOrderInput): Promise<OrderResult> {
    const body =
      input.type === "LIMIT"
        ? {
            type: "LIMIT",
            side: input.side,
            market: input.market,
            price: input.price,
            quantity: input.quantity,
            leverage: input.leverage,
          }
        : {
            type: "MARKET",
            side: input.side,
            market: input.market,
            quantity: input.quantity,
            leverage: input.leverage,
            slippageTolerance: input.slippageTolerance ?? 0.02,
          };

    return apiFetch<OrderResult>("/orders", {
      method: "POST",
      body,
      idempotencyKey: idempotencyKey(),
    });
  }

  cancelOrder(
    orderId: string,
    market: string,
  ): Promise<{ orderId: string; status: string; releasedMargin: string }> {
    return apiFetch(`/orders/${orderId}`, {
      method: "DELETE",
      body: { market },
      idempotencyKey: idempotencyKey(),
    });
  }

  async getPositions(): Promise<OpenPosition[]> {
    const res = await apiFetch<{ positions: OpenPosition[] }>(
      "/account/positions",
    );
    return res.positions;
  }

  async getOrders(status?: string): Promise<OrderItem[]> {
    const res = await apiFetch<Page<OrderItem>>("/account/orders", {
      params: { limit: 100, status },
    });
    return res.items;
  }

  async getFills(): Promise<Fill[]> {
    const res = await apiFetch<Page<Fill>>("/account/fills", {
      params: { limit: 100 },
    });
    return res.items;
  }

  async getLiquidations(): Promise<LiquidationItem[]> {
    const res = await apiFetch<Page<LiquidationItem>>("/account/liquidations", {
      params: { limit: 100 },
    });
    return res.items;
  }
}
