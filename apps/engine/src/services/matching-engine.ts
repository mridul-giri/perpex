import type {
  Asks,
  Bids,
  Fill,
  LimitOrderPayload,
  MarketOrderPayload,
  PayloadType,
} from "@perpex/types";

export class MathchingEngine {
  matchLimitOrder(
    payload: LimitOrderPayload,
    orderId: string,
    asks: Map<number, Asks>,
    bids: Map<number, Bids>,
    asksPrices: number[],
    bidsPrices: number[],
    lockedCollateral: number,
  ) {
    let orderQuantity = payload.quantity;
    let totalFilledValue = 0;
    const fills: Fill[] = [];

    const oppositeSide = payload.side === "LONG" ? asks : bids;
    const sortedPrice = payload.side === "LONG" ? asksPrices : bidsPrices;

    while (orderQuantity > 0) {
      const bestPrice = payload.side === "LONG" ? asksPrices[0] : bidsPrices[0];

      if (!bestPrice) break;

      if (payload.side === "LONG" && bestPrice > payload.price) break;
      if (payload.side === "SHORT" && bestPrice < payload.price) break;

      const priceData = oppositeSide.get(bestPrice);

      if (!priceData || priceData.openOrders.length === 0) {
        oppositeSide.delete(bestPrice);
        sortedPrice.splice(0, 1);
        continue;
      }

      const openOrder = priceData.openOrders[0];
      if (!openOrder || openOrder?.userId === payload.userId) {
        break; //TODO: need to change this
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
        priceData.openOrders.splice(0, 1);
      }

      if (priceData.openOrders.length === 0) {
        oppositeSide.delete(bestPrice);
        sortedPrice.splice(0, 1);
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

  matchMarketOrder(
    payload: MarketOrderPayload,
    orderId: string,
    asksPrices: number[],
    bidsPrices: number[],
    asks: Map<number, Asks>,
    bids: Map<number, Bids>,
    lockedCollateral: number,
    worstCasePrice: number,
  ) {
    let orderQuantity = payload.quantity;
    let totalFilledValue = 0;
    const fills: Fill[] = [];

    const oppositeSide = payload.side === "LONG" ? asks : bids;
    const sortedPrice = payload.side === "LONG" ? asksPrices : bidsPrices;

    while (orderQuantity > 0) {
      const bestPrice = payload.side === "LONG" ? asksPrices[0] : bidsPrices[0];

      if (!bestPrice) break;

      if (payload.side === "LONG" && bestPrice > worstCasePrice) break;
      if (payload.side === "SHORT" && bestPrice < worstCasePrice) break;

      const priceData =
        payload.side === "LONG" ? asks.get(bestPrice) : bids.get(bestPrice);

      if (!priceData || priceData.openOrders.length === 0) {
        oppositeSide.delete(bestPrice);
        sortedPrice.splice(0, 1);
        continue;
      }

      const openOrder = priceData.openOrders[0];
      if (!openOrder || openOrder.userId === payload.userId) {
        break; //TODO: need to change this
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
        priceData.openOrders.splice(0, 1);
      }

      if (priceData.openOrders.length === 0) {
        oppositeSide.delete(bestPrice);
        sortedPrice.splice(0, 1);
      }

      orderQuantity -= filledQty;
    }

    let status = null;

    if (orderQuantity === 0) {
      status = "Filled";
    } else {
      status = "Cancelled";
    }

    const actualCollateralUsed = totalFilledValue / payload.leverage;
    const surplus = lockedCollateral - actualCollateralUsed;

    return {
      fills,
      remainingQuantity: orderQuantity,
      totalFilledValue,
      surplus,
      status,
    };
  }
}
