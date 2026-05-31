import { config } from "@perpex/config/src";
import { readFromStream } from "@perpex/redis";
import type { PayloadType, ResponseType } from "@perpex/types";

export type ResolverType = {
  resolve: Function;
  reject: Function;
  timer: ReturnType<typeof setTimeout>;
};

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
  while (true) {
    const stream = await readFromStream(config.ORDERS_ACK);
    if (!stream[0]) continue;

    for (const { id, message } of stream[0].messages) {
      if (!message.data) continue;

      const response: ResponseType = JSON.parse(message.data);

      if (!response.correlationId) continue;

      const resolver = pendingResolver.get(response.correlationId);
      if (resolver) {
        clearTimeout(resolver.timer);
        resolver.resolve(response);
        pendingResolver.delete(response.correlationId);
      }
    }
  }
};
