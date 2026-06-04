import type { User } from "@perpex/types";
import { Users } from "../store/store";
import { EngineError } from "../utils/engine-error";

export class UserService {
  getUser(userId: string) {
    return Users.get(userId);
  }

  lockCollateral(user: User, collateral: number) {
    if (user.collateral.availableBalance < collateral)
      throw new EngineError(400, "Insufficient Balance");

    user.collateral.availableBalance -= collateral;
    user.collateral.lockedBalance += collateral;
  }

  releaseCollateral(user: User, surplus: number) {
    user.collateral.lockedBalance -= surplus;
    user.collateral.availableBalance += surplus;

  }
}
