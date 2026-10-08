import { UserService } from "../services/user";
import { Users } from "../store/store";
import { toBigInt } from "../utils/conversion";
import { publishBalance, publishBalanceUpdate, publishError } from "./publish";
import type { AccountCommand } from "@perpex/types";

const userService = new UserService();

export const storeUser = (payload: { userId: string }) => {
  Users.set(payload.userId, {
    collateral: { availableBalance: 0n, lockedBalance: 0n },
    positions: [],
  });
};

export const handleAccountCommand = async (command: AccountCommand) => {
  try {
    if (command.messageType === "get-balance") {
      const balance = userService.getBalance(command.userId);
      await publishBalance(command.correlationId, balance);
      return;
    }

    if (command.messageType === "on-ramp") {
      userService.onRamp(command.userId, toBigInt(command.amount!));
    } else {
      userService.withdraw(command.userId, toBigInt(command.amount!));
    }

    const balance = userService.getBalance(command.userId);
    await publishBalance(command.correlationId, balance);
    await publishBalanceUpdate(command.userId, balance);
  } catch (error) {
    await publishError(command.correlationId, error);
  }
};
