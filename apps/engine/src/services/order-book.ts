import type {
  Fill,
  LimitOrderPayload,
  MarketOrderPayload,
  PayloadType,
  User,
} from "@perpex/types";
import { EngineError } from "../utils/engine-error";
import { UserService } from "./user";
import { publishToStream } from "@perpex/redis";
import { config } from "@perpex/config";
import { MathchingEngine } from "./matching-engine";
import { BookManager } from "./book-manager";

export class OrderBook {
  private matcher = new MathchingEngine();
  private book = new BookManager();

  constructor(private userService: UserService) {}

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

  private async handleLimitOrder(payload: LimitOrderPayload) {
    const user = this.userService.getUser(payload.userId);
    if (!user) throw new EngineError(404, "User not found");

    if (payload.leverage <= 0)
      throw new EngineError(400, "Leverage must be greater than zero");

    if (!payload.price) {
      throw new EngineError(404, "Price must be greater than zero ");
    }

    const lockedCollateral =
      (payload.price * payload.quantity) / payload.leverage;

    this.userService.lockCollateral(user, lockedCollateral);

    const orderId = crypto.randomUUID();
    await this.publishOrderCreated(orderId, payload);

    //TODO: Implement this again, this time without switch, try to optimize it even further.
    switch (payload.side) {
      case "LONG": {
        return await this.handleLongLimit(
          payload,
          orderId,
          user,
          lockedCollateral,
        );
      }
      case "SHORT": {
        return await this.handleShortLimit(
          payload,
          orderId,
          user,
          lockedCollateral,
        );
      }
    }
  }

  private async handleMarketOrder(payload: MarketOrderPayload) {
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

    const slippageTolerance = payload.slippageTolerance;

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

    return await this.handleLongMarket(
      payload,
      orderId,
      user,
      lockedCollateral,
      worstCasePrice,
    );

    //TODO: Implement this again, this time without switch, try to optimize it even further.
    // switch (payload.side) {
    //   case "LONG": {
    //   }
    //   case "SHORT": {
    //     return await this.handleShortMarket();
    //   }
    // }
  }

  private async handleLongMarket(
    payload: MarketOrderPayload,
    orderId: string,
    user: User,
    lockedCollateral: number,
    worstCasePrice: number,
  ) {
    const result = this.matcher.matchMarketLong(
      payload,
      orderId,
      this.book.asksPrices,
      this.book.bidsPrices,
      this.book.getAsks(),
      this.book.getBids(),
      lockedCollateral,
      worstCasePrice,
    );

    for (const fill of result.fills) {
      await this.publishFill(fill);
    }

    this.userService.releaseCollateral(user, result.surplus);

    console.log("market asks", this.book.getAsks());
    console.log("market bids", this.book.getBids());

    this.publishOrderUpdated(orderId, result.status);
  }
  private async handleShortMarket() {}

  private async handleLongLimit(
    payload: LimitOrderPayload,
    orderId: string,
    user: User,
    lockedCollateral: number,
  ) {
    const result = this.matcher.matchLimitLong(
      payload,
      orderId,
      this.book.getAsks(),
      this.book.asksPrices,
      lockedCollateral,
    );

    console.log("results from handleLongLimit", result);

    for (const fill of result.fills) {
      await this.publishFill(fill);
    }

    this.userService.releaseCollateral(user, result.surplus);

    if (result.remainingQuantity > 0) {
      const filledOrder = payload.quantity - result.remainingQuantity;

      this.book.placeIntoBids(
        payload.price,
        orderId,
        payload.userId,
        result.remainingQuantity,
        filledOrder,
      );
    }

    console.log("limit asks", this.book.getAsks());
    console.log("limit bids", this.book.getBids());

    this.publishOrderUpdated(orderId, result.status);
  }

  private async handleShortLimit(
    payload: LimitOrderPayload,
    orderId: string,
    user: User,
    lockedCollateral: number,
  ) {
    const result = this.matcher.matchLimitShort(
      payload,
      this.book.bidsPrices,
      this.book.getBids(),
      orderId,
      lockedCollateral,
    );

    console.log("result from handleShortLimit", result);

    for (const fill of result.fills) {
      await this.publishFill(fill);
    }

    this.userService.releaseCollateral(user, result.surplus);

    if (result.remainingQuantity > 0) {
      const filledOrder = payload.quantity - result.remainingQuantity;

      this.book.placeIntoAsks(
        payload.price,
        orderId,
        payload.userId,
        result.remainingQuantity,
        filledOrder,
      );
    }

    console.log("asks", this.book.getAsks());
    console.log("bids", this.book.getBids());

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
