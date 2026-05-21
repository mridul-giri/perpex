import { symbol, type number } from "zod";
import { ApiError } from "../utils/api-error";
import {
  Symbol,
  Side,
  Status,
  Type,
  type OrderBooks,
  type OrderInput,
  type Position,
  type User,
  type Users,
  type Fills,
  type PriceLevel,
  type Asks,
  type Bids,
  type Order,
  type OrderBook,
} from "@perpex/types";

// SOL Price = 100

const orderBook: OrderBooks = {
  SOLUSDT: {
    asks: {
      20: {
        availableQuantity: 6,
        openOrder: [
          { userId: "1", orderId: "101", quantity: 3, filledQuantity: 0 },
          { userId: "2", orderId: "102", quantity: 3, filledQuantity: 0 },
        ],
      },
      10: {
        availableQuantity: 10,
        openOrder: [
          { userId: "3", orderId: "103", quantity: 10, filledQuantity: 0 },
        ],
      },
      30: {
        availableQuantity: 4,
        openOrder: [
          { userId: "4", orderId: "104", quantity: 6, filledQuantity: 0 },
        ],
      },
    },
    bids: {
      9: {
        availableQuantity: 3,
        openOrder: [
          { userId: "5", orderId: "105", quantity: 3, filledQuantity: 0 },
        ],
      },
      6: {
        availableQuantity: 7,
        openOrder: [
          { userId: "6", orderId: "106", quantity: 4, filledQuantity: 0 },
          { userId: "7", orderId: "107", quantity: 3, filledQuantity: 0 },
        ],
      },
      7: {
        availableQuantity: 2,
        openOrder: [
          { userId: "8", orderId: "108", quantity: 2, filledQuantity: 0 },
        ],
      },
    },
    lastTradedPrice: 9,
    indexPrice: 10,
  },
};

const users: Users = [
  {
    userId: "1",
    name: "mridul",
    email: "mridul@gmail.com",
    password: "mridulgiri",
    collateral: { balance: 1000, lockedBalance: 0 },
    positions: [
      {
        symbol: Symbol.SOLUSDT,
        type: Type.LIMIT,
        side: Side.LONG,
        quantity: 2,
        margin: 500,
        liquidationPrice: 80,
        averagePrice: 40,
      },
    ],
    orders: [
      {
        orderId: "1",
        userId: "1",
        symbol: Symbol.SOLUSDT,
        type: Type.LIMIT,
        side: Side.LONG,
        price: 80,
        quantity: 1,
        status: Status.OPEN,
      },
    ],
  },
];

const fills: Fills = [];

