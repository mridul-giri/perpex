import type { User } from "@perpex/types";

export const Users = new Map<string, User>();
export const MarketPrice = 100;

Users.set("u1", {
  collateral: { availableBalance: 100, lockedBalance: 0 },
  orders: [
    // {
    //   orderId: "o1",
    //   userId: "u1",
    //   market: "SOLUSDT",
    //   type: "LIMIT",
    //   side: "LONG",
    //   price: 101,
    //   quantity: 10,
    //   filledQuantity: 0,
    //   status: "Open",
    // },
  ],
});
