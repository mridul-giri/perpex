import type { PayloadType } from "@perpex/types";
import { OrderBook } from "./order-book";
import { UserService } from "./user";

export class Engine {
  private orderBook = new OrderBook(new UserService());

  process(payload: PayloadType) {
    switch (payload.messageType) {
      case "on-ramp": {
        console.log("on ramp");
        break;
      }
      case "create-order": {
        this.orderBook.addSeedData();
        return this.orderBook.addOrder(payload);
      }
      case "cancel-order": {
        console.log("delete-order");
        break;
      }
    }
  }
}
