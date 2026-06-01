import type { User } from "@perpex/types";

export const Users = new Map<string, User>();

// Users.set("1", {
//   collateral: { availableBalance: 500, lockedBalance: 0 },
//   orders: [
//     {
//       orderId: "1",
//       userId: "1",
//       market: "SOLUSDT",
//       type: "LIMIT",
//       side: "LONG",
//       price: 100,
//       quantity: 2,
//       filledQuantity: 0,
//       status: "Open",
//     },
//   ],
// });
