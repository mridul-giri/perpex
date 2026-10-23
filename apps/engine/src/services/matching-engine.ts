import type { EngineFill, EngineMakerFill, EnginePayload } from "@perpex/types";
import type { BookManager } from "./book-manager";

export interface Match {
  fill: EngineFill;
  maker: EngineMakerFill;
}

export interface MatchResult {
  matches: Match[];
  remainingQuantity: bigint;
  filledValue: bigint;
}

export class MatchingEngine {
  match(
    taker: EnginePayload,
    takerOrderId: string,
    worstPrice: bigint,
    book: BookManager,
  ): MatchResult {
    let remainingQuantity = taker.quantity;
    let filledValue = 0n;
    const matches: Match[] = [];

    while (remainingQuantity > 0n) {
      const bestPrice = book.bestOppositePrice(taker.side);
      if (bestPrice === undefined) break;

      const priceIsWorse =
        taker.side === "LONG" ? bestPrice > worstPrice : bestPrice < worstPrice;
      if (priceIsWorse) break;

      const level = book.oppositeLevel(taker.side, bestPrice);
      const makerOrder = level?.openOrders[0];
      if (!level || !makerOrder) {
        book.removeBestOppositeLevel(taker.side);
        continue;
      }

      const filledQuantity =
        remainingQuantity < makerOrder.quantity
          ? remainingQuantity
          : makerOrder.quantity;

      const makerMargin =
        (makerOrder.margin * filledQuantity) / makerOrder.quantity;

      matches.push({
        fill: {
          makerUserId: makerOrder.userId,
          takerUserId: taker.userId,
          makerOrderId: makerOrder.orderId,
          takerOrderId,
          market: taker.market,
          quantity: filledQuantity,
          price: bestPrice,
          takerSide: taker.side,
        },
        maker: {
          makerUserId: makerOrder.userId,
          makerOrderId: makerOrder.orderId,
          makerSide: taker.side === "LONG" ? "SHORT" : "LONG",
          makerLeverage: makerOrder.leverage,
          makerMargin,
          makerFilledQuantity: makerOrder.filledQuantity + filledQuantity,
          makerRemainingQuantity: makerOrder.quantity - filledQuantity,
          quantity: filledQuantity,
          price: bestPrice,
        },
      });

      filledValue += bestPrice * filledQuantity;

      makerOrder.quantity -= filledQuantity;
      makerOrder.filledQuantity += filledQuantity;
      makerOrder.margin -= makerMargin;
      remainingQuantity -= filledQuantity;

      if (makerOrder.quantity <= 0n) level.openOrders.shift();
      if (level.openOrders.length === 0) {
        book.removeBestOppositeLevel(taker.side);
      }
    }

    return { matches, remainingQuantity, filledValue };
  }
}
