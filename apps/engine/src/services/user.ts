import type { EnginePosition, EngineUser } from "@perpex/types";
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
        positions: [],
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
    user.collateral.lockedBalance -= surplus;
    user.collateral.availableBalance += surplus;
  }

  addPnl(user: EngineUser, pnl: bigint) {
    user.collateral.availableBalance += pnl;
  }

  deleteOpenPosition(
    user: EngineUser,
    userId: string,
    position: EnginePosition,
  ) {
    const updatedPosition = user.positions.filter(
      (position) => userId != position.userId,
    );

    user.positions.push(...updatedPosition);
  }
}
