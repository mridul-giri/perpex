import type { PayloadType } from "@perpex/types";
import { OrderBook } from "./orderBook";

export class Engine {
  private orderBook = new OrderBook();

  process(payload: PayloadType) {
    switch (payload.messageType) {
      case "on-ramp": {
        console.log("on ramp");
        break;
      }
      case "create-order": {
        return this.orderBook.addOrder(payload);
        break;
      }
      case "delete-order": {
        console.log("delete-order");
        break;
      }
      case "get-equity": {
        console.log("get equity");
        break;
      }
      case "get-open-position": {
        console.log("get-open-postion");
        break;
      }
      case "get-closed-position": {
        console.log("get-closed-postion");
        break;
      }
      case "get-orders": {
        console.log("get-orders");
        break;
      }
      case "get-open-order": {
        console.log("get-open-order");
        break;
      }
      case "get-fills": {
        console.log("get-fills", payload);
        break;
      }
    }
  }
}
