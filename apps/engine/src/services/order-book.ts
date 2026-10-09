import { publishToStream } from "@perpex/redis";
import { config } from "@perpex/config";
import { EngineError } from "../utils/engine-error";
import { validateOrder } from "./validation";
import { UserService } from "./user";
import { MathchingEngine } from "./matching-engine";
import { BookManager } from "./book-manager";
import { PositionManager } from "./position-manager";
import { insuranceFund } from "./insurance-fund";
import { publishLiquidation } from "../commands/publish";
import { SCALE, toBigInt, toString } from "../utils/conversion";
import { MAX_PRICE, totalSlippageTolerance } from "../store/store";
import type {
  EngineClosedPosition,
  EngineFill,
  EngineMakerFill,
  EnginePayload,
  EnginePosition,
  EngineUser,
  Order,
  OrderSide,
} from "@perpex/types";

export class OrderBook {
  private book = new BookManager();

  constructor(
    private userService: UserService,
    private matcher: MathchingEngine,
    private positionManager: PositionManager,
  ) {}

  async addOrder(payload: EnginePayload) {
    switch (payload.type) {
      case "LIMIT": {
        return this.handleLimitOrder(payload);
      }
      case "MARKET": {
        return this.handleMarketOrder(payload);
      }
    }
  }

  private async handleLimitOrder(payload: EnginePayload) {
    const user = this.userService.getUser(payload.userId);
    if (!user) throw new EngineError(404, "User not found");

    validateOrder(payload);

    const entryPrice = payload.price!;
    const { quantity, leverage } = payload;

    const lockedCollateral = await this.calculateCollateral(
      entryPrice,
      quantity,
      leverage,
    );

    this.userService.lockCollateral(user, lockedCollateral);

    console.log("Locked-collateral", user.collateral);

    const orderId = crypto.randomUUID();
    await this.publishOrderCreated(orderId, payload);

    const result = this.matcher.matchLimitOrder(
      payload,
      entryPrice,
      orderId,
      this.book.getAsks(),
      this.book.getBids(),
      this.book.asksPrices,
      this.book.bidsPrices,
      lockedCollateral,
    );
    console.log("[Limit-Result]:", result);

    for (let i = 0; i < result.fills.length; i++) {
      const fill = result.fills[i]!;
      const makerFill = result.makerFills[i]!;

      await this.publishFill(fill);

      const takerClosed = this.positionManager.applyFill(
        user,
        payload,
        fill,
        this.fillMargin(fill, payload.leverage),
      );
      if (takerClosed) await this.publishClosedPosition(takerClosed);

      await this.handleMakerFill(makerFill, fill);
    }

    this.userService.releaseCollateral(user, result.surplus);
    await this.publishBalanceUpdate(payload.userId, user);

    console.log("After-release-outer", user.collateral);

    if (result.remainingQuantity > 0n) {
      const filledOrder = payload.quantity - result.remainingQuantity;
      const remainingMargin =
        (entryPrice * result.remainingQuantity) / (SCALE * BigInt(leverage));

      this.book.placeIntoSide(
        payload.side,
        entryPrice,
        orderId,
        payload.userId,
        result.remainingQuantity,
        filledOrder,
        remainingMargin,
        leverage,
      );
    }

    console.log("[Limit-Asks]", this.book.getAsks());
    console.log("[Limit-Bids]", this.book.getBids());

    await this.publishOrderUpdated({
      orderId,
      userId: payload.userId,
      market: payload.market,
      type: payload.type,
      side: payload.side,
      price: payload.price !== undefined ? toString(payload.price) : undefined,
      quantity: toString(payload.quantity),
      filledQuantity: toString(payload.quantity - result.remainingQuantity),
      status: result.status,
    });

    return {
      orderId,
      status: result.status,
      price: entryPrice !== undefined ? toString(entryPrice) : undefined,
      quantity: toString(payload.quantity),
      filledQuantity: toString(payload.quantity - result.remainingQuantity),
    };
  }

