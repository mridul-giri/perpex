"use client";

import { useCallback, useRef, useState } from "react";
import { getFills, getOpenPositions, getOrders } from "@/lib/api/account";
import type { Fill, OpenPosition, Order } from "@/lib/types";
import { usePolling } from "./use-polling";

const POLL_MS = 5000;

export function useAccountData() {
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [fills, setFills] = useState<Fill[]>([]);
  const [loaded, setLoaded] = useState(false);
  const latestRequest = useRef(0);

  const reload = useCallback(async () => {
    const request = ++latestRequest.current;
    const [positionsResult, openResult, historyResult, fillsResult] =
      await Promise.allSettled([
        getOpenPositions(),
        getOrders("Open"),
        getOrders(),
        getFills(),
      ]);
    if (request !== latestRequest.current) return;

    if (positionsResult.status === "fulfilled") {
      setPositions(positionsResult.value);
    }
    if (openResult.status === "fulfilled") setOpenOrders(openResult.value);
    if (historyResult.status === "fulfilled") {
      setOrderHistory(historyResult.value);
    }
    if (fillsResult.status === "fulfilled") setFills(fillsResult.value);
    setLoaded(true);
  }, []);

  usePolling(reload, POLL_MS);

  return { positions, openOrders, orderHistory, fills, loaded, reload };
}
