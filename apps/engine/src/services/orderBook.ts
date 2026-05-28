import type { PayloadType } from "@perpex/types";

export class OrderBook {
  private bids = new Map<number, number>();
  private asks = new Map<number, number>();

  addOrder(payload: PayloadType) {
    return { title: "engine is working" };
  }
}