export const placeOrder = (orderInput: OrderInput) => {
  const findUser = users.find((u: User) => u.userId === orderInput.userId);
  if (!findUser) throw new ApiError(404, "User not found");

  const entryPrice = orderInput.limitPrice;
  let quantity = orderInput.quantity;
  const leverage = orderInput.leverage;

  const notionalValue = entryPrice * quantity;
  const collateral = notionalValue / leverage;

  const userBalance = findUser.collateral.balance;
  if (userBalance < collateral) throw new ApiError(400, "Insufficient balance");

  findUser.collateral.lockedBalance += collateral; // lock the required margin
  findUser.collateral.balance -= collateral; // subtract required balance from balance

  const newOrder: Order = {
    orderId: crypto.randomUUID(),
    userId: findUser.userId,
    symbol: orderInput.symbol,
    type: orderInput.type,
    side: orderInput.side,
    price: orderInput.limitPrice,
    quantity: orderInput.quantity,
    status: Status.OPEN,
  };

  findUser.orders?.push(newOrder);

  // const maintanenceMargin = notionalValue * 0.1;

  // console.log("[LOCKED BALACNE]", findUser.collateral.lockedBalance);
  // console.log("[BALANCE]", findUser.collateral.balance);

  const market = orderBook[orderInput.symbol]; // SOL, BTC, ETH
  if (!market) throw new ApiError(404, "Market not exists");

  const sortedAsks = sortAsksPrice(market.asks);
  const sortedBids = sortBidsPrice(market.bids);

  // match order book
  switch (orderInput.type) {
    case "LIMIT": {
      //check side LONG or SHORT
      switch (orderInput.side) {
        case "LONG": {
          let asksIndex = 0;
          while (sortedAsks.length > asksIndex) {
            // console.log("sorted asks", sortedAsks);
            const entry = sortedAsks[asksIndex];
            if (!entry) return;

            const [asksKey, asksValue] = entry;

            // perfect match
            if (
              Number(asksKey) <= entryPrice &&
              asksValue.availableQuantity >= quantity
            ) {
              const makerId = asksValue.openOrder[0]?.userId;

              // create fills
              const fill = {
                maker: makerId!,
                taker: orderInput.userId,
                symbol: orderInput.symbol,
                quantity: orderInput.quantity,
                price: Number(asksKey),
              };
              fills.push(fill);

              // update order to filled
              findUser.orders?.find((order) => {
                if (order.orderId === newOrder.orderId) {
                  order.status = Status.FILLED;
                } else {
                  return;
                }
              });

              // create position
              const position: Position = {
                symbol: orderInput.symbol,
                quantity: orderInput.quantity,
                type: orderInput.type,
                side: orderInput.side,
                margin: findUser.collateral.lockedBalance,
                liquidationPrice: 50,
                averagePrice: Number(asksKey),
              };
              findUser.positions?.push(position);

              // delete asks order or update quantity
              if (asksValue.availableQuantity > quantity) {
                asksValue.availableQuantity -= quantity;
                let filledQuantity = asksValue.openOrder[0]?.filledQuantity;
                if (filledQuantity == undefined) return;

                filledQuantity += quantity;
              } else {
                console.log(market.asks);

                delete market.asks[Number(asksKey)];
                console.log(market.asks);
              }

              // return;
            } else if (
              // if available quantity is less than actual quantity, partial fills case
              Number(asksKey) <= entryPrice &&
              asksValue.availableQuantity < quantity
            ) {
              for (const order of asksValue.openOrder) {
                const fill = {
                  maker: order.userId,
                  taker: orderInput.userId,
                  symbol: orderInput.symbol,
                  quantity: order.quantity,
                  price: Number(asksKey),
                };

                fills.push(fill);
              }

              // update order to filled
              findUser.orders?.find((order) => {
                if (order.orderId === newOrder.orderId) {
                  order.status = Status.PARTIAL;
                } else {
                  return;
                }
              });

              // create position
              const position: Position = {
                symbol: orderInput.symbol,
                quantity: orderInput.quantity,
                type: orderInput.type,
                side: orderInput.side,
                margin: findUser.collateral.lockedBalance,
                liquidationPrice: 50,
                averagePrice: entryPrice,
              };
              findUser.positions?.push(position);

              quantity -= asksValue.availableQuantity;

              delete market.asks[Number(asksKey)];
            }
            asksIndex++;
          }

          if (quantity > 0) {
            sitOnBids(
              sortedBids,
              entryPrice,
              orderInput,
              newOrder,
              quantity,
              market,
            );
          }

          break;
        }
        case "SHORT": {
          let bidsIndex = 0;
          while (sortedBids.length > bidsIndex) {
            const entry = sortedBids[bidsIndex];
            if (!entry) return;

            const [bidsKey, bidsValue] = entry;

            if (
              Number(bidsKey) >= entryPrice &&
              bidsValue.availableQuantity >= quantity
            ) {
              const makerId = bidsValue.openOrder[0]?.userId;
              const fill = {
                maker: makerId!,
                taker: orderInput.userId,
                symbol: orderInput.symbol,
                quantity: orderInput.quantity,
                price: Number(bidsKey),
              };
              fills.push(fill);

              // update order to filled
              findUser.orders?.find((order) => {
                if (order.orderId === newOrder.orderId) {
                  order.status = Status.FILLED;
                } else {
                  return;
                }
              });

              const positon: Position = {
                symbol: orderInput.symbol,
                quantity: orderInput.quantity,
                type: orderInput.type,
                side: orderInput.side,
                margin: findUser.collateral.lockedBalance,
                liquidationPrice: 50,
                averagePrice: Number(bidsKey),
              };
              findUser.positions?.push(positon);

              if (bidsValue.availableQuantity > quantity) {
                bidsValue.availableQuantity -= quantity;
                let filledQuantity = bidsValue.openOrder[0]?.filledQuantity;
                if (filledQuantity == undefined) return;

                filledQuantity += quantity;
              } else {
                console.log("mareket bids before", market.bids);

                delete market.bids[Number(bidsKey)];

                console.log("marekt bids after", market.bids);
              }
            } else if (
              Number(bidsKey) >= entryPrice &&
              bidsValue.availableQuantity < quantity
            ) {
              for (const order of bidsValue.openOrder) {
                const fill = {
                  maker: order.userId,
                  taker: orderInput.userId,
                  symbol: orderInput.symbol,
                  quantity: order.quantity,
                  price: Number(bidsKey),
                };

                fills.push(fill);
              }

              findUser.orders?.find((order) => {
                if (order.orderId === newOrder.orderId) {
                  order.status = Status.PARTIAL;
                } else {
                  return;
                }
              });

              const postion: Position = {
                symbol: orderInput.symbol,
                quantity: orderInput.quantity,
                type: orderInput.type,
                side: orderInput.side,
                margin: findUser.collateral.lockedBalance,
                liquidationPrice: 50,
                averagePrice: entryPrice,
              };
              findUser.positions?.push(postion);

              quantity -= bidsValue.availableQuantity;

              delete market.bids[Number(bidsKey)];
            }

            bidsIndex++;
          }

          if (quantity > 0) {
            sitOnAsks(
              sortedAsks,
              entryPrice,
              orderInput,
              newOrder,
              quantity,
              market,
            );
          }
          break;
        }
      }
      break;
    }
    case "MARKET": {
      console.log("market");
      break;
    }
  }
};

