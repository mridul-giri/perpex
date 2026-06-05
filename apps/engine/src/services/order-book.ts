import type { Fill, PayloadType, User } from "@perpex/types";
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

  private async handleLimitOrder(payload: PayloadType) {
    const user = this.userService.getUser(payload.userId);
    if (!user) throw new EngineError(404, "User not found");

    if (payload.leverage <= 0)
      throw new EngineError(400, "Leverage must be greater than zero");

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

  handleMarketOrder(payload: PayloadType) {}

  private async handleLongLimit(
    payload: PayloadType,
    orderId: string,
    user: User,
    lockedCollateral: number,
  ) {
    const result = this.matcher.matchLong(
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
        payload,
        orderId,
        result.remainingQuantity,
        filledOrder,
      );
    }

    console.log("asks", this.book.getAsks());
    console.log("bids", this.book.getBids());

    this.publishOrderUpdated(orderId, result.status);
  }

  private async handleShortLimit(
    payload: PayloadType,
    orderId: string,
    user: User,
    lockedCollateral: number,
  ) {
    const result = this.matcher.matchShort(
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
        payload,
        orderId,
        result.remainingQuantity,
        filledOrder,
      );
    }

    console.log("asks", this.book.getAsks());
    console.log("bids", this.book.getBids());

    this.publishOrderUpdated(orderId, result.status);
  }

  private async publishOrderCreated(orderId: any, payload: PayloadType) {
    const order = {
      orderId,
      userId: payload.userId,
      market: payload.market,
      type: payload.type,
      side: payload.side,
      price: payload.price,
      quantity: payload.quantity,
      filledQuantity: 0,
      status: "Open",
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
