import type { PayloadType, MarketSymbol } from "@perpex/types";
import { Engine } from "./engine";

export class EngineManager {
  private markets = new Map<string, Engine>();

  private register(payload: PayloadType) {
    const market = new Engine();
    this.markets.set(payload.symbol, market);
    return market;
  }

  get(payload: PayloadType) {
    const market = this.markets.get(payload.symbol);
    if (!market) {
      return this.register(payload);
    }
    return market;
  }
}