  private async handleMarketOrder(payload: EnginePayload) {
    const user = this.userService.getUser(payload.userId);
    if (!user) throw new EngineError(404, "User not found");

    validateOrder(payload);

    const bestPrice =
      payload.side === "LONG"
        ? this.book.asksPrices[0]
        : this.book.bidsPrices[0];

    if (!bestPrice) {
      throw new EngineError(404, "No liquidity available");
    }

    const slippageTolerance =
      payload.slippageTolerance || totalSlippageTolerance;

    const slippage = toBigInt(String(slippageTolerance));
    const worstCasePrice =
      payload.side === "LONG"
        ? (bestPrice * (SCALE + slippage)) / SCALE
        : (bestPrice * (SCALE - slippage)) / SCALE;

    const lockedCollateral = await this.calculateCollateral(
      worstCasePrice,
      payload.quantity,
      payload.leverage,
    );

    console.log("worst case", worstCasePrice);
    console.log("locked amount", lockedCollateral);

    this.userService.lockCollateral(user, lockedCollateral);

    const orderId = crypto.randomUUID();
    await this.publishOrderCreated(orderId, payload);

    const result = this.matcher.matchMarketOrder(
      payload,
      orderId,
      this.book.asksPrices,
      this.book.bidsPrices,
      this.book.getAsks(),
      this.book.getBids(),
      lockedCollateral,
      worstCasePrice,
    );
    console.log("market result:", result);

    for (let i = 0; i < result.fills.length; i++) {
      const fill = result.fills[i]!;
      const makerFill = result.makerFills[i]!;

      await this.publishFill(fill);

      const takerClosed = this.positionManager.applyFill(
        user,
        payload,
        fill,
        this.fillMargin(fill, payload.leverage),
      );
      if (takerClosed) await this.publishClosedPosition(takerClosed);

      await this.handleMakerFill(makerFill, fill);
    }

    this.userService.releaseCollateral(user, result.surplus);
    await this.publishBalanceUpdate(payload.userId, user);

    console.log("market asks", this.book.getAsks());
    console.log("market bids", this.book.getBids());

    await this.publishOrderUpdated({
      orderId,
      userId: payload.userId,
      market: payload.market,
      type: payload.type,
      side: payload.side,
      price: payload.price !== undefined ? toString(payload.price) : undefined,
      quantity: toString(payload.quantity),
      filledQuantity: toString(payload.quantity - result.remainingQuantity),
      status: result.status,
    });

    return {
      orderId,
      status: result.status,
      quantity: toString(payload.quantity),
      filledQuantity: toString(payload.quantity - result.remainingQuantity),
    };
  }

  async cancelOrder(userId: string, orderId: string) {
    const removed = this.book.removeOrder(orderId, userId);

    if (!removed) {
      throw new EngineError(404, "Order not found");
    }

    const user = this.userService.getUser(userId);
    if (!user) throw new EngineError(404, "User not found");

    this.userService.unlockCollateral(user, removed.margin);

    await this.publishOrderCancelled(orderId);

    return {
      orderId,
      status: "Cancelled",
      releasedMargin: toString(removed.margin),
    };
  }

  setMarkPrice(price: bigint) {
    this.book.setMarkPrice(price);
  }

  getMarkPrice() {
    return this.book.getMarkPrice();
  }

  async liquidatePosition(
    user: EngineUser,
    position: EnginePosition,
    markPrice: bigint,
  ) {
    const closingSide: OrderSide = position.side === "LONG" ? "SHORT" : "LONG";

    const payload: EnginePayload = {
      userId: position.userId,
      market: position.market,
      side: closingSide,
      quantity: position.quantity,
      leverage: this.effectiveLeverage(position),
      correlationId: undefined,
      type: "MARKET",
      price: undefined,
      slippageTolerance: undefined,
    };

    const orderId = crypto.randomUUID();
    await this.publishOrderCreated(orderId, payload);

    const worstCasePrice = closingSide === "LONG" ? MAX_PRICE : 0n;

    const result = this.matcher.matchMarketOrder(
      payload,
      orderId,
      this.book.asksPrices,
      this.book.bidsPrices,
      this.book.getAsks(),
      this.book.getBids(),
      0n,
      worstCasePrice,
    );

    for (let i = 0; i < result.fills.length; i++) {
      const fill = result.fills[i]!;
      const makerFill = result.makerFills[i]!;

      await this.publishFill(fill);
      await this.handleMakerFill(makerFill, fill);
    }

    const matchedValue = result.totalFilledValue;
    const remainingValue = markPrice * result.remainingQuantity;
    const exitPrice = (matchedValue + remainingValue) / position.quantity;

    const pnl = this.positionManager.calculateRealizedPnl(
      position,
      exitPrice,
      position.quantity,
    );
    const deficit = position.margin + pnl < 0n ? -(position.margin + pnl) : 0n;

    if (deficit > 0n) {
      if (insuranceFund.coverDeficit(position.market, deficit)) {
        user.collateral.availableBalance += deficit;
      } else {
        const covered = insuranceFund.getFund(position.market);
        insuranceFund.coverDeficit(position.market, covered);
        user.collateral.availableBalance += covered;
      }
    }

    const closed = this.positionManager.closeLiquidatedPosition(
      user,
      position,
      exitPrice,
    );

    if (user.collateral.availableBalance < 0n) {
      console.log(
        `insurance fund exhausted; uncovered loss for user ${position.userId}`,
      );
      user.collateral.availableBalance = 0n;
    }

    const bankruptcyPrice =
      this.positionManager.calculateBankruptcyPrice(position);

    await this.publishClosedPosition(closed);
    await this.publishBalanceUpdate(position.userId, user);
    await publishLiquidation({
      userId: position.userId,
      market: position.market,
      quantity: toString(position.quantity),
      price: toString(exitPrice),
      liquidationPrice: toString(position.liquidationPrice),
      bankruptcyPrice: toString(bankruptcyPrice),
    });

    return { closed, deficit, bankruptcyPrice };
  }

