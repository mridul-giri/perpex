import { OrderBook } from "./order-book";
import { UserService } from "./user";
import { MathchingEngine } from "./matching-engine";
import { PositionManager } from "./position-manager";
import type {
  EnginePayload,
  EnginePosition,
  EngineUser,
  Market,
} from "@perpex/types";

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

  cancelOrder(userId: string, orderId: string) {
    return this.orderBook.cancelOrder(userId, orderId);
  }

  setMarkPrice(price: bigint) {
    this.orderBook.setMarkPrice(price);
  }

  getMarkPrice() {
    return this.orderBook.getMarkPrice();
  }

  setIndexPrice(price: bigint) {
    this.orderBook.setIndexPrice(price);
  }

  getIndexPrice() {
    return this.orderBook.getIndexPrice();
  }

  liquidatePosition(
    user: EngineUser,
    position: EnginePosition,
    markPrice: bigint,
  ) {
    return this.orderBook.liquidatePosition(user, position, markPrice);
  }
}
