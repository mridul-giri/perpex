import type { Asks, Bids, PayloadType } from "@perpex/types";

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

  placeIntoBids(
    payload: PayloadType,
    orderId: string,
    quantity: number,
    filledQuantity: number,
  ) {
    this.placeIntoSide(this.bids, payload, orderId, quantity, filledQuantity);
    this.sortBids();
  }

  placeIntoAsks(
    payload: PayloadType,
    orderId: string,
    quantity: number,
    filledQuantity: number,
  ) {
    this.placeIntoSide(this.asks, payload, orderId, quantity, filledQuantity);
    this.sortAsks();
  }

  private placeIntoSide(
    side: Map<number, Bids | Asks>,
    payload: PayloadType,
    orderId: string,
    quantity: number,
    filledQuantity: number,
  ) {
    const existing = side.get(payload.price);

    const newOrder = {
      userId: payload.userId,
      orderId,
      quantity,
      filledQuantity,
      createdAt: Date.now(),
    };

    if (!existing) {
      side.set(payload.price, {
        openOrders: [newOrder],
      });
    } else {
      existing.openOrders.push(newOrder);
    }
  }

  private sortBids() {
    this.bidsPrices = [...this.bids.keys()].sort((a, b) => b - a);
  }

  private sortAsks() {
    this.asksPrices = [...this.asks.keys()].sort((a, b) => a - b);
  }

  addSeedData() {
    this.bids.set(6, {
      openOrders: [
        {
          userId: "5",
          orderId: "105",
          quantity: 4,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
        {
          userId: "6",
          orderId: "106",
          quantity: 3,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
      ],
    });
    this.bids.set(9, {
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
          quantity: 2,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
      ],
    });
    this.bids.set(7, {
      openOrders: [
        {
          userId: "8",
          orderId: "108",
          quantity: 2,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
      ],
    });
    this.asks.set(20, {
      openOrders: [
        {
          userId: "1",
          orderId: "101",
          quantity: 3,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
        {
          userId: "2",
          orderId: "102",
          quantity: 3,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
      ],
    });
    this.asks.set(10, {
      openOrders: [
        {
          userId: "3",
          orderId: "103",
          quantity: 5,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
        {
          userId: "9",
          orderId: "109",
          quantity: 4,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
      ],
    });
    this.asks.set(30, {
      openOrders: [
        {
          userId: "4",
          orderId: "104",
          quantity: 6,
          filledQuantity: 0,
          createdAt: Date.now(),
        },
      ],
    });

    this.sortBids();
    this.sortAsks();
  }
}
