import type {
  Asks,
  Bids,
  Fill,
  LimitOrderPayload,
  MarketOrderPayload,
  PayloadType,
} from "@perpex/types";
import { EngineError } from "../utils/engine-error";

export class MathchingEngine {
  matchLimitLong(
    payload: LimitOrderPayload,
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

  matchLimitShort(
    payload: LimitOrderPayload,
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

  matchMarketLong(
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
    const side = payload.side === "LONG" ? asks : bids;
    const sortedPrices = payload.side === "LONG" ? asksPrices : bidsPrices;

    const fills: Fill[] = [];

    while (orderQuantity > 0) {
      const bestPrice = payload.side === "LONG" ? asksPrices[0] : bidsPrices[0];

      if (payload.side === "LONG") {
        if (!bestPrice || bestPrice > worstCasePrice) break;
      } else {
        if (!bestPrice || bestPrice < worstCasePrice) break;
      }

      const priceData =
        payload.side === "LONG" ? asks.get(bestPrice) : bids.get(bestPrice);

      if (!priceData || priceData.openOrders.length === 0) {
        side.delete(bestPrice);
        sortedPrices.splice(0, 1);
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
        side.delete(bestPrice);
        sortedPrices.splice(0, 1);
      }

      orderQuantity -= filledQty;
    }
    const filledQuantity = payload.quantity - orderQuantity;

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
  matchMarketShort() {}
}
