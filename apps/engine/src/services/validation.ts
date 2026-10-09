import type { EnginePayload, Market } from "@perpex/types";
import { EngineError } from "../utils/engine-error";

export const validateOrder = (payload: EnginePayload, market?: Market) => {
  if (payload.quantity <= 0n) {
    throw new EngineError(400, "Quantity must be greater than zero");
  }

  if (payload.leverage <= 0) {
    throw new EngineError(400, "Leverage must be greater than zero");
  }

  if (payload.type === "LIMIT") {
    if (payload.price === undefined) {
      throw new EngineError(400, "Limit order requires a price");
    }

    if (payload.price <= 0n) {
      throw new EngineError(400, "Price must be greater than zero");
    }
  }
};