  private effectiveLeverage(position: EnginePosition) {
    if (position.margin <= 0n || position.quantity <= 0n) return 1;

    const notional = (position.averagePrice * position.quantity) / SCALE;
    const leverage = Number(
      (notional + position.margin - 1n) / position.margin,
    );

    return leverage > 0 ? leverage : 1;
  }

  private fillMargin(fill: EngineFill, leverage: number) {
    return (fill.price * fill.quantity) / (SCALE * BigInt(leverage));
  }

  private async handleMakerFill(makerFill: EngineMakerFill, fill: EngineFill) {
    const makerUser = this.userService.getUser(makerFill.makerUserId);
    if (!makerUser) return;

    const makerPayload: EnginePayload = {
      userId: makerFill.makerUserId,
      market: fill.market,
      side: makerFill.makerSide,
      quantity: makerFill.quantity,
      leverage: makerFill.makerLeverage,
      correlationId: undefined,
      type: "LIMIT",
      price: makerFill.price,
      slippageTolerance: undefined,
    };

    const closed = this.positionManager.applyFill(
      makerUser,
      makerPayload,
      fill,
      makerFill.makerMargin,
    );
    if (closed) await this.publishClosedPosition(closed);

    await this.publishBalanceUpdate(makerFill.makerUserId, makerUser);

    await this.publishOrderUpdated({
      orderId: makerFill.makerOrderId,
      userId: makerFill.makerUserId,
      market: fill.market,
      type: "LIMIT",
      side: makerFill.makerSide,
      price: toString(makerFill.price),
      quantity: toString(
        makerFill.makerFilledQuantity + makerFill.makerRemainingQuantity,
      ),
      filledQuantity: toString(makerFill.makerFilledQuantity),
      status:
        makerFill.makerRemainingQuantity === 0n ? "Filled" : "PartiallyFilled",
    });
  }

  private async publishOrderCreated(orderId: string, payload: EnginePayload) {
    const baseOrder = {
      orderId,
      userId: payload.userId,
      market: payload.market,
      side: payload.side,
      quantity: toString(payload.quantity),
      filledQuantity: "0",
      status: "Open",
    };
    const order =
      payload.type === "LIMIT" && payload.price !== undefined
        ? {
            ...baseOrder,
            type: "LIMIT",
            price: toString(payload.price),
          }
        : {
            ...baseOrder,
            type: "MARKET",
          };

    await publishToStream(config.ORDERS_ACK, {
      ...order,
      messageType: "order-created",
    });
  }

  private async calculateCollateral(
    price: bigint,
    quantity: bigint,
    leverage: number,
  ) {
    return (price * quantity) / (SCALE * BigInt(leverage));
  }

  private async publishOrderUpdated(order: Order) {
    await publishToStream(config.ORDERS_ACK, {
      ...order,
      messageType: "order-updated",
    });
  }

  private async publishOrderCancelled(orderId: string) {
    await publishToStream(config.ORDERS_ACK, {
      orderId,
      status: "Cancelled",
      messageType: "order-cancelled",
    });
  }

  private async publishBalanceUpdate(userId: string, user: EngineUser) {
    await publishToStream(config.ORDERS_ACK, {
      userId,
      available: toString(user.collateral.availableBalance),
      locked: toString(user.collateral.lockedBalance),
      messageType: "balance-updated",
    });
  }

  private async publishClosedPosition(closed: EngineClosedPosition) {
    await publishToStream(config.ORDERS_ACK, {
      userId: closed.userId,
      market: closed.market,
      side: closed.side,
      quantity: toString(closed.quantity),
      averagePrice: toString(closed.averagePrice),
      exitPrice: toString(closed.exitPrice),
      liquidationPrice: toString(closed.liquidationPrice),
      margin: toString(closed.margin),
      realizedPnl: toString(closed.realizedPnl),
      messageType: "position-closed",
    });
  }

  private async publishFill(fill: EngineFill) {
    await publishToStream(config.ORDERS_ACK, {
      ...fill,
      quantity: toString(fill.quantity),
      price: toString(fill.price),
      messageType: "fill-created",
    });
  }

  /**Only for testing purposes */
  addSeedData() {
    this.book.addSeedData();
  }
}
