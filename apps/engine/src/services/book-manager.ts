import type { EngineOpenOrder, EngineSide, OrderSide } from "@perpex/types";
import { toString } from "../utils/conversion";

export interface BookState {
  bids: Map<bigint, EngineSide>;
  asks: Map<bigint, EngineSide>;
  bidsPrices: bigint[];
  asksPrices: bigint[];
  markPrice: bigint | undefined;
  indexPrice: bigint | undefined;
}

export interface Depth {
  bids: [string, string][];
  asks: [string, string][];
}

export class BookManager {
  private bids: Map<bigint, EngineSide> = new Map();
  private asks: Map<bigint, EngineSide> = new Map();
  private bidsPrices: bigint[] = [];
  private asksPrices: bigint[] = [];
  private markPrice: bigint | undefined;
  private indexPrice: bigint | undefined;

  bestOppositePrice(takerSide: OrderSide): bigint | undefined {
    return takerSide === "LONG" ? this.asksPrices[0] : this.bidsPrices[0];
  }

  oppositeLevel(takerSide: OrderSide, price: bigint) {
    const levels = takerSide === "LONG" ? this.asks : this.bids;
    return levels.get(price);
  }

  removeBestOppositeLevel(takerSide: OrderSide) {
    const levels = takerSide === "LONG" ? this.asks : this.bids;
    const prices = takerSide === "LONG" ? this.asksPrices : this.bidsPrices;

    const bestPrice = prices.shift();
    if (bestPrice !== undefined) levels.delete(bestPrice);
  }

  placeIntoSide(
    side: OrderSide,
    price: bigint,
    orderId: string,
    userId: string,
    quantity: bigint,
    filledQuantity: bigint,
    margin: bigint,
    leverage: number,
  ) {
    const levels = side === "LONG" ? this.bids : this.asks;
    const level = levels.get(price);

    const newOrder: EngineOpenOrder = {
      userId,
      orderId,
      quantity,
      filledQuantity,
      margin,
      leverage,
      createdAt: Date.now(),
    };

    if (level) {
      level.openOrders.push(newOrder);
    } else {
      levels.set(price, { openOrders: [newOrder] });
    }

    side === "LONG" ? this.sortBids() : this.sortAsks();
  }

  removeOrder(orderId: string, userId: string) {
    for (const side of ["LONG", "SHORT"] as const) {
      const levels = side === "LONG" ? this.bids : this.asks;

      for (const [price, level] of levels.entries()) {
        const index = level.openOrders.findIndex(
          (order) => order.orderId === orderId && order.userId === userId,
        );
        if (index === -1) continue;

        const [removed] = level.openOrders.splice(index, 1);
        if (level.openOrders.length === 0) this.deleteLevel(side, price);

        return removed ?? null;
      }
    }

    return null;
  }

  removeOrdersOf(userId: string): EngineOpenOrder[] {
    const userOrderIds: string[] = [];

    for (const levels of [this.bids, this.asks]) {
      for (const level of levels.values()) {
        for (const order of level.openOrders) {
          if (order.userId === userId) userOrderIds.push(order.orderId);
        }
      }
    }

    const removed: EngineOpenOrder[] = [];
    for (const orderId of userOrderIds) {
      const order = this.removeOrder(orderId, userId);
      if (order) removed.push(order);
    }
    return removed;
  }

  private deleteLevel(side: OrderSide, price: bigint) {
    const levels = side === "LONG" ? this.bids : this.asks;
    const prices = side === "LONG" ? this.bidsPrices : this.asksPrices;

    levels.delete(price);
    const priceIndex = prices.indexOf(price);
    if (priceIndex !== -1) prices.splice(priceIndex, 1);
  }

  private sortBids() {
    this.bidsPrices = [...this.bids.keys()].sort((a, b) =>
      a < b ? 1 : a > b ? -1 : 0,
    );
  }

  private sortAsks() {
    this.asksPrices = [...this.asks.keys()].sort((a, b) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
  }

  setMarkPrice(price: bigint) {
    this.markPrice = price;
  }

  getMarkPrice() {
    return this.markPrice;
  }

  setIndexPrice(price: bigint) {
    this.indexPrice = price;
  }

  getIndexPrice() {
    return this.indexPrice;
  }

  getDepth(): Depth {
    return {
      bids: this.pricesToLevels(this.bidsPrices, this.bids),
      asks: this.pricesToLevels(this.asksPrices, this.asks),
    };
  }

  private pricesToLevels(
    prices: bigint[],
    levels: Map<bigint, EngineSide>,
  ): [string, string][] {
    const depth: [string, string][] = [];

    for (const price of prices) {
      const level = levels.get(price);
      if (!level) continue;

      const quantity = level.openOrders.reduce(
        (total, order) => total + order.quantity,
        0n,
      );

      depth.push([toString(price), toString(quantity)]);
    }

    return depth;
  }

  exportState(): BookState {
    return {
      bids: this.bids,
      asks: this.asks,
      bidsPrices: this.bidsPrices,
      asksPrices: this.asksPrices,
      markPrice: this.markPrice,
      indexPrice: this.indexPrice,
    };
  }

  importState(state: BookState) {
    this.bids = state.bids;
    this.asks = state.asks;
    this.bidsPrices = state.bidsPrices;
    this.asksPrices = state.asksPrices;
    this.markPrice = state.markPrice;
    this.indexPrice = state.indexPrice;
  }
}
