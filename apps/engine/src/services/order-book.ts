import { EngineError } from "../utils/engine-error";
import { validateOrder } from "./validation";
import { UserService } from "./user";
import { MatchingEngine } from "./matching-engine";
import type { Match } from "./matching-engine";
import { BookManager } from "./book-manager";
import type { BookState } from "./book-manager";
import { PositionManager } from "./position-manager";
import { insuranceFund } from "./insurance-fund";
import {
  publishBalanceUpdate,
  publishClosedPosition,
  publishFill,
  publishInsuranceFund,
  publishLiquidation,
  publishOrderCancelled,
  publishOrderCreated,
  publishOrderUpdated,
} from "../events/publish";
import { SCALE, toBigInt, toString } from "../utils/conversion";
import { marginFor } from "../utils/margin";
import { MAX_PRICE, totalSlippageTolerance, Users } from "../store/store";
import type {
  EngineFill,
  EngineMakerFill,
  EnginePayload,
  EnginePosition,
  EngineUser,
  OrderSide,
  OrderStatus,
} from "@perpex/types";

export class OrderBook {
  private book = new BookManager();

  constructor(private readonly marketSlug: string) {}
  private userService = new UserService();
  private matcher = new MatchingEngine();
  private positionManager = new PositionManager();

  async addOrder(payload: EnginePayload) {
    const user = this.userService.getUser(payload.userId);
    if (!user) throw new EngineError(404, "User not found");

    validateOrder(payload);

    return payload.type === "LIMIT"
      ? this.placeLimitOrder(user, payload)
      : this.placeMarketOrder(user, payload);
  }

  private async placeLimitOrder(user: EngineUser, payload: EnginePayload) {
    const limitPrice = payload.price!;
    const { quantity, leverage } = payload;

    const lockedMargin = marginFor(limitPrice, quantity, leverage);
    this.userService.lockCollateral(user, lockedMargin);

    const orderId = crypto.randomUUID();
    await publishOrderCreated(orderId, payload);

    const result = this.matcher.match(payload, orderId, limitPrice, this.book);
    const usedMargin = await this.settleMatches(user, payload, result.matches);

    const restingMargin = marginFor(
      limitPrice,
      result.remainingQuantity,
      leverage,
    );
    const unusedMargin = lockedMargin - usedMargin - restingMargin;
    this.userService.unlockCollateral(user, unusedMargin);
    await publishBalanceUpdate(payload.userId, user.collateral);

    const filledQuantity = quantity - result.remainingQuantity;

    if (result.remainingQuantity > 0n) {
      this.book.placeIntoSide(
        payload.side,
        limitPrice,
        orderId,
        payload.userId,
        result.remainingQuantity,
        filledQuantity,
        restingMargin,
        leverage,
      );
    }

    let status: OrderStatus = "Open";
    if (result.remainingQuantity === 0n) status = "Filled";
    else if (filledQuantity > 0n) status = "PartiallyFilled";

    await publishOrderUpdated({
      orderId,
      userId: payload.userId,
      market: payload.market,
      type: payload.type,
      side: payload.side,
      price: toString(limitPrice),
      quantity: toString(quantity),
      filledQuantity: toString(filledQuantity),
      status,
    });

    return {
      orderId,
      status,
      price: toString(limitPrice),
      quantity: toString(quantity),
      filledQuantity: toString(filledQuantity),
    };
  }

  private async placeMarketOrder(user: EngineUser, payload: EnginePayload) {
    const bestPrice = this.book.bestOppositePrice(payload.side);
    if (bestPrice === undefined) {
      throw new EngineError(404, "No liquidity available");
    }

    const slippage = toBigInt(
      String(payload.slippageTolerance || totalSlippageTolerance),
    );
    const worstPrice =
      payload.side === "LONG"
        ? (bestPrice * (SCALE + slippage)) / SCALE
        : (bestPrice * (SCALE - slippage)) / SCALE;

    const openingQuantity =
      payload.quantity - this.reducingQuantity(user, payload, payload.quantity);
    const lockedMargin = marginFor(
      worstPrice,
      openingQuantity,
      payload.leverage,
    );
    this.userService.lockCollateral(user, lockedMargin);

    const orderId = crypto.randomUUID();
    await publishOrderCreated(orderId, payload);

    const result = this.matcher.match(payload, orderId, worstPrice, this.book);
    const usedMargin = await this.settleMatches(user, payload, result.matches);

    this.userService.unlockCollateral(user, lockedMargin - usedMargin);
    await publishBalanceUpdate(payload.userId, user.collateral);

    const status: OrderStatus =
      result.remainingQuantity === 0n ? "Filled" : "Cancelled";
    const filledQuantity = toString(
      payload.quantity - result.remainingQuantity,
    );

    await publishOrderUpdated({
      orderId,
      userId: payload.userId,
      market: payload.market,
      type: payload.type,
      side: payload.side,
      price: undefined,
      quantity: toString(payload.quantity),
      filledQuantity,
      status,
    });

    return {
      orderId,
      status,
      quantity: toString(payload.quantity),
      filledQuantity,
    };
  }

