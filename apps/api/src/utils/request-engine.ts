import type { ResponseType } from "@perpex/types";
import { publishToStream } from "@perpex/redis";
import { config } from "@perpex/config";
import { registerResolver } from "../services/listener";

export const requestEngine = (
  command: Record<string, unknown>,
): Promise<ResponseType> => {
  const correlationId = crypto.randomUUID();

  return new Promise((resolve, reject) => {
    registerResolver(correlationId, resolve, reject, config.RES_TIMEOUT);
    publishToStream(config.ORDERS_CREATE, { ...command, correlationId });
  });
};
