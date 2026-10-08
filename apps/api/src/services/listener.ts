import { config } from "@perpex/config";
import { consumeStream } from "@perpex/redis";
import type { ResolverType, ResponseType } from "@perpex/types";

export const pendingResolver = new Map<string, ResolverType>();

export const registerResolver = (
  correlationId: string,
  resolve: Function,
  reject: Function,
  timeout: number,
) => {
  const timer = setTimeout(() => {
    if (pendingResolver.has(correlationId)) {
      pendingResolver.get(correlationId)?.reject("Engine timeout");
      pendingResolver.delete(correlationId);
    }
  }, timeout);

  pendingResolver.set(correlationId, { resolve, reject, timer });
};

export const readAckStream = async () => {
  await consumeStream(config.ORDERS_ACK, async (data) => {
    const response = data as ResponseType;

    const resolver = response.correlationId
      ? pendingResolver.get(response.correlationId)
      : undefined;

    if (!resolver) return;

    clearTimeout(resolver.timer);
    resolver.resolve(response);
    pendingResolver.delete(response.correlationId);
  });
};