  async cancelOrder(userId: string, orderId: string) {
    const removed = this.book.removeOrder(orderId, userId);
    if (!removed) throw new EngineError(404, "Order not found");

    const user = this.userService.getUser(userId);
    if (!user) throw new EngineError(404, "User not found");

    this.userService.unlockCollateral(user, removed.margin);
    await publishOrderCancelled(orderId);

    return {
      orderId,
      status: "Cancelled",
      releasedMargin: toString(removed.margin),
    };
  }

  async liquidatePosition(
    user: EngineUser,
    position: EnginePosition,
    markPrice: bigint,
  ) {
    await this.cancelAllOrders(user, position.userId);

    const closingSide: OrderSide = position.side === "LONG" ? "SHORT" : "LONG";

    const payload: EnginePayload = {
      userId: position.userId,
      market: position.market,
      side: closingSide,
      quantity: position.quantity,
      leverage: this.positionManager.effectiveLeverage(position),
      correlationId: undefined,
      type: "MARKET",
      price: undefined,
      slippageTolerance: undefined,
    };

    const orderId = crypto.randomUUID();
    await publishOrderCreated(orderId, payload);

    const worstPrice = closingSide === "LONG" ? MAX_PRICE : 0n;
    const result = this.matcher.match(payload, orderId, worstPrice, this.book);

    for (const { fill, maker } of result.matches) {
      await publishFill(fill);
      await this.settleMakerFill(maker, fill);
    }

    await publishOrderUpdated({
      orderId,
      userId: position.userId,
      market: position.market,
      type: "MARKET",
      side: closingSide,
      price: undefined,
      quantity: toString(position.quantity),
      filledQuantity: toString(position.quantity - result.remainingQuantity),
      status: result.remainingQuantity === 0n ? "Filled" : "Cancelled",
    });

    const bankruptcyPrice =
      this.positionManager.calculateBankruptcyPrice(position);

    if (result.remainingQuantity > 0n) {
      const leftover = await this.autoDeleverage(
        position,
        result.remainingQuantity,
        bankruptcyPrice,
        markPrice,
      );
      if (leftover > 0n) {
        console.log(
          `ADL could not fully close ${position.market} for user ${position.userId}: ${toString(leftover)} had no counterparty`,
        );
      }
    }

    const unfilledValue = bankruptcyPrice * result.remainingQuantity;
    const exitPrice = (result.filledValue + unfilledValue) / position.quantity;

    const pnl = this.positionManager.calculateRealizedPnl(
      position,
      exitPrice,
      position.quantity,
    );
    const loss = -(position.margin + pnl);
    if (loss > 0n) {
      user.collateral.availableBalance += insuranceFund.drawUpTo(
        position.market,
        loss,
      );
      await publishInsuranceFund(
        position.market,
        insuranceFund.getFund(position.market),
      );
    }

    const closed = this.positionManager.closeAtPrice(user, position, exitPrice);

    if (user.collateral.availableBalance < 0n) {
      console.log(
        `insurance fund exhausted; uncovered loss for user ${position.userId}`,
      );
      user.collateral.availableBalance = 0n;
    }

    await publishClosedPosition(closed);
    await publishBalanceUpdate(position.userId, user.collateral);
    await publishLiquidation({
      userId: position.userId,
      market: position.market,
      quantity: toString(position.quantity),
      price: toString(exitPrice),
      liquidationPrice: toString(position.liquidationPrice),
      bankruptcyPrice: toString(bankruptcyPrice),
    });

    return { closed, bankruptcyPrice };
  }

