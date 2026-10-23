import type { ResponseType } from "@perpex/types";
import { publishToStream } from "@perpex/redis";
import { config } from "@perpex/config";
import { cancelResolver, registerResolver } from "../services/listener";
import { ApiError } from "./api-error";

export const requestEngine = async (
  command: Record<string, unknown>,
): Promise<unknown> => {
  const correlationId = crypto.randomUUID();

  const reply = new Promise<ResponseType>((resolve, reject) => {
    registerResolver(correlationId, resolve, reject, config.RES_TIMEOUT);
  });

  try {
    await publishToStream(config.ORDERS_CREATE, { ...command, correlationId });
  } catch (error) {
    cancelResolver(correlationId);
    throw error;
  }

  const response = await reply;

  if (!response.ok) {
    throw new ApiError(
      response.status ?? 400,
      response.error ?? "Engine rejected the request",
    );
  }

  return response.data;
};
