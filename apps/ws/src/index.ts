import {
  connectRedis,
  consumeFromGroup,
  createConsumerGroup,
  STREAM_READERS,
} from "@perpex/redis";
import { config } from "@perpex/config";
import { startServer, broadcast } from "./server";
import { setDepth, type Depth } from "./depth";

interface EngineMessage {
  messageType?: string;
  market?: string;
  bids?: Depth["bids"];
  asks?: Depth["asks"];
  price?: string;
  quantity?: string;
  markPrice?: string;
  indexPrice?: string | null;
  fundingRateBps?: string;
}

await connectRedis();

const server = startServer(config.WS_PORT);

const handleEngineMessage = async (data: unknown) => {
  const message = data as EngineMessage;
  if (!message.market) return;

  if (message.messageType === "depth") {
    const depth = { bids: message.bids ?? [], asks: message.asks ?? [] };
    setDepth(message.market, depth);
    broadcast("depth", message.market, depth);
  }

  if (message.messageType === "fill-created") {
    broadcast("trade", message.market, {
      price: message.price ?? "0",
      quantity: message.quantity ?? "0",
      timestamp: Date.now(),
    });
  }

  if (message.messageType === "mark-price") {
    broadcast("markprice", message.market, {
      markPrice: message.markPrice ?? "0",
      indexPrice: message.indexPrice ?? null,
      fundingRateBps: message.fundingRateBps ?? "0",
    });
  }
};

const { group, consumer } = STREAM_READERS.ws;

const shutdown = () => {
  server.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await createConsumerGroup(config.ORDERS_ACK, group);
await consumeFromGroup(config.ORDERS_ACK, group, consumer, handleEngineMessage);
