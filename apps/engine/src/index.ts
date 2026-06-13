import {
  connectRedis,
  publishToStream,
  readFromStream,
  subscriber,
} from "@perpex/redis";
import type { PayloadType, StreamMessages } from "@perpex/types";
import { EngineManager } from "./services/engine-manager";
import { config } from "@perpex/config";
import { EngineError } from "./utils/engine-error";
import { Users } from "./store/store";
import { OrderBook } from "./services/order-book";

await connectRedis();

const engineManager = new EngineManager();

const storeUser = (payload: any) => {
  Users.set(payload.userId, {
    collateral: { availableBalance: 5000, lockedBalance: 0 },
    positions: [],
  });
};

while (true) {
  const stream = await readFromStream(config.ORDERS_CREATE);

  if (!stream[0] || stream.length === 0) continue;

  for (const { message } of stream[0].messages) {
    if (!message.data) continue;
    const payload = JSON.parse(message.data);

    try {
      if (payload.messageType === "store-user") {
        storeUser(payload);
        break;
      }

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