export function sortAsksPrice(asks: Asks) {
  return Object.entries(asks).sort(([a], [b]) => Number(a) - Number(b));
}

export function sortBidsPrice(bids: Bids) {
  return Object.entries(bids).sort(([a], [b]) => Number(b) - Number(a));
}

export function sitOnBids(
  sortedBids: any,
  entryPrice: number,
  orderInput: OrderInput,
  newOrder: Order,
  quantity: number,
  market: OrderBook,
) {
  let bidsIndex = 0;

  while (sortedBids.length > bidsIndex) {
    const entry = sortedBids[bidsIndex];
    if (!entry) return;

    const [bidsKey, bidsValue] = entry;

    // if same price already exist in bids
    if (Number(bidsKey) === entryPrice) {
      bidsValue.availableQuantity += quantity;

      bidsValue.openOrder.push({
        userId: orderInput.userId,
        orderId: newOrder.orderId,
        quantity,
        filledQuantity: 0,
      });
      return;
    } else {
      market.bids[entryPrice] = {
        availableQuantity: quantity,
        openOrder: [
          {
            userId: orderInput.userId,
            orderId: newOrder.orderId,
            quantity,
            filledQuantity: 0,
          },
        ],
      };
    }

    bidsIndex++;
  }

  console.log("bids orderbook", market.bids);
}

export function sitOnAsks(
  sortedAsks: any,
  entryPrice: number,
  orderInput: OrderInput,
  newOrder: Order,
  quantity: number,
  market: OrderBook,
) {
  let asksIndex = 0;

  while (sortedAsks.length > asksIndex) {
    const entry = sortedAsks[asksIndex];
    if (!entry) return;

    const [asksKey, asksValue] = entry;

    if (Number(asksKey) === entryPrice) {
      asksValue.availableQuantity += quantity;

      asksValue.openOrder.push({
        userId: orderInput.userId,
        orderId: newOrder.orderId,
        quantity,
        filledQuantity: 0,
      });
      return;
    } else {
      market.asks[entryPrice] = {
        availableQuantity: quantity,
        openOrder: [
          {
            userId: orderInput.userId,
            orderId: newOrder.orderId,
            quantity,
            filledQuantity: 0,
          },
        ],
      };
    }

    asksIndex++;
  }

  console.log("asks orderbook", market.asks);
}
