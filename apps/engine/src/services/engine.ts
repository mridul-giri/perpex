import type { PayloadType } from "@perpex/types";
import { OrderBook } from "./order-book";
import { UserService } from "./user";
import { MathchingEngine } from "./matching-engine";
import { PositionManager } from "./position-manager";

export class Engine {
  private orderBook: OrderBook;

  constructor(
    userService: UserService,
    matcher: MathchingEngine,
    positionManager: PositionManager,
  ) {
    this.orderBook = new OrderBook(userService, matcher, positionManager);
    this.orderBook.addSeedData();
  }

  process(payload: PayloadType) {
    switch (payload.messageType) {
      case "on-ramp": {
        console.log("on ramp");
        break;
      }
      case "create-order": {
        return this.orderBook.addOrder(payload);
      }
      case "cancel-order": {
        console.log("delete-order");
        break;
      }
    }
  }
}
