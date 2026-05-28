import {
  connectRedis,
  ordersAck,
  ordersCreate,
  publishToStream,
  subscriber,
} from "@perpex/redis";
import type { PayloadType, StreamMessages } from "@perpex/types";
import { OrderBook } from "./services/orderBook";
import { EngineManager } from "./services/engineManager";

await connectRedis();

const engineManager = new EngineManager();

while (true) {
  const stream = (await subscriber.xRead([{ key: ordersCreate, id: "$" }], {
    BLOCK: 0,
    COUNT: 1,
  })) as StreamMessages;

  if (!stream[0] || stream.length === 0) continue;

  for (const { message } of stream[0].messages) {
    if (!message.data) continue;
    const payload = JSON.parse(message.data) as PayloadType;
    try {
      const engine = engineManager.get(payload);

      const result = engine.process(payload);

      await publishToStream(ordersAck, {
        ...result,
        correlationId: payload.correlationId,
        ok: true,
      });
    } catch (error) {
      await publishToStream(ordersAck, {
        correlationId: payload.correlationId,
        ok: false,
        error: error instanceof Error ? error.message : "Engine Error",
      });
      console.log("Error", error);
    }
  }
}
