import { WebSocket } from "ws";
import { connectRedis, publishToStream } from "@perpex/redis";
import { config } from "@perpex/config";
import type { MarkPriceCommand } from "@perpex/types";

const MARK_PRICE_STREAM_URL =
  "wss://fstream.binance.com/market/ws/!markPrice@arr@1s";

const MARKET_BY_SYMBOL: Record<string, string> = {
  BTCUSDT: "BTC_PERP",
  ETHUSDT: "ETH_PERP",
  SOLUSDT: "SOL_PERP",
};

interface BinanceMarkPrice {
  e: string;
  E: number;
  s: string;
  p: string;
  i: string;
}

let stopped = false;

const isMarkPrice = (value: unknown): value is BinanceMarkPrice => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.s === "string" &&
    typeof record.p === "string" &&
    typeof record.i === "string"
  );
};

const parseTicks = (raw: string): BinanceMarkPrice[] => {
  const message = JSON.parse(raw);
  if (Array.isArray(message)) return message.filter(isMarkPrice);
  if (isMarkPrice(message)) return [message];
  return [];
};

const publishTick = async (tick: BinanceMarkPrice) => {
  const market = MARKET_BY_SYMBOL[tick.s];
  if (!market) return;

  const command: MarkPriceCommand = {
    messageType: "mark-price",
    market,
    price: tick.p,
  };

  await publishToStream(config.ORDERS_CREATE, command);
};

const connect = () => {
  console.log(`connecting to mark-price stream: ${MARK_PRICE_STREAM_URL}`);
  const socket = new WebSocket(MARK_PRICE_STREAM_URL);

  socket.on("open", () => {
    console.log("mark-price stream connected");
  });

  socket.on("message", (data) => {
    void Promise.resolve()
      .then(() => parseTicks(data.toString()))
      .then((ticks) => Promise.all(ticks.map(publishTick)))
      .catch((error) => console.error("failed to publish mark price", error));
  });

  socket.on("close", () => {
    if (stopped) return;
    console.error("mark-price stream closed; reconnecting");
    setTimeout(connect, 1000);
  });

  socket.on("error", (error) => {
    console.error("mark-price stream error", error);
    socket.close();
  });
};

await connectRedis();
connect();
