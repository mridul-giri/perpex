import type { EngineUser } from "@perpex/types";
import { Users } from "../store/store";
import { EngineError } from "../utils/engine-error";

export class UserService {
  getUser(userId: string) {
    return Users.get(userId);
  }

  onRamp(userId: string, amount: bigint): bigint {
    const user = this.getUser(userId);

    if (!user) {
      Users.set(userId, {
        collateral: { availableBalance: amount, lockedBalance: 0n },
        positions: new Map(),
      });
      return amount;
    }

    user.collateral.availableBalance += amount;
    return user.collateral.availableBalance;
  }

  withdraw(userId: string, amount: bigint): bigint {
    const user = this.getUser(userId);

    if (!user || user.collateral.availableBalance < amount) {
      throw new EngineError(400, "Insufficient Balance");
    }

    user.collateral.availableBalance -= amount;
    return user.collateral.availableBalance;
  }

  getBalance(userId: string) {
    const user = this.getUser(userId);
    if (!user) throw new EngineError(404, "User not found");
    return user.collateral;
  }

  lockCollateral(user: EngineUser, collateral: bigint) {
    if (user.collateral.availableBalance < collateral)
      throw new EngineError(400, "Insufficient Balance");

    user.collateral.availableBalance -= collateral;
    user.collateral.lockedBalance += collateral;
  }

  releaseCollateral(user: EngineUser, surplus: bigint) {
    this.unlockCollateral(user, surplus);
  }

  unlockCollateral(user: EngineUser, amount: bigint) {
    user.collateral.lockedBalance -= amount;
    user.collateral.availableBalance += amount;
  }
}
