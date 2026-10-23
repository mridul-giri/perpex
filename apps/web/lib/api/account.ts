import type {
  Balance,
  Fill,
  OpenPosition,
  Order,
  OrderResult,
  OrderStatus,
  PlaceOrderInput,
} from "@/lib/types";
import { apiRequest } from "./client";

const HISTORY_LIMIT = 100;

export const getBalance = () => apiRequest<Balance>("/account/balance");

export const deposit = (amount: string) =>
  apiRequest<Balance>("/account/deposits", {
    method: "POST",
    body: { amount },
    idempotent: true,
  });

export const withdraw = (amount: string) =>
  apiRequest<Balance>("/account/withdrawals", {
    method: "POST",
    body: { amount },
    idempotent: true,
  });

export const placeOrder = (order: PlaceOrderInput) =>
  apiRequest<OrderResult>("/orders", {
    method: "POST",
    body: order,
    idempotent: true,
  });

export const cancelOrder = (orderId: string, market: string) =>
  apiRequest(`/orders/${orderId}`, {
    method: "DELETE",
    body: { market },
    idempotent: true,
  });

export const getOpenPositions = async () => {
  const response = await apiRequest<{ positions: OpenPosition[] }>(
    "/account/positions",
  );
  return response.positions;
};

export const getOrders = async (status?: OrderStatus) => {
  const response = await apiRequest<{ items: Order[] }>("/account/orders", {
    params: { limit: HISTORY_LIMIT, status },
  });
  return response.items;
};

export const getFills = async () => {
  const response = await apiRequest<{ items: Fill[] }>("/account/fills", {
    params: { limit: HISTORY_LIMIT },
  });
  return response.items;
};
