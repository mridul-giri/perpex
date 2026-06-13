import type { Fill, PayloadType, Position, User } from "@perpex/types";
import { EngineError } from "../utils/engine-error";
import { UserService } from "./user";
import { publishToStream } from "@perpex/redis";
import { config } from "@perpex/config";
import { MathchingEngine } from "./matching-engine";
import { BookManager } from "./book-manager";
import { PositionManager } from "./position-manager";
import { maintenanceMarginRate, totalSlippageTolerance } from "../store/store";

export class OrderBook {
  private book = new BookManager();

  constructor(
    private userService: UserService,
    private matcher: MathchingEngine,
    private positionManager: PositionManager,
  ) {}

  async addOrder(payload: PayloadType) {
    switch (payload.type) {
      case "LIMIT": {
        return this.handleLimitOrder(payload);
      }
      case "MARKET": {
        return this.handleMarketOrder(payload);
      }
    }
  }

  private async handleLimitOrder(payload: PayloadType) {
    const user = this.userService.getUser(payload.userId);
    if (!user) throw new EngineError(404, "User not found");

    if (payload.leverage <= 0)
      throw new EngineError(400, "Leverage must be greater than zero");

    if (!payload.price) {
      throw new EngineError(404, "Price must be greater than zero ");
    }

    const { price: entryPrice, quantity, leverage } = payload;

    const lockedCollateral = (entryPrice * quantity) / leverage;

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

    for (const fill of result.fills) {
      await this.publishFill(fill);

      // position logic
      const position = await this.positionManager.getPosition(user, payload);

      if (!position) {
        await this.positionManager.createPosition(
          user,
          payload,
          fill,
          leverage,
          lockedCollateral,
        );
        console.log("[New-Position]", user.positions);
      } else {
        if (payload.side === position.side) {
          await this.positionManager.updatePosition(
            position,
            payload,
            fill,
            result.actualCollateralUsed,
          );

          console.log("[Position-if-both-side-same]", user.positions);
        } else {
          const closeQty = Math.min(fill.quantity, position.quantity);
          const remainingFillQty = fill.quantity - closeQty;
          const remainingPositionQty = position.quantity - closeQty;

          console.log(
            `close qty: ${closeQty}, remaining fill qty: ${remainingFillQty}, reamaining postn qty: ${remainingPositionQty}`,
          );

          // close full condition
          if (remainingFillQty === 0 && remainingPositionQty === 0) {
            this.positionManager.closePosition(
              fill,
              position,
              closeQty,
              result.actualCollateralUsed,
              user,
              this.userService.releaseCollateral,
              this.userService.addPnl,
              this.userService.deleteOpenPosition,
              payload.userId,
            );
          }

          // partially close position
          if (remainingPositionQty > 0) {
            this.positionManager.partiallyClosePosition(
              user,
              position,
              fill,
              result.actualCollateralUsed,
              payload,
              closeQty,
              this.userService.releaseCollateral,
              this.userService.addPnl,
            );
          }

          if (remainingFillQty > 0) {
            console.log(
              "first close some position and then open opposite position",
            );
          }
        }
      }
    }

    this.userService.releaseCollateral(user, result.surplus);

    console.log("After-release-outer", user.collateral);

    if (result.remainingQuantity > 0) {
      const filledOrder = payload.quantity - result.remainingQuantity;

      this.book.placeIntoSide(
        payload.side,
        entryPrice,
        orderId,
        payload.userId,
        result.remainingQuantity,
        filledOrder,
      );
    }

    console.log("[Limit-Asks]", this.book.getAsks());
    console.log("[Limit-Bids]", this.book.getBids());

    this.publishOrderUpdated(orderId, result.status);
  }

  private async handleMarketOrder(payload: PayloadType) {
    //handle slippage
    const user = this.userService.getUser(payload.userId);
    if (!user) throw new EngineError(404, "User not found");

    if (payload.leverage <= 0) {
      throw new EngineError(400, "Leverage must be greater than zero");
    }

    const bestPrice =
      payload.side === "LONG"
        ? this.book.asksPrices[0]
        : this.book.bidsPrices[0];

    if (!bestPrice) {
      throw new EngineError(404, "No liquidity available");
    }

    const slippageTolerance =
      payload.slippageTolerance || totalSlippageTolerance;

    const worstCasePrice =
      payload.side === "LONG"
        ? bestPrice * (1 + slippageTolerance)
        : bestPrice * (1 - slippageTolerance);

    const lockedCollateral =
      (worstCasePrice * payload.quantity) / payload.leverage;

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

    for (const fill of result.fills) {
      await this.publishFill(fill);
    }

    this.userService.releaseCollateral(user, result.surplus);

    console.log("market asks", this.book.getAsks());
    console.log("market bids", this.book.getBids());

    this.publishOrderUpdated(orderId, result.status);
  }

  private async publishOrderCreated(orderId: any, payload: PayloadType) {
    const baseOrder = {
      orderId,
      userId: payload.userId,
      market: payload.market,
      side: payload.side,
      quantity: payload.quantity,
      filledQuantity: 0,
      status: "Open",
    };
    const order =
      payload.type === "LIMIT"
        ? {
            ...baseOrder,
            type: "LIMIT",
            price: payload.price,
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

  private async publishOrderUpdated(orderId: string, status: string) {
    await publishToStream(config.ORDERS_ACK, {
      orderId,
      status,
      messageType: "order-updated",
    });
  }

  private async publishFill(fill: Fill) {
    await publishToStream(config.ORDERS_ACK, {
      ...fill,
      messageType: "fill-created",
    });
  }

  /**Only for testing purposes */
  addSeedData() {
    this.book.addSeedData();
  }
}
