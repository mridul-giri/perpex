import type { User } from "@perpex/types";
import { Users } from "../store/store";

export class UserService {
  getUser(userId: string) {
    return Users.get(userId);
  }

  lockBalance(user: User, collateral: number) {
    user.collateral.lockedBalance += collateral;
    user.collateral.availableBalance -= collateral;
  }
}
