import { OrderBook } from "./order-book";
import { UserService } from "./user";
import { MathchingEngine } from "./matching-engine";
import { PositionManager } from "./position-manager";
import type { EnginePayload, Market } from "@perpex/types";

export class Engine {
  private orderBook: OrderBook;

  constructor(
    private readonly market: Market,
    userService: UserService,
    matcher: MathchingEngine,
    positionManager: PositionManager,
  ) {
    this.orderBook = new OrderBook(userService, matcher, positionManager);
  }

  getMarket() {
    return this.market;
  }

  addOrder(payload: EnginePayload) {
    return this.orderBook.addOrder(payload);
  }
}
