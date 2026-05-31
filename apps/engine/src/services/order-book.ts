import type { Asks, Bids, Order, PayloadType, User } from "@perpex/types";
import { Users } from "../store/store";
import { EngineError } from "../utils/engine-error";
import type { UserService } from "./user";
import { publishToStream } from "@perpex/redis";
import { config } from "@perpex/config/src";

export class OrderBook {
  private bids: Map<number, Bids> = new Map();
  private asks: Map<number, Asks> = new Map();

  constructor(private userService: UserService) {}

  async addOrder(payload: PayloadType) {
    switch (payload.type) {
      case "limit": {
        switch (payload.side) {
          case "long": {
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

            this.userService.lockBalance(user, collateral);

            break;
          }
          case "short": {
            break;
          }
        }
        break;
      }
      case "market": {
        switch (payload.side) {
          case "long": {
            break;
          }
          case "short": {
            break;
          }
        }
        break;
      }
    }
  }

  /** Computes required margin of the current order */
  private calculateCollateral(
    price: number,
    quantity: number,
    leverage: number,
  ) {
    return (price * quantity) / leverage;
  }
}
