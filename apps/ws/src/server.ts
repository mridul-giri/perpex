import { WebSocketServer, WebSocket } from "ws";
import { isChannel, type Channel } from "./channels";
import { getDepth } from "./depth";

// Which sockets are listening to which channel, "depth:BTC_PERP" -> { socket1, socket2 }
const subscribersByChannel = new Map<string, Set<WebSocket>>();

export const startServer = (port: number) => {
  const server = new WebSocketServer({ port });

  server.on("connection", (socket) => {
    socket.on("message", (raw) => handleMessage(socket, raw.toString()));
    socket.on("close", () => removeSocket(socket));
    socket.on("error", () => removeSocket(socket));
  });

  server.on("error", (error) => console.error("ws server error", error));
  console.log(`ws server listening on :${port}`);

  return server;
};

export const broadcast = (channel: Channel, market: string, data: unknown) => {
  const sockets = subscribersByChannel.get(channelKey(channel, market));
  if (!sockets) return;

  const message = JSON.stringify({
    channel,
    market,
    data,
    timestamp: Date.now(),
  });

  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) socket.send(message);
  }
};

const handleMessage = (socket: WebSocket, raw: string) => {
  let request: { operation?: string; channel?: string; symbol?: string };

  try {
    request = JSON.parse(raw);
  } catch {
    return sendTo(socket, { error: "invalid_json" });
  }

  if (
    request.operation !== "subscribe" &&
    request.operation !== "unsubscribe"
  ) {
    return sendTo(socket, { error: "invalid_operation" });
  }

  const channel = request.channel;
  const market = request.symbol;

  if (!channel || !isChannel(channel) || !market) {
    return sendTo(socket, { error: "invalid_channel" });
  }

  const key = channelKey(channel, market);

  if (request.operation === "subscribe") {
    let sockets = subscribersByChannel.get(key);
    if (!sockets) {
      sockets = new Set();
      subscribersByChannel.set(key, sockets);
    }
    sockets.add(socket);

    sendTo(socket, { operation: "subscribed", channel, symbol: market });

    // Send the current depth immediately so the client does not wait for the next trade.
    const depth = channel === "depth" ? getDepth(market) : undefined;
    if (depth)
      sendTo(socket, { channel, market, data: depth, timestamp: Date.now() });
    return;
  }

  subscribersByChannel.get(key)?.delete(socket);
  sendTo(socket, { operation: "unsubscribed", channel, symbol: market });
};

const removeSocket = (socket: WebSocket) => {
  for (const sockets of subscribersByChannel.values()) {
    sockets.delete(socket);
  }
};

const sendTo = (socket: WebSocket, payload: unknown) => {
  if (socket.readyState === WebSocket.OPEN)
    socket.send(JSON.stringify(payload));
};

const channelKey = (channel: string, market: string) => `${channel}:${market}`;
