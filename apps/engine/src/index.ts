import { connectRedis, publishToStream, subscriber } from "@perpex/redis";
import type { PayloadType, StreamMessages } from "@perpex/types";
import { EngineManager } from "./services/engine-manager";
import { config } from "@perpex/config/src";
import { EngineError } from "./utils/engine-error";

await connectRedis();

const engineManager = new EngineManager();

while (true) {
  const stream = (await subscriber.xRead(
    [{ key: config.ORDERS_CREATE, id: "$" }],
    {
      BLOCK: 0,
      COUNT: 1,
    },
  )) as StreamMessages;

  if (!stream[0] || stream.length === 0) continue;

  for (const { message } of stream[0].messages) {
    if (!message.data) continue;
    const payload = JSON.parse(message.data) as PayloadType;
    try {
      const engine = engineManager.get(payload);

      const result = engine.process(payload);
      console.log("engine result", result);

      // await publishToStream(config.ORDERS_ACK, {
      //   // ...result,
      //   correlationId: payload.correlationId,
      //   ok: true,
      // });
    } catch (error) {
      // console.log("Error", error);
      await publishToStream(config.ORDERS_ACK, {
        correlationId: payload.correlationId,
        ok: false,
        error: error instanceof EngineError ? error.message : "Engine Error",
      });
    }
  }
}
