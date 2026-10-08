import type { OrderSide } from "@perpex/types";
import type { EngineSide } from "@perpex/types";
import { toBigInt } from "../utils/conversion";

export class BookManager {
  private bids: Map<bigint, EngineSide> = new Map();
  private asks: Map<bigint, EngineSide> = new Map();
  bidsPrices: bigint[] = [];
  asksPrices: bigint[] = [];

  getAsks() {
    return this.asks;
  }

  getBids() {
    return this.bids;
  }

  placeIntoSide(
    side: OrderSide,
    price: bigint,
    orderId: string,
    userId: string,
    quantity: bigint,
    filledQuantity: bigint,
  ) {
    const existing =
      side === "LONG" ? this.bids.get(price) : this.asks.get(price);
    const updateSide = side === "LONG" ? this.bids : this.asks;

    const newOrder = {
      userId,
      orderId,
      quantity,
      filledQuantity,
      createdAt: Date.now(),
    };

    if (!existing) {
      updateSide.set(price, {
        openOrders: [newOrder],
      });
    } else {
      existing.openOrders.push(newOrder);
    }

    side === "LONG" ? this.sortBids() : this.sortAsks();
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

  addSeedData() {
    this.bids.set(toBigInt("95"), {
      openOrders: [
        {
          userId: "5",
          orderId: "105",
          quantity: toBigInt("1"),
          filledQuantity: 0n,
          createdAt: Date.now(),
        },
        {
          userId: "6",
          orderId: "106",
          quantity: toBigInt("1"),
          filledQuantity: 0n,
          createdAt: Date.now(),
        },
      ],
    });
    this.bids.set(toBigInt("100"), {
      openOrders: [
        {
          userId: "7",
          orderId: "107",
          quantity: toBigInt("1"),
          filledQuantity: 0n,
          createdAt: Date.now(),
        },
        {
          userId: "10",
          orderId: "110",
          quantity: toBigInt("2"),
          filledQuantity: 0n,
          createdAt: Date.now(),
        },
      ],
    });
    this.asks.set(toBigInt("101"), {
      openOrders: [
        {
          userId: "1",
          orderId: "101",
          quantity: toBigInt("1"),
          filledQuantity: 0n,
          createdAt: Date.now(),
        },
      ],
    });
    this.asks.set(toBigInt("100"), {
      openOrders: [
        {
          userId: "31",
          orderId: "103",
          quantity: toBigInt("2"),
          filledQuantity: 0n,
          createdAt: Date.now(),
        },
        {
          userId: "9",
          orderId: "109",
          quantity: toBigInt("1"),
          filledQuantity: 0n,
          createdAt: Date.now(),
        },
      ],
    });
    this.asks.set(toBigInt("104"), {
      openOrders: [
        {
          userId: "4",
          orderId: "104",
          quantity: toBigInt("2"),
          filledQuantity: 0n,
          createdAt: Date.now(),
        },
      ],
    });

    this.sortBids();
    this.sortAsks();
  }
}
