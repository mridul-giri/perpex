import type { Market } from "@perpex/types";
import { Engine } from "./engine";
import type { EngineMarketState } from "./engine";
import { insuranceFund } from "./insurance-fund";
import { EngineError } from "../utils/engine-error";

export class EngineManager {
  private markets = new Map<string, Engine>();

  register(market: Market) {
    if (this.markets.has(market.marketSlug)) {
      throw new EngineError(409, "Market already exists");
    }

    const engine = new Engine(market);

    insuranceFund.seed(market.marketSlug);
    this.markets.set(market.marketSlug, engine);
    return engine;
  }

  get(marketSlug: string) {
    return this.markets.get(marketSlug);
  }

  exportState() {
    return [...this.markets.values()].map((engine) => engine.exportState());
  }

  restoreState(states: EngineMarketState[]) {
    this.markets.clear();
    for (const state of states) {
      const engine = new Engine(state.market);
      engine.importState(state);
      this.markets.set(state.market.marketSlug, engine);
    }
  }
}
