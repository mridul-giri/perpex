import type { User } from "@perpex/types";
import { Users } from "../store/store";

export class UserService {
  /** Returns the user by id. */
  getUser(userId: string) {
    return Users.get(userId);
  }

  /** Locked the required margin to open position */
  lockBalance(user: User, collateral: number) {
    user.collateral.lockedBalance += collateral;
    user.collateral.availableBalance -= collateral;
  }
}