  private async autoDeleverage(
    liquidated: EnginePosition,
    quantity: bigint,
    bankruptcyPrice: bigint,
    markPrice: bigint,
  ) {
    const candidates = this.deleverageCandidates(liquidated, markPrice);
    let remaining = quantity;

    for (const { user, position } of candidates) {
      if (remaining === 0n) break;

      const closeQuantity =
        remaining < position.quantity ? remaining : position.quantity;

      const closed = this.positionManager.closePart(
        user,
        position,
        closeQuantity,
        bankruptcyPrice,
      );
      if (closed) await publishClosedPosition(closed);
      await publishBalanceUpdate(position.userId, user.collateral);

      remaining -= closeQuantity;
    }

    return remaining;
  }

  private deleverageCandidates(liquidated: EnginePosition, markPrice: bigint) {
    const oppositeSide: OrderSide =
      liquidated.side === "LONG" ? "SHORT" : "LONG";
    const candidates: { user: EngineUser; position: EnginePosition }[] = [];

    for (const user of Users.values()) {
      const position = user.positions.get(liquidated.market);
      if (!position || position.side !== oppositeSide) continue;
      candidates.push({ user, position });
    }

    const profitOf = (position: EnginePosition) =>
      this.positionManager.calculateUnrealizedPnl(position, markPrice);

    candidates.sort((a, b) => {
      const difference = profitOf(b.position) - profitOf(a.position);
      return difference > 0n ? 1 : difference < 0n ? -1 : 0;
    });

    return candidates;
  }

  private async cancelAllOrders(user: EngineUser, userId: string) {
    const removed = this.book.removeOrdersOf(userId);

    for (const order of removed) {
      this.userService.unlockCollateral(user, order.margin);
      await publishOrderCancelled(order.orderId);
    }
  }

  private async settleMatches(
    taker: EngineUser,
    payload: EnginePayload,
    matches: Match[],
  ) {
    let usedMargin = 0n;

    for (const { fill, maker } of matches) {
      await publishFill(fill);

      const openingQuantity =
        fill.quantity - this.reducingQuantity(taker, payload, fill.quantity);
      const takerMargin = marginFor(
        fill.price,
        openingQuantity,
        payload.leverage,
      );
      usedMargin += takerMargin;
      const closed = this.positionManager.applyFill(
        taker,
        payload,
        fill,
        takerMargin,
      );
      if (closed) await publishClosedPosition(closed);

      await this.settleMakerFill(maker, fill);
    }

    return usedMargin;
  }

  private reducingQuantity(
    user: EngineUser,
    payload: EnginePayload,
    quantity: bigint,
  ) {
    const position = user.positions.get(payload.market);
    if (!position || position.side === payload.side) return 0n;
    return quantity < position.quantity ? quantity : position.quantity;
  }

  private async settleMakerFill(maker: EngineMakerFill, fill: EngineFill) {
    const market = fill.market;
    const makerUser = this.userService.getUser(maker.makerUserId);
    if (!makerUser) return;

    const makerPayload: EnginePayload = {
      userId: maker.makerUserId,
      market,
      side: maker.makerSide,
      quantity: maker.quantity,
      leverage: maker.makerLeverage,
      correlationId: undefined,
      type: "LIMIT",
      price: maker.price,
      slippageTolerance: undefined,
    };
    const closed = this.positionManager.applyFill(
      makerUser,
      makerPayload,
      fill,
      maker.makerMargin,
    );
    if (closed) await publishClosedPosition(closed);

    await publishBalanceUpdate(maker.makerUserId, makerUser.collateral);

    await publishOrderUpdated({
      orderId: maker.makerOrderId,
      userId: maker.makerUserId,
      market,
      type: "LIMIT",
      side: maker.makerSide,
      price: toString(maker.price),
      quantity: toString(
        maker.makerFilledQuantity + maker.makerRemainingQuantity,
      ),
      filledQuantity: toString(maker.makerFilledQuantity),
      status:
        maker.makerRemainingQuantity === 0n ? "Filled" : "PartiallyFilled",
    });
  }

  setMarkPrice(price: bigint) {
    this.book.setMarkPrice(price);
  }

  getMarkPrice() {
    return this.book.getMarkPrice();
  }

  setIndexPrice(price: bigint) {
    this.book.setIndexPrice(price);
  }

  getIndexPrice() {
    return this.book.getIndexPrice();
  }

  getDepth() {
    return this.book.getDepth();
  }

  exportState() {
    return this.book.exportState();
  }

  importState(state: BookState) {
    this.book.importState(state);
  }
}
