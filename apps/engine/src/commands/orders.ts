import type {
  CancelOrderCommand,
  CreateOrderCommand,
  EnginePayload,
} from "@perpex/types";
import type { EngineManager } from "../services/engine-manager";
import { EngineError } from "../utils/engine-error";
import { toBigInt } from "../utils/conversion";
import { publishError, publishSuccess } from "./publish";

export const handleCreateOrder = async (
  engineManager: EngineManager,
  payload: CreateOrderCommand,
) => {
  const enginePayload: EnginePayload = {
    ...payload,
    quantity: toBigInt(payload.quantity),
    price: payload.price !== undefined ? toBigInt(payload.price) : undefined,
  };

  try {
    const engine = engineManager.get(payload.market);
    if (!engine) throw new EngineError(404, "Market not found");

    const result = await engine.addOrder(enginePayload);

    await publishSuccess(payload.correlationId, result);
  } catch (error) {
    await publishError(payload.correlationId, error);
  }
};

export const handleCancelOrder = async (
  engineManager: EngineManager,
  payload: CancelOrderCommand,
) => {
  try {
    const engine = engineManager.get(payload.market);
    if (!engine) throw new EngineError(404, "Market not found");

    const result = await engine.cancelOrder(payload.userId, payload.orderId);

    await publishSuccess(payload.correlationId, result);
  } catch (error) {
    await publishError(payload.correlationId, error);
  }
};
