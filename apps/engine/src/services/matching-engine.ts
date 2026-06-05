import type { Asks, Bids, Fill, PayloadType } from "@perpex/types";

export class MathchingEngine {
  matchLong(
    payload: PayloadType,
    orderId: string,
    asks: Map<number, Asks>,
    asksPrices: number[],
    lockedCollateral: number,
  ) {
    let orderQuantity = payload.quantity;
    let totalFilledValue = 0;
    const fills: Fill[] = [];

    while (orderQuantity > 0) {
      const bestPrice = asksPrices[0];
      if (!bestPrice || bestPrice > payload.price) break;

      const askPriceData = asks.get(bestPrice);
      if (!askPriceData || askPriceData.openOrders.length === 0) {
        asks.delete(bestPrice);
        asksPrices.splice(0, 1);
        continue;
      }

      const openOrder = askPriceData.openOrders[0];
      if (!openOrder || openOrder?.userId === payload.userId) {
        break; // prevent from self trade
      }

      const filledQty = Math.min(orderQuantity, openOrder.quantity);

      fills.push({
        makerUserId: openOrder.userId,
        takerUserId: payload.userId,
        makerOrderId: openOrder.orderId,
        takerOrderId: orderId,
        market: payload.market,
        quantity: filledQty,
        price: bestPrice,
        takerSide: payload.side,
      });

      totalFilledValue += bestPrice * filledQty;

      openOrder.quantity -= filledQty;
      openOrder.filledQuantity += filledQty;

      if (openOrder.quantity <= 0) {
        askPriceData.openOrders.splice(0, 1);
      }

      if (askPriceData.openOrders.length === 0) {
        asks.delete(bestPrice);
        asksPrices.splice(0, 1);
      }

      orderQuantity -= filledQty;
    }
    const filledQuantity = payload.quantity - orderQuantity;

    let status = null;

    if (orderQuantity === 0) {
      status = "Filled";
    } else if (filledQuantity > 0) {
      status = "PartiallyFilled";
    } else {
      status = "Open";
    }

    const actualCollateralUsed = totalFilledValue / payload.leverage;
    const remainingCollateral =
      (payload.price * orderQuantity) / payload.leverage;
    const surplus =
      lockedCollateral - actualCollateralUsed - remainingCollateral;

    return {
      fills,
      remainingQuantity: orderQuantity,
      totalFilledValue,
      surplus,
      status,
    };
  }

  matchShort(
    payload: PayloadType,
    bidsPrices: number[],
    bids: Map<number, Bids>,
    orderId: string,
    lockedCollateral: number,
  ) {
    let orderQuantity = payload.quantity;
    let totalFilledValue = 0;
    const fills: Fill[] = [];

    while (orderQuantity > 0) {
      const bestPrice = bidsPrices[0];
      if (!bestPrice || bestPrice < payload.price) break;

      const bidsPriceData = bids.get(bestPrice);
      if (!bidsPriceData || bidsPriceData.openOrders.length === 0) {
        bids.delete(bestPrice);
        bidsPrices.splice(0, 1);
        continue;
      }

      const openOrder = bidsPriceData.openOrders[0];
      if (!openOrder || openOrder.userId === payload.userId) {
        break; // prvent from self trade
      }

      const filledQty = Math.min(orderQuantity, openOrder.quantity);

      fills.push({
        makerUserId: openOrder.userId,
        takerUserId: payload.userId,
        makerOrderId: openOrder.orderId,
        takerOrderId: orderId,
        price: bestPrice,
        quantity: filledQty,
        market: payload.market,
        takerSide: payload.side,
      });

      totalFilledValue += bestPrice * filledQty;

      openOrder.quantity -= filledQty;
      openOrder.filledQuantity += filledQty;

      if (openOrder.quantity <= 0) {
        bidsPriceData.openOrders.splice(0, 1);
      }

      if (bidsPriceData.openOrders.length === 0) {
        bids.delete(bestPrice);
        bidsPrices.splice(0, 1);
      }

      orderQuantity -= filledQty;
    }
    const filledQuantity = payload.quantity - orderQuantity;

    let status = null;

    if (orderQuantity === 0) {
      status = "Filled";
    } else if (filledQuantity > 0) {
      status = "PartiallyFilled";
    } else {
      status = "Open";
    }

    const actualCollateralUsed = totalFilledValue / payload.leverage;
    const remainingCollateral =
      (payload.price * orderQuantity) / payload.leverage;
    const surplus =
      lockedCollateral - actualCollateralUsed - remainingCollateral;

    return {
      fills,
      remainingQuantity: orderQuantity,
      totalFilledValue,
      surplus,
      status,
    };
  }
}
