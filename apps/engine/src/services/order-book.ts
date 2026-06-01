import type { Asks, Bids, Order, PayloadType, User } from "@perpex/types";
import { EngineError } from "../utils/engine-error";
import type { UserService } from "./user";
import { publishToStream } from "@perpex/redis";
import { config } from "@perpex/config";

export class OrderBook {
  private bids: Map<number, Bids> = new Map();
  private asks: Map<number, Asks> = new Map();

  constructor(private userService: UserService) {}

  async addOrder(payload: PayloadType) {
    switch (payload.type) {
      case "LIMIT": {
        switch (payload.side) {
          case "LONG": {
            const user = this.userService.getUser(payload.userId);
            if (!user) throw new EngineError(404, "User not found");

            const collateral = this.calculateCollateral(
              payload.price,
              payload.quantity,
              payload.leverage,
            );

            const userBalance = user.collateral.availableBalance;
            if (userBalance < collateral)
              throw new EngineError(400, "Insufficient Balance");

            const order: Order = {
              orderId: crypto.randomUUID(),
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

            this.userService.lockBalance(user, collateral);

            break;
          }
          case "SHORT": {
            break;
          }
        }
        break;
      }
      case "MARKET": {
        switch (payload.side) {
          case "LONG": {
            break;
          }
          case "SHORT": {
            break;
          }
        }
        break;
      }
    }
  }

  private calculateCollateral(
    price: number,
    quantity: number,
    leverage: number,
  ) {
    return (price * quantity) / leverage;
  }
}
