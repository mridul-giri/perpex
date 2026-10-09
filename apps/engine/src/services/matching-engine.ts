import type {
  EngineFill,
  EngineMakerFill,
  EnginePayload,
  EngineSide,
  OrderStatus,
} from "@perpex/types";
import { SCALE } from "../utils/conversion";

export class MathchingEngine {
  matchLimitOrder(
    payload: EnginePayload,
    entryPrice: bigint,
    orderId: string,
    asks: Map<bigint, EngineSide>,
    bids: Map<bigint, EngineSide>,
    asksPrices: bigint[],
    bidsPrices: bigint[],
    lockedCollateral: bigint,
  ) {
    let orderQuantity = payload.quantity;
    let totalFilledValue = 0n;
    let usedCollateral = 0n;
    const fills: EngineFill[] = [];
    const makerFills: EngineMakerFill[] = [];

    const oppositeSide = payload.side === "LONG" ? asks : bids;
    const sortedPrice = payload.side === "LONG" ? asksPrices : bidsPrices;
    const leverage = BigInt(payload.leverage);

    while (orderQuantity > 0n) {
      const bestPrice = payload.side === "LONG" ? asksPrices[0] : bidsPrices[0];

      if (!bestPrice) break;

      if (payload.side === "LONG" && bestPrice > entryPrice) break;
      if (payload.side === "SHORT" && bestPrice < entryPrice) break;

      const priceData = oppositeSide.get(bestPrice);

      if (!priceData || priceData.openOrders.length === 0) {
        oppositeSide.delete(bestPrice);
        sortedPrice.splice(0, 1);
        continue;
      }

      const openOrder = priceData.openOrders[0];
      if (!openOrder) break;

      const filledQty =
        orderQuantity < openOrder.quantity ? orderQuantity : openOrder.quantity;

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
      usedCollateral += (bestPrice * filledQty) / (SCALE * leverage);

      const consumedMargin =
        (openOrder.margin * filledQty) / openOrder.quantity;

      makerFills.push({
        makerUserId: openOrder.userId,
        makerOrderId: openOrder.orderId,
        makerSide: payload.side === "LONG" ? "SHORT" : "LONG",
        makerLeverage: openOrder.leverage,
        makerMargin: consumedMargin,
        makerFilledQuantity: openOrder.filledQuantity + filledQty,
        makerRemainingQuantity: openOrder.quantity - filledQty,
        quantity: filledQty,
        price: bestPrice,
      });

      openOrder.quantity -= filledQty;
      openOrder.filledQuantity += filledQty;
      openOrder.margin -= consumedMargin;

      if (openOrder.quantity <= 0n) {
        priceData.openOrders.splice(0, 1);
      }

      if (priceData.openOrders.length === 0) {
        oppositeSide.delete(bestPrice);
        sortedPrice.splice(0, 1);
      }

      orderQuantity -= filledQty;
    }
    const filledQuantity = payload.quantity - orderQuantity;

    let status: OrderStatus = "Open";

    if (orderQuantity === 0n) {
      status = "Filled";
    } else if (filledQuantity > 0n) {
      status = "PartiallyFilled";
    } else {
      status = "Open";
    }

    const actualCollateralUsed = usedCollateral;
    const remainingCollateral =
      (entryPrice * orderQuantity) / (SCALE * leverage);
    const surplus =
      lockedCollateral - actualCollateralUsed - remainingCollateral;

    return {
      fills,
      makerFills,
      remainingQuantity: orderQuantity,
      totalFilledValue,
      surplus,
      actualCollateralUsed,
      status,
    };
  }

  matchMarketOrder(
    payload: EnginePayload,
    orderId: string,
    asksPrices: bigint[],
    bidsPrices: bigint[],
    asks: Map<bigint, EngineSide>,
    bids: Map<bigint, EngineSide>,
    lockedCollateral: bigint,
    worstCasePrice: bigint,
  ) {
    let orderQuantity = payload.quantity;
    let totalFilledValue = 0n;
    let usedCollateral = 0n;
    const fills: EngineFill[] = [];
    const makerFills: EngineMakerFill[] = [];

    const oppositeSide = payload.side === "LONG" ? asks : bids;
    const sortedPrice = payload.side === "LONG" ? asksPrices : bidsPrices;
    const leverage = BigInt(payload.leverage);

    while (orderQuantity > 0n) {
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
      if (!openOrder) break;

      const filledQty =
        orderQuantity < openOrder.quantity ? orderQuantity : openOrder.quantity;

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
      usedCollateral += (bestPrice * filledQty) / (SCALE * leverage);

      const consumedMargin =
        (openOrder.margin * filledQty) / openOrder.quantity;

      makerFills.push({
        makerUserId: openOrder.userId,
        makerOrderId: openOrder.orderId,
        makerSide: payload.side === "LONG" ? "SHORT" : "LONG",
        makerLeverage: openOrder.leverage,
        makerMargin: consumedMargin,
        makerFilledQuantity: openOrder.filledQuantity + filledQty,
        makerRemainingQuantity: openOrder.quantity - filledQty,
        quantity: filledQty,
        price: bestPrice,
      });

      openOrder.quantity -= filledQty;
      openOrder.filledQuantity += filledQty;
      openOrder.margin -= consumedMargin;

      if (openOrder.quantity <= 0n) {
        priceData.openOrders.splice(0, 1);
      }

      if (priceData.openOrders.length === 0) {
        oppositeSide.delete(bestPrice);
        sortedPrice.splice(0, 1);
      }

      orderQuantity -= filledQty;
    }

    let status: OrderStatus = "Open";

    if (orderQuantity === 0n) {
      status = "Filled";
    } else {
      status = "Cancelled";
    }

    const actualCollateralUsed = usedCollateral;
    const surplus = lockedCollateral - actualCollateralUsed;

    return {
      fills,
      makerFills,
      remainingQuantity: orderQuantity,
      totalFilledValue,
      surplus,
      actualCollateralUsed,
      status,
    };
  }
}
