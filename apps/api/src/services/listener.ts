import { ordersAck, readFromStream } from "@perpex/redis";
import type { PayloadType, ResponseType } from "@perpex/types";

export const pendingResolver = new Map<string, Function>();

export const registerResolver = (correlationId: string, resolve: Function) => {
  pendingResolver.set(correlationId, resolve);
};

export const readAckStream = async () => {
  while (true) {
    const stream = await readFromStream(ordersAck);
    if (!stream[0]) continue;

    for (const { id, message } of stream[0].messages) {
      if (!message.data) continue;

      const response: ResponseType = JSON.parse(message.data);

      if (!response.correlationId) continue;

      pendingResolver.get(response.correlationId)?.(response);
      pendingResolver.delete(response.correlationId);
    }
  }
};
