export type WsChannel = "depth" | "trade" | "markprice";
export type WsHandler = (data: unknown) => void;
export type Unsubscribe = () => void;
export type WsStatus = "connecting" | "open" | "closed";

interface Envelope {
  channel?: WsChannel;
  market?: string;
  data?: unknown;
}

const MAX_BACKOFF_MS = 30000;

export class PerpexWsClient {
  private socket?: WebSocket;
  private readonly handlers = new Map<string, Set<WsHandler>>();
  private attempts = 0;
  private closed = false;

  onStatus?: (status: WsStatus) => void;

  constructor(private readonly url: string) {}

  subscribe(
    channel: WsChannel,
    symbol: string,
    handler: WsHandler,
  ): Unsubscribe {
    const key = `${channel}:${symbol}`;
    let set = this.handlers.get(key);
    if (!set) {
      set = new Set();
      this.handlers.set(key, set);
    }
    set.add(handler);

    if (this.ensure()?.readyState === WebSocket.OPEN) {
      this.send("subscribe", channel, symbol);
    }

    return () => {
      const current = this.handlers.get(key);
      if (!current) return;
      current.delete(handler);
      if (current.size === 0) {
        this.handlers.delete(key);
        if (this.socket?.readyState === WebSocket.OPEN) {
          this.send("unsubscribe", channel, symbol);
        }
      }
    };
  }

  close() {
    this.closed = true;
    this.socket?.close();
    this.socket = undefined;
  }

  private ensure(): WebSocket | undefined {
    if (this.closed || typeof window === "undefined") return undefined;
    if (this.socket) return this.socket;

    const socket = new WebSocket(this.url);
    this.socket = socket;
    this.onStatus?.("connecting");

    socket.onopen = () => {
      this.attempts = 0;
      this.onStatus?.("open");
      for (const key of this.handlers.keys()) {
        const [channel, symbol] = key.split(":");
        if (channel && symbol) {
          this.send("subscribe", channel as WsChannel, symbol);
        }
      }
    };

    socket.onmessage = (event) => {
      let envelope: Envelope;
      try {
        envelope = JSON.parse(event.data as string) as Envelope;
      } catch {
        return;
      }
      if (!envelope.channel || !envelope.market) return;
      const set = this.handlers.get(`${envelope.channel}:${envelope.market}`);
      set?.forEach((handler) => handler(envelope.data));
    };

    socket.onclose = () => {
      this.socket = undefined;
      this.onStatus?.("closed");
      if (!this.closed) this.reconnect();
    };

    socket.onerror = () => socket.close();

    return socket;
  }

  private reconnect() {
    const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** this.attempts);
    this.attempts += 1;
    setTimeout(() => this.ensure(), delay);
  }

  private send(operation: string, channel: WsChannel, symbol: string) {
    this.socket?.send(JSON.stringify({ operation, channel, symbol }));
  }
}
