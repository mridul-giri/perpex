export type WsChannel = "depth" | "trade" | "markprice";
export type WsStatus = "connecting" | "open" | "closed";
type Handler = (data: unknown) => void;

interface WsMessage {
  channel?: WsChannel;
  market?: string;
  data?: unknown;
}

const MAX_RECONNECT_DELAY_MS = 30_000;

export class WsClient {
  private socket?: WebSocket;
  private handlers = new Map<string, Set<Handler>>();
  private failedAttempts = 0;
  private closedByUs = false;

  onStatus?: (status: WsStatus) => void;

  constructor(private readonly url: string) {}

  subscribe(channel: WsChannel, market: string, handler: Handler) {
    const key = `${channel}:${market}`;
    const handlers = this.handlers.get(key) ?? new Set<Handler>();
    handlers.add(handler);
    this.handlers.set(key, handlers);

    if (this.connect()?.readyState === WebSocket.OPEN) {
      this.send("subscribe", channel, market);
    }

    return () => {
      handlers.delete(handler);
      if (handlers.size > 0) return;
      this.handlers.delete(key);
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send("unsubscribe", channel, market);
      }
    };
  }

  close() {
    this.closedByUs = true;
    this.socket?.close();
    this.socket = undefined;
  }

  private connect() {
    if (this.closedByUs || typeof window === "undefined") return undefined;
    if (this.socket) return this.socket;

    const socket = new WebSocket(this.url);
    this.socket = socket;
    this.onStatus?.("connecting");

    socket.onopen = () => {
      this.failedAttempts = 0;
      this.onStatus?.("open");
      for (const key of this.handlers.keys()) {
        const [channel, market] = key.split(":") as [WsChannel, string];
        this.send("subscribe", channel, market);
      }
    };

    socket.onmessage = (event) => {
      let message: WsMessage;
      try {
        message = JSON.parse(String(event.data)) as WsMessage;
      } catch {
        return;
      }
      const key = `${message.channel}:${message.market}`;
      this.handlers.get(key)?.forEach((handler) => handler(message.data));
    };

    socket.onclose = () => {
      this.socket = undefined;
      this.onStatus?.("closed");
      if (!this.closedByUs) this.reconnectLater();
    };

    socket.onerror = () => socket.close();

    return socket;
  }

  private reconnectLater() {
    const delay = Math.min(
      MAX_RECONNECT_DELAY_MS,
      1000 * 2 ** this.failedAttempts,
    );
    this.failedAttempts += 1;
    setTimeout(() => this.connect(), delay);
  }

  private send(operation: string, channel: WsChannel, market: string) {
    this.socket?.send(JSON.stringify({ operation, channel, symbol: market }));
  }
}
