import { UserService } from "../services/user";
import { Users } from "../store/store";
import { toBigInt, toString } from "../utils/conversion";
import {
  publishBalance,
  publishBalanceUpdate,
  publishError,
  publishSuccess,
} from "../events/publish";
import type { AccountCommand, EnginePosition } from "@perpex/types";

const userService = new UserService();

export const storeUser = (payload: { userId: string }) => {
  Users.set(payload.userId, {
    collateral: { availableBalance: 0n, lockedBalance: 0n },
    positions: new Map(),
  });
};

const serializePosition = (position: EnginePosition) => ({
  market: position.market,
  side: position.side,
  quantity: toString(position.quantity),
  averagePrice: toString(position.averagePrice),
  liquidationPrice: toString(position.liquidationPrice),
  margin: toString(position.margin),
  createdAt: position.createdAt,
  updatedAt: position.updatedAt,
});

export const handleAccountCommand = async (command: AccountCommand) => {
  try {
    if (command.messageType === "get-balance") {
      const balance = userService.getBalance(command.userId);
      await publishBalance(command.correlationId, balance);
      return;
    }

    if (command.messageType === "get-positions") {
      const positions = userService.getPositions(command.userId);
      await publishSuccess(command.correlationId, {
        positions: positions.map(serializePosition),
      });
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
