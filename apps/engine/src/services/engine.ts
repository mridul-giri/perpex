import { OrderBook } from "./order-book";
import type { BookState } from "./book-manager";
import { UserService } from "./user";
import { MathchingEngine } from "./matching-engine";
import { PositionManager } from "./position-manager";
import type {
  EnginePayload,
  EnginePosition,
  EngineUser,
  Market,
} from "@perpex/types";

export interface EngineMarketState {
  market: Market;
  book: BookState;
}

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

  exportState(): EngineMarketState {
    return {
      market: this.market,
      book: this.orderBook.exportState(),
    };
  }

  importState(state: EngineMarketState) {
    this.orderBook.importState(state.book);
  }

  liquidatePosition(
    user: EngineUser,
    position: EnginePosition,
    markPrice: bigint,
  ) {
    return this.orderBook.liquidatePosition(user, position, markPrice);
  }
}
