import type { Market } from "@perpex/types";
import { Engine } from "./engine";
import type { EngineMarketState } from "./engine";
import { UserService } from "./user";
import { MathchingEngine } from "./matching-engine";
import { PositionManager } from "./position-manager";
import { insuranceFund } from "./insurance-fund";
import { EngineError } from "../utils/engine-error";

export class EngineManager {
  private markets = new Map<string, Engine>();

  register(market: Market) {
    if (this.markets.has(market.marketSlug)) {
      throw new EngineError(409, "Market already exists");
    }

    const engine = this.buildEngine(market);
    insuranceFund.seed(market.marketSlug);
    this.markets.set(market.marketSlug, engine);
    return engine;
  }

  get(marketSlug: string) {
    return this.markets.get(marketSlug);
  }

  exportState(): EngineMarketState[] {
    const states: EngineMarketState[] = [];
    for (const engine of this.markets.values()) {
      states.push(engine.exportState());
    }
    return states;
  }

  restoreState(states: EngineMarketState[]) {
    this.markets.clear();
    for (const state of states) {
      const engine = this.buildEngine(state.market);
      engine.importState(state);
      this.markets.set(state.market.marketSlug, engine);
    }
  }

  private buildEngine(market: Market) {
    return new Engine(
      market,
      new UserService(),
      new MathchingEngine(),
      new PositionManager(),
    );
  }
}
