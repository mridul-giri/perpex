import type { Asks, Bids, OrderSide, PayloadType } from "@perpex/types";

export class BookManager {
  private bids: Map<number, Bids> = new Map();
  private asks: Map<number, Asks> = new Map();
  bidsPrices: number[] = [];
  asksPrices: number[] = [];

  getAsks() {
    return this.asks;
  }

  getBids() {
    return this.bids;
  }

  placeIntoSide(
    side: OrderSide,
    price: number,
    userId: string,
    orderId: string,
    quantity: number,
    filledQuantity: number,
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
    this.bidsPrices = [...this.bids.keys()].sort((a, b) => b - a);
  }

  private sortAsks() {
    this.asksPrices = [...this.asks.keys()].sort((a, b) => a - b);
  }

  addSeedData() {
    this.bids.set(95, {
      openOrders: [
        {
          userId: "5",
          orderId: "105",
          quantity: 1,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
        {
          userId: "6",
          orderId: "106",
          quantity: 1,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
      ],
    });
    this.bids.set(101, {
      openOrders: [
        {
          userId: "7",
          orderId: "107",
          quantity: 1,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
        {
          userId: "10",
          orderId: "110",
          quantity: 1,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
      ],
    });
    this.bids.set(102, {
      openOrders: [
        {
          userId: "8",
          orderId: "108",
          quantity: 1,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
      ],
    });
    this.asks.set(101, {
      openOrders: [
        {
          userId: "1",
          orderId: "101",
          quantity: 1,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
        // {
        //   userId: "2",
        //   orderId: "102",
        //   quantity: 1,
        //   filledQuantity: 0,
        //   createdAt: Date.now(),
        // },
      ],
    });
    this.asks.set(100, {
      openOrders: [
        {
          userId: "31",
          orderId: "103",
          quantity: 1,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
        {
          userId: "9",
          orderId: "109",
          quantity: 1,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
      ],
    });
    this.asks.set(104, {
      openOrders: [
        {
          userId: "4",
          orderId: "104",
          quantity: 2,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
      ],
    });

    this.sortBids();
    this.sortAsks();
  }
}
